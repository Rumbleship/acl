import * as jwt from 'jsonwebtoken';
import { ClaimsInput, RolesAt, Roles } from './types';

export function createAuthHeader(claims: ClaimsInput, secret: string, options?: object): string {
  const accessToken = jwt.sign(claims, secret, options);
  return `Bearer ${accessToken}`;
}

export function baseRoles(): RolesAt {
  return Object.values(Roles).reduce((base, key) => ({ ...base, [key]: [] }), {});
}
