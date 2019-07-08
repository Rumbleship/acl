import { PermissionsMatrix, IAllowedQuery, Claims, ClaimsInput, Actions, PermissionSource, RolesAt } from './types';
export declare class Authorizer {
    private authorizationHeader;
    private secret;
    private sourceType;
    private matrix;
    private accessToken;
    private roles?;
    constructor(authorizationHeader: string, secret: string, sourceType?: PermissionSource, matrix?: PermissionsMatrix);
    authenticate(): boolean;
    getRoles(): RolesAt;
    getClaims(): Claims;
    allowedDecorator(matrix: PermissionsMatrix, action: Actions, authorizable: object): boolean;
    allowed(options: IAllowedQuery): boolean;
    isUserSysAdmin(): boolean;
    private permissionsBeingConsidered;
}
export declare function createAuthHeader(claims: ClaimsInput, secret: string, options?: object): string;
export declare function baseRoles(): RolesAt;
export declare function sysAdminRoles(): RolesAt;
