import * as jwt from 'jsonwebtoken';
import { Oid } from '@rumbleship/oid';
import { OneToUniqueManyMap } from './utils/one-to-unique-many-map';
import { Permissions, ResourceAsScopesSingleton } from './permissions-matrix';
import { Claims, Scopes, Actions, Roles, Resource } from './types';
import { getArrayFromOverloadedRest } from './helpers';
import { Requires, Required } from './required.decorator';
import { AuthorizerTreatAsMap, getAuthorizerTreatAs } from './authorizer-treat-as.directive';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

class RolesAndIdentifiers extends OneToUniqueManyMap<Roles, string> {}

export class Authorizer {
  private accessToken: string;
  private user?: string; // oid.
  private client?: string;
  private scopes?: Scopes[] = [];
  private owner?: string;
  private _roles?: RolesAndIdentifiers;

  get roles(): RolesAndIdentifiers {
    return this._roles || new RolesAndIdentifiers();
  }
  set roles(v: RolesAndIdentifiers) {
    this._roles = v;
  }
  constructor(private authorizationHeader: string, private secret: string) {
    if (!this.authorizationHeader) {
      throw new Error('`authorizationHeader` is required by Authorizer');
    }
    if (!this.authorizationHeader.match(BEARER_TOKEN_REGEX)) {
      throw new Error('`authorizationHeader` must be in form `Bearer {{jwt.claims.here}}');
    }

    this.accessToken = this.authorizationHeader.split(' ')[1];

    if (!this.secret) {
      throw new Error('`secret` is required by Authorizer');
    }
  }

  @Required()
  authenticate(): boolean {
    const { roles, scopes, user, client, owner } = jwt.verify(
      this.accessToken,
      this.secret
    ) as Claims;
    this.user = user;
    this.scopes = scopes;
    this.client = client;
    this.owner = owner;
    this.roles = new RolesAndIdentifiers();
    for (const [role, group] of Object.entries(roles)) {
      if (group) {
        this.roles.add(role as Roles, group);
      }
    }
    return !!roles;
  }

  @Requires('authenticate')
  getUser(): string {
    return this.user as string;
  }

  @Requires('authenticate')
  getRoles() {
    return this.roles;
  }

  @Requires('authenticate')
  getClient(): string | undefined {
    return this.client;
  }
  @Requires('authenticate')
  getOwner(): string | undefined {
    // this really should return an unwrappable Oid...
    return this.owner;
  }

  @Requires('authenticate')
  getAuthorizationHeader(): string {
    return this.authorizationHeader;
  }
  // I think this is leftover cruft? Would like to remove.
  getClaims(): Claims {
    return jwt.verify(this.accessToken, this.secret) as Claims;
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
   *   // Partial...
   *   const matrix = {
   *     [Roles.USER]: {
   *       [Resource.User]: [Actions.READ, Actions.UPDATE, Actions.CREATE],
   *       [Resource.Division]: [Actions.READ]
   *     },
   *     [Roles.ADMIN]: {
   *       [Resource.Division]: [Actions.CREATE, Actions.UPDATE, Actions.READ]
   *     }
   *   }
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
