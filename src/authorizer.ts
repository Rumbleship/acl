import * as jwt from 'jsonwebtoken';
import { Oid } from '@rumbleship/oid';
import { OneToUniqueManyMap } from './utils/one-to-unique-many-map';
import { InvalidJWTError } from './errors';
import { Permissions, ResourceAsScopesSingleton } from './permissions-matrix';
import {
  Claims,
  Scopes,
  Actions,
  Roles,
  Resource,
  AccessClaims,
  RefreshClaims,
  GrantTypes
} from './types';
import { getArrayFromOverloadedRest } from './helpers';
import { Requires, Required } from './required.decorator';
import { AuthorizerTreatAsMap, getAuthorizerTreatAs } from './authorizer-treat-as.directive';
import { ISharedSchema, IServiceUserConfig, IAccessTokenConfig } from '@rumbleship/config';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

class RolesAndIdentifiers extends OneToUniqueManyMap<Roles, string> {}

export class Authorizer {
  private static _initialized: boolean = false;
  private static _ServiceUser: IServiceUserConfig;
  private static _AccessToken: IAccessTokenConfig;
  protected static get config(): Pick<ISharedSchema, 'AccessToken' | 'ServiceUser'> {
    if (!this._initialized) {
      throw new Error('Must initialize Authorizer');
    }
    return {
      AccessToken: this._AccessToken,
      ServiceUser: this._ServiceUser
    };
  }
  private accessToken: string;
  private roles: RolesAndIdentifiers = new RolesAndIdentifiers();
  private get user(): string {
    return this._claims?.user as string;
  }
  private get scopes(): Scopes[] {
    return this._claims?.scopes ?? [];
  }

  private _claims?: Claims;
  private get claims(): Claims {
    if (!this._claims) {
      throw new Error('Authorizer must be authenticated');
    }
    return this._claims;
  }

  static initialize(config: Pick<ISharedSchema, 'AccessToken' | 'ServiceUser'>) {
    this._AccessToken = { ...config.AccessToken };
    this._ServiceUser = { ...config.ServiceUser };
    this._initialized = true;
  }
  static createAuthHeader(
    claims: AccessClaims,
    jwt_options: jwt.SignOptions = { expiresIn: '9h' }
  ) {
    if (claims.scopes.includes(Scopes.SYSADMIN)) {
      if (!claims.user) {
        claims.user = this.config.ServiceUser.id;
      }
    } else {
      if (!claims.user) {
        throw new Error('Cannot create an authHeader without specifying user claim');
      }
    }

    const access_token = jwt.sign(claims, this.config.AccessToken.secret, jwt_options);
    return `Bearer ${access_token}`;
  }

  static createRefreshToken(user: string, jwt_options: jwt.SignOptions = { expiresIn: '9h' }) {
    const claims: RefreshClaims = {
      user,
      grant_type: GrantTypes.REFRESH
    };
    return jwt.sign(claims, this.config.AccessToken.secret, jwt_options);
  }

  static make(
    header_or_marshalled_claims: string,
    authenticate_immediately: boolean = false
  ): Authorizer {
    if (!Authorizer._initialized) {
      throw new Error('Must initialize Authorizer');
    }
    const authorizer = (() => {
      if (header_or_marshalled_claims?.match(BEARER_TOKEN_REGEX)) {
        return new Authorizer(header_or_marshalled_claims);
      }
      const hydrated_claims: Claims = JSON.parse(
        new Buffer(header_or_marshalled_claims, 'base64').toString('ascii')
      );
      return new Authorizer(Authorizer.createAuthHeader(hydrated_claims));
    })();
    if (authenticate_immediately) {
      authorizer.authenticate();
    }
    return authorizer;
  }

  constructor(private authorizationHeader: string) {
    if (!Authorizer._initialized) {
      throw new Error('Must initialize Authorizer');
    }
    if (!this.authorizationHeader) {
      throw new InvalidJWTError('`authorizationHeader` is required by Authorizer');
    }
    if (!this.authorizationHeader.match(BEARER_TOKEN_REGEX)) {
      throw new InvalidJWTError(
        '`authorizationHeader` must be in form `Bearer {{jwt.claims.here}}'
      );
    }

    this.accessToken = this.authorizationHeader.split(' ')[1];
  }

  // To come...get new claims, or something?
  // refresh() {
  //   // stub
  // }

  /**
   *
   * @param {jwt.SignOptions} new_jwt_options
   * @note I don't really like this, but without the true auth server, this is required
   * to be able to effectively continuously authorize long-lived subscriptions.
   */
  extend(new_jwt_options: jwt.SignOptions = { expiresIn: '9h' }) {
    const claims_clone = { ...this.claims };
    delete claims_clone.iat;
    delete claims_clone.exp;
    this.accessToken = Authorizer.createAuthHeader(claims_clone, new_jwt_options).split(' ')[1];
    this.authenticate();
  }

