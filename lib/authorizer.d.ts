import { PermissionsMatrix, IAllowedQuery, Claims, Actions, PermissionSource, RolesAt } from './types';
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
