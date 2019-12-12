import { PermissionsMatrix, Claims, Scopes, Actions, RolesAt } from './types';
import { AuthorizerTreatAsMap } from './decorators';
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
     */
    can(action: Actions, authorizable: object, matrix: PermissionsMatrix[], attributeResourceMap?: AuthorizerTreatAsMap): boolean;
    inScope(...scopeOrScopeArray: Array<Scopes | Scopes[]>): boolean;
}
