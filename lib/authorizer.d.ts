import { Permissions } from './permissions-matrix';
import { PermissionsMatrix, Claims, Scopes, Actions, RolesAt } from './types';
import { AuthorizerTreatAsMap } from './authorizer-treat-as.directive';
export declare class Authorizer {
    private authorizationHeader;
    private secret;
    private accessToken;
    private user?;
    private client?;
    private roles?;
    private scopes?;
    private owner?;
    constructor(authorizationHeader: string, secret: string);
    authenticate(): boolean;
    getUser(): string;
    getRoles(): RolesAt;
    getClient(): string | undefined;
    getOwner(): string | undefined;
    getAuthorizationHeader(): string;
    getClaims(): Claims;
    /**
     * Type-GraphQL compatible method that singularly answers the question:
     * "Given the accessToken that this Authorizer represents:
     *    - can I take an Action against an Authorizable object, given a set of Permissions"
     * @param action The action under consideration, typically query|mutation in GQL
     * @param authorizable The record being authorized before being returned to the requesting User
     * @param matrix The permission matrix defined in the GQL model via Authorized decorator
     * @param attributeResourceMap A map that connects `Resources` to a `Set<attributes>` that should
     * be associated with them, e.g. `Division: [buyer_id, supplier_id]`. Defaults to inflecting
     * `_id` suffix for each resource, and automatically collects whatever directives have been set
     *  via the `@AuthorizerTreatAs` decorator.
     *
     * @example: ```
     *   // Partial...
     *   const matrix = {
     *     [Roles.USER]: {
     *       [Resource.User]: [Actions.READ, Actions.UPDATE, Actions.CREATE],
     *       [Resource.Division]: [Actions.READ]
     *     },
     *     [Roles.ADMIN]: {
     *       [Resource.Division]: [Actions.CREATE, Actions.UPDATE, Actions.READ]
     *     }
     *   }
     *   class Workflow {
     *     @AuthorizerTreatAs(Resource.Division)
     *     counterparty_id: string;
     *     @AuthorizerTreatAs(Resource.Division)
     *     division_id: string;
     *     @AuthorizerTreatAs(Resource.User)
     *     owner_id: string;
     *     constructor(owner_id: string) {}
     *   }
     *   const authorizer = new Authorizer(jwt.encode({roles: [user: {user:['u_abcde']}]})).authenticate()
     *   authorizer.can(Actions.READ, new Workflow('u_abcde'), matrix ) // true;
     *   authorizer.can(Actions.READ, new Workflow('u_12345'), matrix ) // false;
     * ```
     */
    can(action: Actions, authorizable: object, matrix: Permissions | PermissionsMatrix | PermissionsMatrix[], attributeResourceMap?: AuthorizerTreatAsMap): boolean;
    inScope(...scopeOrScopeArray: Array<Scopes | Scopes[]>): boolean;
}
