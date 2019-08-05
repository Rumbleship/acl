import * as jwt from 'jsonwebtoken';
import { AccessClaims, GrantTypes, RolesAt, Roles, RefreshClaims } from './types';

export function createAuthHeader(claims: AccessClaims, secret: string, options?: object): string {
  const accessToken = jwt.sign(claims, secret, options);
  return `Bearer ${accessToken}`;
}

export function createRefreshToken(
  owner: string,
  secret: string,
  options: object = { expiresIn: '9h' }
) {
  const claims: RefreshClaims = {
    owner,
    grant_type: GrantTypes.REFRESH
  };
  return jwt.sign(claims, secret, options);
}

export function baseRoles(): RolesAt {
  return Object.values(Roles).reduce((base, key) => ({ ...base, [key]: [] }), {});
}

// Taken from `type-graphql` as a useful utility.
export function getArrayFromOverloadedRest<T>(overloadedArray: Array<T | T[]>): T[] {
  const items: T[] = Array.isArray(overloadedArray[0])
    ? (overloadedArray[0] as T[])
    : (overloadedArray as T[]);

  return items;
}