  isExpired(): boolean {
    try {
      jwt.verify(this.accessToken, Authorizer.config.AccessToken.secret);
      return false;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return true;
      }
      throw error;
    }
  }

  marshalClaims(): string {
    const claims = { ...this.claims };
    delete claims.iat;
    delete claims.exp;
    return new Buffer(JSON.stringify(claims)).toString('base64');
  }

  @Required()
  authenticate(): void {
    this._claims = jwt.verify(this.accessToken, Authorizer.config.AccessToken.secret) as Claims;
    for (const [role, group] of Object.entries(this._claims.roles || {})) {
      if (group) {
        this.roles.add(role as Roles, group);
      }
    }
  }

  @Requires('authenticate')
  getUser(): string {
    return this.user as string;
  }

  /**
   * Type-GraphQL compatible method that singularly answers the question:
   * "Given the accessToken that this Authorizer represents:
   *    - can I take an Action against an Authorizable object, given a set of Permissions"
   * @param requestedAction The action under consideration, typically query|mutation in GQL
   * @param authorizable The record being authorized before being returned to the requesting User
   * @param matrix The permission matrix defined in the GQL model via Authorized decorator
   * @param treateAuthorizableAttributesAs A map that connects `Resources` to a `Set<attributes>` that should
   * be associated with them, e.g. `Division: [buyer_id, supplier_id]`. Defaults to inflecting
   * `_id` suffix for each resource, and automatically collects whatever directives have been set
   *  via the `@AuthorizerTreatAs` decorator.
   *
   * @example: ```
   *   const matrix = new Permissions();
   *   matrix.allow({role: Roles.USER, at: Resource.User, to: [Actions.READ, Actions.UPDATE, Actions.CREATE]})
   *   matrix.allow({role: Roles.USER, at: Resource.Division, to: [Actions.READ]})
   *   matrix.allow({role: Roles.ADMIN, at: Resource.Division, to: [Actions.CREATE, Actions.UPDATE, Actions.READ]})
   *   class Workflow {
   *     @AuthorizerTreatAs(Resource.Division)
   *     counterparty_id: string;
   *     @AuthorizerTreatAs(Resource.Division)
   *     division_id: string;
   *     @AuthorizerTreatAs(Resource.User)
   *     owner_id: string;
   *     constructor(owner_id: string) {}
   *   }
   *   const authorizer = new Authorizer(jwt.encode({roles: [user: {user:['u_abcde']}]})).authenticate()
   *   authorizer.can(Actions.READ, new Workflow('u_abcde'), matrix ) // true;
   *   authorizer.can(Actions.READ, new Workflow('u_12345'), matrix ) // false;
   * ```
   */
  @Requires('authenticate')
  public can(
    requestedAction: Actions,
    authorizable: object,
    matrix: Permissions,
    treatAuthorizableAttributesAs: AuthorizerTreatAsMap = getAuthorizerTreatAs(authorizable)
  ) {
    let access = false;

    if (this.inScope(Scopes.SYSADMIN)) {
      return true;
    }

    for (const [role, roleAtResourceCanDoThis] of matrix.entries()) {
      for (const [resource, allowedActions] of roleAtResourceCanDoThis.entries()) {
        if (!allowedActions.has(requestedAction)) {
          access = false;
          break;
        }
        for (const permissionedIdentifier of this.roles.get(role)) {
          for (const checkThisAttribute of treatAuthorizableAttributesAs.get(resource)) {
            const value = Reflect.get(authorizable, checkThisAttribute);
            const authorizableMatchesOnAttr = value === permissionedIdentifier;
            const actionIsAllowed = matrix.allows({
              role,
              at: resource,
              to: requestedAction
            });
            if (authorizableMatchesOnAttr && actionIsAllowed) {
              return true;
            }
          }
        }
      }
    }
    return access;
  }

  @Requires('authenticate')
  identifiersThatCan({
    action,
    matrix,
    only
  }: {
    action: Actions | Actions[];
    matrix: Permissions;
    only?: Resource;
  }): string[] {
    let ids: string[] = [];
    for (const [role, idsWithRoleFromJWT] of this.roles.entries()) {
      ids = ids.concat(
        Array.from(idsWithRoleFromJWT).filter(id => {
          const resource = new Oid(id).unwrap().scope as Resource;
          return matrix.allows({ role, at: resource, to: action });
        })
      );
    }
    if (only) {
      ids = ids.filter(id => {
        const { scope } = new Oid(id).unwrap();
        const a = ResourceAsScopesSingleton.get(scope);
        const b = ResourceAsScopesSingleton.get(only);
        return a === b;
      });
    }
    return ids;
  }

  inScope(...scopeOrScopeArray: Array<Scopes | Scopes[]>): boolean;
  @Requires('authenticate')
  inScope(...scopeOrScopeArray: Scopes[]): boolean {
    for (const scope of this.scopes as Scopes[]) {
      if (getArrayFromOverloadedRest(scopeOrScopeArray).includes(scope)) {
        return true;
      }
    }
    return (this.scopes as Scopes[]).includes(Scopes.SYSADMIN);
  }
}
