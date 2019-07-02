import * as jwt from 'jsonwebtoken';
import {
  PermissionsMatrix,
  IAllowedQuery,
  RumbleshipAccessTokenSignature,
  Roles,
  Actions,
  Resource,
  PermissionSource,
  RolesAt
} from './types';
export class Authorizer {
  private roles: RolesAt;
  // private user?: string;
  // private name?: string;
  // private client?: string;
  // private exp?: Date;

  constructor(
    private accessToken: string,
    private secret: string,
    private sourceType: PermissionSource = PermissionSource.MATRIX,
    private matrix: PermissionsMatrix = {
      [Roles.ADMIN]: {},
      [Roles.USER]: {},
      [Roles.PENDING]: {}
    }
  ) {
    if (!this.accessToken) {
      throw new Error('`accessToken` is required by Authorizer');
    }
    if (!this.secret) {
      throw new Error('`secret` is required by Authorizer');
    }
    if (this.sourceType === PermissionSource.MATRIX && !this.matrix) {
      throw new Error('Cannot use sourceType `MATRIX` without specifying the matrix to reference');
    }
    const { /* user, client, name, exp, */ roles } = jwt.verify(
      this.accessToken,
      this.secret
    ) as RumbleshipAccessTokenSignature;
    // this.name = name;
    // this.user = user;
    this.roles = roles;
    // this.client = client;
    // this.exp = exp;
  }

  allowed(options: IAllowedQuery): boolean {
    const { to: permission, from, match: attribute = 'hashid', against: authorizable } = options;
    let access = false;

    switch (this.sourceType) {
      case PermissionSource.DECORATOR:
        throw new Error('decorators not currently supported');
      case PermissionSource.MATRIX:
        (Object.entries(this.roles) as [[Roles, string[]]]).forEach(
          ([role, identifiersWithPermissions]) => {
            const permissions: Actions[] = this.permissionsBeingConsidered(
              role,
              from,
              authorizable
            );
            const identifier = (authorizable as any)[attribute];
            if (
              this.isUserSysAdmin() ||
              (identifiersWithPermissions.includes(identifier) && permissions.includes(permission))
            ) {
              access = true;
            }
          }
        );
        break;
    }

    return access;
  }

  isUserSysAdmin(): boolean {
    return Object.values(this.roles).every((identifiersWithPermissions: string[]) =>
      identifiersWithPermissions.includes('*')
    );
  }
  private permissionsBeingConsidered(role: Roles, from: Resource, authorizable: object): Actions[] {
    const permissionable = from || authorizable.constructor.name;
    if (!this.matrix[role]) {
      return [];
    }
    return this.matrix[role][permissionable];
  }
}
