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
const jwt = require("jsonwebtoken");
const types_1 = require("./types");
const helpers_1 = require("./helpers");
const decorators_1 = require("./decorators");
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
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
    authenticate() {
        const { roles, scopes, user, client, owner } = jwt.verify(this.accessToken, this.secret);
        this.user = user;
        this.roles = roles;
        this.scopes = scopes;
        this.client = client;
        this.owner = owner;
        return !!this.roles;
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
     * @param action The action under consideration, typically query|mutation in GQL
     * @param authorizable The record being authorized before being returned to the requesting User
     * @param matrix The permission matrix defined in the GQL model via Authorized decorator
     * @param attribute? Explicitly indicate how to index into the `authorizable`
     * @param resource? Explicitly indicate which group in the matrix should be permissioned
     *                  against.
     */
    can(action, authorizable, matrix, attributeResourceMap = decorators_1.getAuthorizerTreatAs(authorizable)) {
        let access = false;
        if (this.inScope(types_1.Scopes.SYSADMIN)) {
            return true;
        }
        for (const permissions of matrix) {
            for (const [role, group] of Object.entries(permissions)) {
                const permissionedIdentifiers = this.roles[role] || [];
                function inflectAndSearchMatrix() {
                    for (const [resourceWithPermissions, allowedActions] of Object.entries(group)) {
                        const authorizableAttribute = 
                        // If there are explicit attribute mappings passed, do not inflect on the authorizable name.
                        // ....not sure why rigt now. But it makes the old test pass.
                        attributeResourceMap.size === 0 &&
                            resourceWithPermissions === authorizable.constructor.name
                            ? 'id'
                            : `${resourceWithPermissions.toLowerCase()}_id`;
                        const identifier = authorizable[authorizableAttribute];
                        if (permissionedIdentifiers.includes(identifier) &&
                            allowedActions.includes(action)) {
                            access = true;
                        }
                    }
                }
                for (const [attribute, resources] of attributeResourceMap.entries()) {
                    for (const resource of resources.values()) {
                        (function checkKnownAttribute() {
                            const actions = resource
                                ? group[resource] || []
                                : group[authorizable.constructor.name] || [];
                            const attrs = !Array.isArray(attribute) ? [attribute] : attribute;
                            for (const attr of attrs) {
                                if (permissionedIdentifiers.includes(authorizable[attr]) &&
                                    actions.includes(action)) {
                                    access = true;
                                }
                            }
                        })();
                        (function checkKnownResource() {
                            const authorizableAttribute = resource === (authorizable.constructor && authorizable.constructor.name)
                                ? 'id'
                                : `${resource.toLowerCase()}_id`;
                            const identifier = authorizable[authorizableAttribute];
                            const actions = group[resource] || [];
                            if (permissionedIdentifiers.includes(identifier) && actions.includes(action)) {
                                access = true;
                            }
                        })();
                    }
                }
                if (!access) {
                    inflectAndSearchMatrix();
                }
            }
            return access;
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
    decorators_1.Required(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Boolean)
], Authorizer.prototype, "authenticate", null);
__decorate([
    decorators_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], Authorizer.prototype, "getUser", null);
__decorate([
    decorators_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], Authorizer.prototype, "getRoles", null);
__decorate([
    decorators_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], Authorizer.prototype, "getClient", null);
__decorate([
    decorators_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], Authorizer.prototype, "getOwner", null);
__decorate([
    decorators_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], Authorizer.prototype, "getAuthorizationHeader", null);
__decorate([
    decorators_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array, Object]),
    __metadata("design:returntype", void 0)
], Authorizer.prototype, "can", null);
__decorate([
    decorators_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Boolean)
], Authorizer.prototype, "inScope", null);
exports.Authorizer = Authorizer;
//# sourceMappingURL=authorizer.js.map