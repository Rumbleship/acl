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
    constructor(authorizationHeader, secret, sourceType = types_1.PermissionSource.MATRIX, matrix = {
        [types_1.Roles.ADMIN]: {},
        [types_1.Roles.USER]: {},
        [types_1.Roles.PENDING]: {}
    }) {
        this.authorizationHeader = authorizationHeader;
        this.secret = secret;
        this.sourceType = sourceType;
        this.matrix = matrix;
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
        if (this.sourceType === types_1.PermissionSource.MATRIX && !this.matrix) {
            throw new Error('Cannot use sourceType `MATRIX` without specifying the matrix to reference');
        }
    }
    authenticate() {
        const { roles } = jwt.verify(this.accessToken, this.secret);
        this.roles = roles;
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
     *      defined by a TypeGraphQL @Authorized decorator"
     * @param action The action under consideration, typically query|mutation in GQL
     * @param authorizable In a RESTful world, an object whose entiriety should be authorized.
     *                      In A GQL world, an object with fields being individually authorized.
     * @param matrix The permission matrix defined in the GQL model via @Authorized
     * @param attribute? The attribute that should be used to index into the `authorizable`
     * @param resource? An override if `authorizeable.constructor.name` is not the group of
     *                    actions to permission against
     */
    can(action, authorizable, matrix, attribute, resource) {
        if (!this.roles) {
            throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
        }
        if ((resource || authorizable.constructor.name) === 'Object') {
            throw new Error('Cannot permission on generic `Object`');
        }
        if (this.isUserSysAdmin()) {
            return true;
        }
        let access = false;
        const permissions = matrix || this.matrix;
        for (const [role, group] of Object.entries(permissions)) {
            const actions = resource
                ? group[resource]
                : group[authorizable.constructor.name] || [];
            // If a PermissionMatrix has been passed in, use it, and implicitly assume we're in TypeGraphQL-land
            const authorizableAttribute = matrix
                ? authorizable.constructor.name === resource
                    ? // New services treat `id` as an unwrapable OID (whether hashid or uuid-wrapped)
                        'id'
                    : `${(resource || authorizable.constructor.name).toLowerCase()}_id`
                : // If a matrix hasn't been passed in, we can safely assume that we're in old Alpha|Mediator code,
                    // where `id` and `hashid` are treated distinctly. Default to picking out `hashid`, but let invoker
                    // override by passing the `attribute` variable.
                    attribute || 'hashid';
            const identifier = authorizable[authorizableAttribute];
            const permissionedIdentifiers = this.roles[role] || [];
            if (permissionedIdentifiers.includes(identifier) && actions.includes(action)) {
                access = true;
            }
        }
        return access;
    }
    /**
     *
     * @param param0 Deprecated, backward-compatible exported method for old Alpha compatibility.
     * @warning DO NOT USE!
     */
    allowed({ to: action, from: resource, match: attribute = 'hashid', against: authorizable }) {
        return this.can(action, authorizable, undefined, attribute, resource);
    }
    isUserSysAdmin() {
        if (!this.roles) {
            return false;
        }
        return Object.values(this.roles).every((identifiersWithPermissions = []) => identifiersWithPermissions.includes('*'));
    }
}
exports.Authorizer = Authorizer;
//# sourceMappingURL=authorizer.js.map