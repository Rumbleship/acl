import * as jwt from 'jsonwebtoken';
import {
  PermissionsMatrix,
  IAllowedQuery,
  Claims,
  ClaimsInput,
  Roles,
  Actions,
  Resource,
  PermissionSource,
  RolesAt
} from './types';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
export class Authorizer {
  private accessToken: string;
  private roles?: RolesAt;
  // private user?: string;
  // private name?: string;
  // private client?: string;
  private exp?: Date;
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

  authenticate(): void {
    const { roles, exp } = jwt.verify(this.accessToken, this.secret) as Claims;
    this.roles = roles;
    this.exp = exp;
  }

  isAuthenticated(): boolean {
    // probably and some logic on expiry here too.
    if ((this.exp as Date) < new Date()) {
      throw new Error('expired');
    }
    return !!this.roles;
  }

  getRoles(): RolesAt {
    return this.roles || baseRoles();
  }

  // Can't figure out why Hapi needs this passed through its auth layer right now -- oh well.
  getClaims(): Claims {
    return jwt.verify(this.accessToken, this.secret) as Claims;
  }
  allowed(options: IAllowedQuery): boolean {
    if (!this.roles) {
      throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
    }
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
              authorizable,
              from
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
    if (!this.roles) {
      return false;
    }
    return Object.values(this.roles).every((identifiersWithPermissions: string[]) =>
      identifiersWithPermissions.includes('*')
    );
  }
  private permissionsBeingConsidered(role: Roles, authorizable: any, from?: Resource): Actions[] {
    const permissionable = from || authorizable.constructor.name;
    if (permissionable === 'Object') {
      throw new Error('Cannot permission on generic `Object`');
    }
    if (!this.matrix[role]) {
      return [];
    }
    return this.matrix[role][permissionable];
  }
}

export function createAuthHeader(claims: ClaimsInput, secret: string, options?: object): string {
  const accessToken = jwt.sign(claims, secret, options);
  return `Bearer ${accessToken}`;
}

export function baseRoles(): RolesAt {
  return Object.values(Roles).reduce((base, key) => ({ ...base, [key]: [] }), {});
}

export function sysAdminRoles(): RolesAt {
  const roles: RolesAt = baseRoles();
  Object.keys(roles).forEach(role => roles[role].push('*'));
  return roles;
}
