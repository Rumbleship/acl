import { RolesAt, Roles } from './types';

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
