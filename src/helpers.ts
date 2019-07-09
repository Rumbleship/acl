import * as jwt from 'jsonwebtoken';
import { ClaimsInput, RolesAt, Roles } from './types';

export function createAuthHeader(claims: ClaimsInput, secret: string, options?: object): string {
  const accessToken = jwt.sign(claims, secret, options);
  return `Bearer ${accessToken}`;
}

export function baseRoles(): RolesAt {
  return Object.values(Roles).reduce((base, key) => ({ ...base, [key]: [] }), {});
}

export function sysAdminRoles(): RolesAt {
  const roles: RolesAt = baseRoles();
  /// as any below is because RolesAt has possibly undefined members.
  (Object.keys(roles) as Roles[]).forEach(role => (roles[role] as any).push('*'));
  return roles;
}
