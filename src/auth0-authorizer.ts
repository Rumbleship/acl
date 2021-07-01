import * as jwt from 'jsonwebtoken';
import * as jwks from 'jwks-rsa';
import { Oid } from '@rumbleship/oid';
import { Permissions, ResourceAsScopesSingleton } from './permissions-matrix';
import {
  Claims,
  Scopes,
  Actions,
  Resource,
  AccessClaims,
  RefreshClaims,
  GrantTypes
} from './types';
import { getArrayFromOverloadedRest } from './helpers';
import { Requires, Required } from './required.decorator';
import { AuthorizerTreatAsMap, getAuthorizerTreatAs } from './authorizer-treat-as.directive';
import { ISharedSchema } from '@rumbleship/config';
import { Authorizer } from './authorizer';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

export interface Auth0Config {
  domain: string;
  audience: string;
  clientId: string;
}
export class Auth0Authorizer extends Authorizer {
  private static _Auth0: Auth0Config;
  static initialize(
    config: Pick<ISharedSchema, 'AccessToken' | 'ServiceUser'>,
    auth0: Auth0Config
  ): void {
    this._AccessToken = { ...config.AccessToken };
    this._ServiceUser = { ...config.ServiceUser };
    this._Auth0 = { ...auth0 };
    this._initialized = true;
  }
  static createAuthHeader(
    claims: AccessClaims,
    jwt_options: jwt.SignOptions = { expiresIn: '9h' }
  ): string {
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

  static createServiceUserAuthHeader(jwt_options: jwt.SignOptions = { expiresIn: '5m' }): string {
    return this.createAuthHeader(
      {
        roles: {},
        scopes: [Scopes.SYSADMIN],
        user: this.config.ServiceUser.id
      },
      jwt_options
    );
  }

  static createRefreshToken(
    user: string,
    jwt_options: jwt.SignOptions = { expiresIn: '9h' }
  ): string {
    const claims: RefreshClaims = {
      user,
      grant_type: GrantTypes.REFRESH
    };
    return jwt.sign(claims, this.config.AccessToken.secret, jwt_options);
  }

  static make(
    header_or_marshalled_claims: string,
    authenticate_immediately = false
  ): Auth0Authorizer {
    if (!Auth0Authorizer._initialized) {
      throw new Error('Must initialize Authorizer');
    }
    const authorizer = (() => {
      if (header_or_marshalled_claims?.match(BEARER_TOKEN_REGEX)) {
        return new Auth0Authorizer(header_or_marshalled_claims);
      }
      const hydrated_claims: Claims = JSON.parse(
        Buffer.from(header_or_marshalled_claims, 'base64').toString('ascii')
      );
      return new Auth0Authorizer(Auth0Authorizer.createAuthHeader(hydrated_claims));
    })();
    if (authenticate_immediately) {
      void authorizer.authenticate();
    }
    return authorizer;
  }

  /**
   *
   * @param {jwt.SignOptions} new_jwt_options
   * @note I don't really like this, but without the true auth server, this is required
   * to be able to effectively continuously authorize long-lived subscriptions.
   */
  extend(new_jwt_options: jwt.SignOptions = { expiresIn: '9h' }): void {
    const claims_clone = { ...this.claims };
    delete (claims_clone as any).iat;
    delete (claims_clone as any).exp;
    this.accessToken = Auth0Authorizer.createAuthHeader(claims_clone, new_jwt_options).split(
      ' '
    )[1];
    void this.authenticate();
  }

  isExpired(): boolean {
    try {
      jwt.verify(this.accessToken, Auth0Authorizer.config.AccessToken.secret);
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
    delete (claims as any).iat;
    delete (claims as any).exp;
    return Buffer.from(JSON.stringify(claims)).toString('base64');
  }

  @Required()
  async authenticate(): Promise<void> {
    const decoded: { kid: string | number } & any = jwt.decode(this.accessToken);
    const client = new jwks.JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${Auth0Authorizer._Auth0.domain}/.well-known/jwks.json`
    });

    await client
      .getSigningKey(decoded.kid)
      .then(key => jwt.verify(this.accessToken, key.getPublicKey(), { algorithms: [key.alg] }));
  }

  @Requires('authenticate')
  getUser(): string {
    return this.user as string;
  }

  @Requires('authenticate')
  getOnBehalfOf(): Oid | undefined {
    return this.on_behalf_of;
  }

  /**
   * @deprecated in favor of `marshalClaims()` + `Authorizer.make()`. Old Mediator code requires
   * access to the raw claims. Chore: https://www.pivotaltracker.com/story/show/174103802
   */
  getClaims(): Claims {
    return { ...this.claims };
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
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    authorizable: any,
    matrix: Permissions,
    treatAuthorizableAttributesAs: AuthorizerTreatAsMap = getAuthorizerTreatAs(authorizable)
  ): boolean {
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
