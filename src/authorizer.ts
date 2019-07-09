import * as jwt from 'jsonwebtoken';
import {
  PermissionsMatrix,
  IAllowedQuery,
  Claims,
  Roles,
  Actions,
  Resource,
  PermissionSource,
  RolesAt,
  PermissionsGroup
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

  allowedDecorator(
    matrix: PermissionsMatrix,
    action: Actions,
    authorizable: object
    // against: string
  ) {
    if (!this.roles) {
      throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
    }
    if (this.isUserSysAdmin()) {
      return true;
    }

    let access = false;

    (Object.entries(matrix) as [[Roles, PermissionsGroup]]).forEach(
      ([roleWithPermissionsDefined, actionsAllowed]) => {
        Object.entries(actionsAllowed as [Resource, Actions[]]).forEach(([resource, actions]) => {
          const authorizableAttribute =
            authorizable.constructor.name === resource ? 'id' : `${resource.toLowerCase()}_id`;
          if (
            (this.roles as any)[roleWithPermissionsDefined].includes(
              (authorizable as any)[authorizableAttribute]
            ) &&
            actions.includes(action)
          ) {
            access = true;
          }
        });
      }
    );

    return access;
  }

  allowed(options: IAllowedQuery): boolean {
    if (!this.roles) {
      throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
    }
    const { to: permission, from, match: attribute = 'hashid', against: authorizable } = options;
    let access = false;

    (Object.entries(this.roles) as [[Roles, string[]]]).forEach(
      ([role, identifiersWithPermissions]) => {
        const permissions: Actions[] = this.permissionsBeingConsidered(role, authorizable, from);
        const identifier = (authorizable as any)[attribute];
        if (
          this.isUserSysAdmin() ||
          (identifiersWithPermissions.includes(identifier) && permissions.includes(permission))
        ) {
          access = true;
        }
      }
    );

    return access;
  }

  isUserSysAdmin(): boolean {
    if (!this.roles) {
      return false;
    }
    return Object.values(this.roles).every((identifiersWithPermissions: string[] = []) =>
      identifiersWithPermissions.includes('*')
    );
  }
  private permissionsBeingConsidered(role: Roles, authorizable: any, from?: Resource): Actions[] {
    const permissionable = from || (authorizable.constructor.name as string);
    if (permissionable === 'Object') {
      throw new Error('Cannot permission on generic `Object`');
    }
    if (!this.matrix[role]) {
      return [];
    }
    const group: PermissionsGroup = this.matrix[role] as PermissionsGroup;
    return group[permissionable as Resource] as Actions[];
  }
}
