import * as jwt from 'jsonwebtoken';
import {
  PermissionsMatrix,
  Claims,
  Roles,
  Actions,
  Resource,
  PermissionSource,
  RolesAt
} from './types';
import { baseRoles } from './helpers';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
export class Authorizer {
  private accessToken: string;
  private roles?: RolesAt;
  // private user?: string;
  // private name?: string;
  // private client?: string;
  // private exp?: Date;
  constructor(
    private authorizationHeader: string,
    private secret: string,
    private sourceType: PermissionSource = PermissionSource.MATRIX,
    private matrix: PermissionsMatrix = {
      [Roles.ADMIN]: {},
      [Roles.USER]: {},
      [Roles.PENDING]: {}
    }
  ) {
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
    if (this.sourceType === PermissionSource.MATRIX && !this.matrix) {
      throw new Error('Cannot use sourceType `MATRIX` without specifying the matrix to reference');
    }
  }

  authenticate(): boolean {
    const { roles } = jwt.verify(this.accessToken, this.secret) as Claims;
    this.roles = roles;
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
   *      defined by a TypeGraphQL @Authorized decorator"
   * @param action The action under consideration, typically query|mutation in GQL
   * @param authorizable In a RESTful world, an object whose entiriety should be authorized.
   *                      In A GQL world, an object with fields being individually authorized.
   * @param matrix The permission matrix defined in the GQL model via @Authorized
   * @param attribute? The attribute that should be used to index into the `authorizable`
   * @param resource? An override if `authorizeable.constructor.name` is not the group of
   *                    actions to permission against
   */
  public can(
    action: Actions,
    authorizable: object,
    matrix?: PermissionsMatrix,
    attribute?: string,
    resource?: Resource
  ) {
    if (!this.roles) {
      throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
    }
    if ((resource || (authorizable.constructor.name as string)) === 'Object') {
      throw new Error('Cannot permission on generic `Object`');
    }

    if (this.isUserSysAdmin()) {
      return true;
    }

    let access = false;

    const permissions = matrix || this.matrix;
    for (const [role, group] of Object.entries(permissions)) {
      const actions = resource
        ? (group as any)[resource]
        : (group as any)[authorizable.constructor.name] || [];

      /**
       * If an attribute to authorize against is passed, it should be used.
       *
       * Otherwise, use presence|absence of a passed PermissionsMatrix to determine if:
       * - default to 'id' (in TypeGraphQL land, where `id` can be wrapped and unwrapped to its OID
       * - default to 'hashid' (legacy), where `id` and `hashid` are stored separately in DB
       */
      const authorizableAttribute = attribute
        ? attribute
        : !!matrix
        ? authorizable.constructor.name === resource
          ? 'id'
          : `${(resource || authorizable.constructor.name).toLowerCase()}_id`
        : 'hashid';

      const identifier = (authorizable as any)[authorizableAttribute];
      const permissionedIdentifiers = (this.roles as any)[role] || [];
      if (permissionedIdentifiers.includes(identifier) && (actions as any).includes(action)) {
        access = true;
      }
    }
    return access;
  }

  /**
   *
   * @param param0 Deprecated, backward-compatible exported method for old Alpha compatibility.
   * @warning DO NOT USE!
   */
  allowed({
    to: action,
    from: resource,
    match: attribute = 'hashid',
    against: authorizable
  }: {
    to: Actions;
    from?: Resource;
    match?: string;
    against: object;
  }): boolean {
    return this.can(action, authorizable, undefined, attribute, resource);
  }

  isUserSysAdmin(): boolean {
    if (!this.roles) {
      return false;
    }
    return Object.values(this.roles).every((identifiersWithPermissions: string[] = []) =>
      identifiersWithPermissions.includes('*')
    );
  }
}
