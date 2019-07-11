import { ClaimsInput, RolesAt } from './types';
export declare function createAuthHeader(claims: ClaimsInput, secret: string, options?: object): string;
export declare function baseRoles(): RolesAt;
