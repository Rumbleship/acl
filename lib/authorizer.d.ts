import { PermissionsMatrix, IAllowedQuery, Claims, ClaimsInput, PermissionSource, RolesAt } from './types';
export declare class Authorizer {
    private authorizationHeader;
    private secret;
    private sourceType;
    private matrix;
    private accessToken;
    private roles?;
    private exp?;
    constructor(authorizationHeader: string, secret: string, sourceType?: PermissionSource, matrix?: PermissionsMatrix);
    authenticate(): void;
    isAuthenticated(): boolean;
    getRoles(): RolesAt;
    getClaims(): Claims;
    allowed(options: IAllowedQuery): boolean;
    isUserSysAdmin(): boolean;
    private permissionsBeingConsidered;
}
export declare function createAuthHeader(claims: ClaimsInput, secret: string, options?: object): string;
export declare function baseRoles(): RolesAt;
export declare function sysAdminRoles(): RolesAt;
