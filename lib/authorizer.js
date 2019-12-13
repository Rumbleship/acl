"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const one_to_unique_many_map_1 = require("./utils/one-to-unique-many-map");
const permissions_matrix_1 = require("./permissions-matrix");
const jwt = require("jsonwebtoken");
const types_1 = require("./types");
const helpers_1 = require("./helpers");
const required_decorator_1 = require("./required.decorator");
const authorizer_treat_as_directive_1 = require("./authorizer-treat-as.directive");
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
class RolesAndIdentifiers extends one_to_unique_many_map_1.OneToUniqueManyMap {
}
class Authorizer {
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
    get roles() {
        return this._roles || new RolesAndIdentifiers();
    }
    set roles(v) {
        this._roles = v;
    }
    authenticate() {
        const { roles, scopes, user, client, owner } = jwt.verify(this.accessToken, this.secret);
        this.user = user;
        this.scopes = scopes;
        this.client = client;
        this.owner = owner;
        this.roles = new RolesAndIdentifiers();
        for (const [role, group] of Object.entries(roles)) {
            if (group) {
                this.roles.add(role, group);
            }
        }
        return !!roles;
    }
    getUser() {
        return this.user;
    }
    getRoles() {
        return this.roles;
    }
    getClient() {
        return this.client;
    }
    getOwner() {
        // this really should return an unwrappable Oid...
        return this.owner;
    }
    getAuthorizationHeader() {
        return this.authorizationHeader;
    }
    // I think this is leftover cruft? Would like to remove.
    getClaims() {
        return jwt.verify(this.accessToken, this.secret);
    }
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
    can(requestedAction, authorizable, matrix, treatAuthorizableAttributesAs = authorizer_treat_as_directive_1.getAuthorizerTreatAs(authorizable)) {
        let access = false;
        if (this.inScope(types_1.Scopes.SYSADMIN)) {
            return true;
        }
        for (const [role, roleAtResourceCanDoThis] of matrix.entries()) {
            for (const [resource, allowedActions] of roleAtResourceCanDoThis.entries()) {
                if (!allowedActions.has(requestedAction)) {
                    access = false;
                    break;
                }
                for (const permissionedIdentifier of this.roles.get(role)) {
                    for (const checkThisAttribute of treatAuthorizableAttributesAs.get(resource)) {
                        const value = Reflect.get(authorizable, checkThisAttribute);
                        const authorizableMatchesOnAttr = value === permissionedIdentifier;
                        const actionIsAllowed = matrix.allows({
                            role,
                            at: resource,
                            to: requestedAction
                        });
                        if (authorizableMatchesOnAttr && actionIsAllowed) {
                            return true;
                        }
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
        return this.scopes.includes(types_1.Scopes.SYSADMIN);
    }
}
__decorate([
    required_decorator_1.Required(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Boolean)
], Authorizer.prototype, "authenticate", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], Authorizer.prototype, "getUser", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Authorizer.prototype, "getRoles", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], Authorizer.prototype, "getClient", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], Authorizer.prototype, "getOwner", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], Authorizer.prototype, "getAuthorizationHeader", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, permissions_matrix_1.Permissions,
        authorizer_treat_as_directive_1.AuthorizerTreatAsMap]),
    __metadata("design:returntype", void 0)
], Authorizer.prototype, "can", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Boolean)
], Authorizer.prototype, "inScope", null);
exports.Authorizer = Authorizer;
//# sourceMappingURL=authorizer.js.map