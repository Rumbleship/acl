import * as jwt from 'jsonwebtoken';
import {
  PermissionsMatrix,
  Claims,
  // Roles,
  Scopes,
  Actions,
  Resource,
  RolesAt,
  PermissionsGroup
} from './types';
import { baseRoles, getArrayFromOverloadedRest } from './helpers';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
export class Authorizer {
  private accessToken: string;
  private roles?: RolesAt;
  private scopes: Scopes[] = [];
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

  authenticate(): boolean {
    const { roles, scopes } = jwt.verify(this.accessToken, this.secret) as Claims;
    this.roles = roles;
    this.scopes = scopes;
    return !!this.roles;
  }

  getRoles(): RolesAt {
    return this.roles || baseRoles();
  }

  // Can't figure out why Hapi needs this passed through its auth layer right now -- oh well.
  getClaims(): Claims {
    return jwt.verify(this.accessToken, this.secret) as Claims;
  }

  /**
   * Type-GraphQL compatible method that singularly answers the question:
   * "Given the accessToken that this Authorizer represents:
   *    - can I take an Action against an Authorizable object, given a set of Permissions
   *      defined by a TypeGraphQL Authorized decorator"
   * @param action The action under consideration, typically query|mutation in GQL
   * @param authorizable In a RESTful world, an object whose entiriety should be authorized.
   *                      In A GQL world, an object with fields being individually authorized.
   * @param matrix The permission matrix defined in the GQL model via Authorized decorator
   *                --or-- A list of roles that generically have access without inflecting
   *                  on the identity of a record|resource. Useful for authorizing APIs in TGQL
   *                  e.g. mutators and queries
   * @param attribute? The attribute that should be used to index into the `authorizable`
   * @param resource? An override if `authorizeable.constructor.name` is not the group of
   *                    actions to permission agaiXnst
   */
  public can(
    action: Actions,
    authorizable: object,
    matrix: PermissionsMatrix[],
    attribute?: string,
    resource?: Resource
  ) {
    if (!this.roles) {
      throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
    }

    let access = false;

    if (this.inScope(Scopes.SYSADMIN)) {
      return true;
    }

    for (const permissions of matrix) {
      for (const [role, group] of Object.entries(permissions)) {
        const permissionedIdentifiers = (this.roles as any)[role] || [];
        /**
         * If a resource has been passed in, use that to select the group of permissions we're interested in
         * If not, guess at the group by inflecting on the name of the record we're authorizing
         */
        const actions = resource
          ? (group as any)[resource] || []
          : (group as any)[authorizable.constructor.name] || [];

        if (attribute) {
          if (
            permissionedIdentifiers.includes((authorizable as any)[attribute]) &&
            (actions as any).includes(action)
          ) {
            access = true;
          }
        }

        // passed in overrides didn't get us access; now we have to search.
        if (!access) {
          for (const [resourceWithPermissions, allowedActions] of Object.entries(
            group as PermissionsGroup
          )) {
            const authorizableAttribute =
              resourceWithPermissions === resource
                ? 'id'
                : `${resourceWithPermissions.toLowerCase()}_id`;
            const identifier = (authorizable as any)[authorizableAttribute];
            if (
              permissionedIdentifiers.includes(identifier) &&
              (allowedActions as any).includes(action)
            ) {
              access = true;
            }
          }
        }
      }
      return access;
    }
    return access;
  }

  inScope(...scopeOrScopeArray: Array<Scopes | Scopes[]>): boolean;
  inScope(...scopeOrScopeArray: Scopes[]): boolean {
    for (const scope of this.scopes) {
      if (getArrayFromOverloadedRest(scopeOrScopeArray).includes(scope)) {
        return true;
      }
    }
    return this.scopes.includes(Scopes.SYSADMIN);
  }
}
