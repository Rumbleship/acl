import { PermissionsMatrix, Claims, Actions, Resource, PermissionSource, RolesAt } from './types';
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
    /**
     * Type-GraphQL compatible method that singularly answers the question:
     * "Given the accessToken that this Authorizer represents:
     *    - can I take an Action against an Authorizable object, given a set of Permissions
     *      defined by a TypeGraphQL Authorized decorator"
     * @param action The action under consideration, typically query|mutation in GQL
     * @param authorizable In a RESTful world, an object whose entiriety should be authorized.
     *                      In A GQL world, an object with fields being individually authorized.
     * @param matrix The permission matrix defined in the GQL model via Authorized decorator
     * @param attribute? The attribute that should be used to index into the `authorizable`
     * @param resource? An override if `authorizeable.constructor.name` is not the group of
     *                    actions to permission against
     */
    can(action: Actions, authorizable: object, matrix?: PermissionsMatrix, attribute?: string, resource?: Resource): boolean;
    /**
     *
     * @param param0 Deprecated, backward-compatible exported method for old Alpha compatibility.
     * @warning DO NOT USE!
     */
    allowed({ to: action, from: resource, match: attribute, against: authorizable }: {
        to: Actions;
        from?: Resource;
        match?: string;
        against: object;
    }): boolean;
    isUserSysAdmin(): boolean;
}
