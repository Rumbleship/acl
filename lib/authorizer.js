"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const types_1 = require("./types");
const helpers_1 = require("./helpers");
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
class Authorizer {
    // private user?: string;
    // private name?: string;
    // private client?: string;
    // private exp?: Date;
    constructor(authorizationHeader, secret) {
        this.authorizationHeader = authorizationHeader;
        this.secret = secret;
        this.scopes = [];
        if (!this.authorizationHeader) {
            throw new Error('`authorizationHeader` is required by Authorizer');
        }
        if (!this.authorizationHeader.match(BEARER_TOKEN_REGEX)) {
            throw new Error('`authorizationHeader` must be in form `Bearer {{jwt.claims.here}}');
        }
        this.accessToken = this.authorizationHeader.split(' ')[1];
        if (!this.secret) {
            throw new Error('`secret` is required by Authorizer');
        }
    }
    authenticate() {
        const { roles, scopes } = jwt.verify(this.accessToken, this.secret);
        this.roles = roles;
        this.scopes = scopes;
        return !!this.roles;
    }
    getRoles() {
        return this.roles || helpers_1.baseRoles();
    }
    // Can't figure out why Hapi needs this passed through its auth layer right now -- oh well.
    getClaims() {
        return jwt.verify(this.accessToken, this.secret);
    }
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
    can(action, authorizable, matrix, attribute, resource) {
        if (!this.roles) {
            throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
        }
        let access = false;
        if (typeof matrix[0] === 'string') {
            for (const scope of this.scopes) {
                if (matrix.includes(scope)) {
                    return true;
                }
            }
            return false;
        }
        if (this.inScope(types_1.Scopes.SYSADMIN)) {
            return true;
        }
        const permissions = matrix[0];
        for (const [role, group] of Object.entries(permissions)) {
            const permissionedIdentifiers = this.roles[role] || [];
            /**
             * If a resource has been passed in, use that to select the group of permissions we're interested in
             * If not, guess at the group by inflecting on the name of the record we're authorizing
             */
            const actions = resource
                ? group[resource] || []
                : group[authorizable.constructor.name] || [];
            if (attribute) {
                if (permissionedIdentifiers.includes(authorizable[attribute]) &&
                    actions.includes(action)) {
                    access = true;
                }
            }
            // passed in overrides didn't get us access; now we have to search.
            if (!access) {
                for (const [resourceWithPermissions, allowedActions] of Object.entries(group)) {
                    const authorizableAttribute = resourceWithPermissions === resource
                        ? 'id'
                        : `${resourceWithPermissions.toLowerCase()}_id`;
                    const identifier = authorizable[authorizableAttribute];
                    if (permissionedIdentifiers.includes(identifier) &&
                        allowedActions.includes(action)) {
                        access = true;
                    }
                }
            }
        }
        return access;
    }
    inScope(...scopeOrScopeArray) {
        for (const scope of this.scopes) {
            if (helpers_1.getArrayFromOverloadedRest(scopeOrScopeArray).includes(scope)) {
                return true;
            }
        }
        return false;
    }
}
exports.Authorizer = Authorizer;
//# sourceMappingURL=authorizer.js.map