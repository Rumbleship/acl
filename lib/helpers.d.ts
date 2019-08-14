import { AccessClaims, RolesAt } from './types';
export declare function createAuthHeader(claims: AccessClaims, secret: string, options?: object): string;
export declare function createRefreshToken(owner: string, secret: string, options?: object): string;
export declare function baseRoles(): RolesAt;
export declare function getArrayFromOverloadedRest<T>(overloadedArray: Array<T | T[]>): T[];
