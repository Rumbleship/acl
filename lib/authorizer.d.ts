import * as jwt from 'jsonwebtoken';
import { Permissions } from './permissions-matrix';
import { Scopes, Actions, Resource, AccessClaims } from './types';
import { AuthorizerTreatAsMap } from './authorizer-treat-as.directive';
import { ISharedSchema } from '@rumbleship/config';
export declare class Authorizer {
    private authorizationHeader;
    private static _initialized;
    private static _ServiceUser;
    private static _AccessToken;
    protected static get config(): Pick<ISharedSchema, 'AccessToken' | 'ServiceUser'>;
    private accessToken;
    private roles;
    private get user();
    private get scopes();
    private _claims?;
    private get claims();
    static initialize(config: Pick<ISharedSchema, 'AccessToken' | 'ServiceUser'>): void;
    static createAuthHeader(claims: AccessClaims, jwt_options?: jwt.SignOptions): string;
    static createRefreshToken(owner: string, jwt_options?: jwt.SignOptions): string;
    static make(header_or_marshalled_claims: string, authenticate_immediately?: boolean): Authorizer;
    constructor(authorizationHeader: string);
    /**
     *
     * @param {jwt.SignOptions} new_jwt_options
     * @note I don't really like this, but without the true auth server, this is required
     * to be able to effectively continuously authorize long-lived subscriptions.
     */
    extend(new_jwt_options?: jwt.SignOptions): void;
    isExpired(): boolean;
    marshalClaims(): string;
    authenticate(): void;
    getUser(): string;
    /**
     * Type-GraphQL compatible method that singularly answers the question:
     * "Given the accessToken that this Authorizer represents:
     *    - can I take an Action against an Authorizable object, given a set of Permissions"
     * @param requestedAction The action under consideration, typically query|mutation in GQL
     * @param authorizable The record being authorized before being returned to the requesting User
     * @param matrix The permission matrix defined in the GQL model via Authorized decorator
     * @param treateAuthorizableAttributesAs A map that connects `Resources` to a `Set<attributes>` that should
     * be associated with them, e.g. `Division: [buyer_id, supplier_id]`. Defaults to inflecting
     * `_id` suffix for each resource, and automatically collects whatever directives have been set
     *  via the `@AuthorizerTreatAs` decorator.
     *
     * @example: ```
     *   const matrix = new Permissions();
     *   matrix.allow({role: Roles.USER, at: Resource.User, to: [Actions.READ, Actions.UPDATE, Actions.CREATE]})
     *   matrix.allow({role: Roles.USER, at: Resource.Division, to: [Actions.READ]})
     *   matrix.allow({role: Roles.ADMIN, at: Resource.Division, to: [Actions.CREATE, Actions.UPDATE, Actions.READ]})
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
    can(requestedAction: Actions, authorizable: object, matrix: Permissions, treatAuthorizableAttributesAs?: AuthorizerTreatAsMap): boolean;
    identifiersThatCan({ action, matrix, only }: {
        action: Actions | Actions[];
        matrix: Permissions;
        only?: Resource;
    }): string[];
    inScope(...scopeOrScopeArray: Array<Scopes | Scopes[]>): boolean;
}
