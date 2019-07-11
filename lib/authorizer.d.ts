import { PermissionsMatrix, Claims, Scopes, Actions, Resource, RolesAt } from './types';
export declare class Authorizer {
    private authorizationHeader;
    private secret;
    private accessToken;
    private roles?;
    private scopes;
    constructor(authorizationHeader: string, secret: string);
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
     *                --or-- A list of roles that generically have access without inflecting
     *                  on the identity of a record|resource. Useful for authorizing APIs in TGQL
     *                  e.g. mutators and queries
     * @param attribute? The attribute that should be used to index into the `authorizable`
     * @param resource? An override if `authorizeable.constructor.name` is not the group of
     *                    actions to permission agaiXnst
     */
    can(action: Actions, authorizable: object, matrix: PermissionsMatrix[] | string[], attribute?: string, resource?: Resource): boolean;
    inScope(...scopeOrScopeArray: Array<Scopes | Scopes[]>): boolean;
}
