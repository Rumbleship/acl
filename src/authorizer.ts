import * as jwt from 'jsonwebtoken';
import {
  PermissionsMatrix,
  Claims,
  Scopes,
  Actions,
  // Resource,
  RolesAt,
  PermissionsGroup
} from './types';
import { getArrayFromOverloadedRest } from './helpers';
import { Requires, Required, getAuthorizerTreatAs, AuthorizerTreatAsMap } from './decorators';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

export class Authorizer {
  private accessToken: string;
  private user?: string; // oid.
  private client?: string;
  private roles?: RolesAt;
  private scopes?: Scopes[] = [];
  private owner?: string;

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
    this.roles = roles;
    this.scopes = scopes;
    this.client = client;
    this.owner = owner;
    return !!this.roles;
  }

  @Requires('authenticate')
  getUser(): string {
    return this.user as string;
  }

  @Requires('authenticate')
  getRoles(): RolesAt {
    return this.roles as RolesAt;
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
   * @param action The action under consideration, typically query|mutation in GQL
   * @param authorizable The record being authorized before being returned to the requesting User
   * @param matrix The permission matrix defined in the GQL model via Authorized decorator
   * @param attribute? Explicitly indicate how to index into the `authorizable`
   * @param resource? Explicitly indicate which group in the matrix should be permissioned
   *                  against.
   */
  @Requires('authenticate')
  public can(
    action: Actions,
    authorizable: object,
    matrix: PermissionsMatrix[],
    attributeResourceMap: AuthorizerTreatAsMap = getAuthorizerTreatAs(authorizable)
  ) {
    let access = false;

    if (this.inScope(Scopes.SYSADMIN)) {
      return true;
    }

    for (const permissions of matrix) {
      for (const [role, group] of Object.entries(permissions)) {
        const permissionedIdentifiers = (this.roles as any)[role] || [];
        function inflectAndSearchMatrix() {
          for (const [resourceWithPermissions, allowedActions] of Object.entries(
            group as PermissionsGroup
          )) {
            const authorizableAttribute =
              // If there are explicit attribute mappings passed, do not inflect on the authorizable name.
              // ....not sure why rigt now. But it makes the old test pass.
              attributeResourceMap.size === 0 &&
              resourceWithPermissions === authorizable.constructor.name
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
        for (const [attribute, resources] of attributeResourceMap.entries()) {
          for (const resource of resources.values()) {
            (function checkKnownAttribute() {
              const actions = resource
                ? (group as any)[resource] || []
                : (group as any)[authorizable.constructor.name] || [];
              const attrs = !Array.isArray(attribute) ? [attribute] : attribute;
              for (const attr of attrs) {
                if (
                  permissionedIdentifiers.includes((authorizable as any)[attr]) &&
                  (actions as any).includes(action)
                ) {
                  access = true;
                }
              }
            })();
            (function checkKnownResource() {
              const authorizableAttribute =
                resource === (authorizable.constructor && authorizable.constructor.name)
                  ? 'id'
                  : `${resource.toLowerCase()}_id`;
              const identifier = (authorizable as any)[authorizableAttribute];
              const actions = (group as any)[resource] || [];
              if (permissionedIdentifiers.includes(identifier) && actions.includes(action)) {
                access = true;
              }
            })();
          }
        }
        if (!access) {
          inflectAndSearchMatrix();
        }
      }
      return access;
    }
    return access;
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
