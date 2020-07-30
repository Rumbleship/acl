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
exports.Authorizer = void 0;
const jwt = require("jsonwebtoken");
const oid_1 = require("@rumbleship/oid");
const one_to_unique_many_map_1 = require("./utils/one-to-unique-many-map");
const errors_1 = require("./errors");
const permissions_matrix_1 = require("./permissions-matrix");
const types_1 = require("./types");
const helpers_1 = require("./helpers");
const required_decorator_1 = require("./required.decorator");
const authorizer_treat_as_directive_1 = require("./authorizer-treat-as.directive");
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
class RolesAndIdentifiers extends one_to_unique_many_map_1.OneToUniqueManyMap {
}
class Authorizer {
    constructor(authorizationHeader) {
        this.authorizationHeader = authorizationHeader;
        this.roles = new RolesAndIdentifiers();
        if (!Authorizer._initialized) {
            throw new Error('Must initialize Authorizer');
        }
        if (!this.authorizationHeader) {
            throw new errors_1.InvalidJWTError('`authorizationHeader` is required by Authorizer');
        }
        if (!this.authorizationHeader.match(BEARER_TOKEN_REGEX)) {
            throw new errors_1.InvalidJWTError('`authorizationHeader` must be in form `Bearer {{jwt.claims.here}}');
        }
        this.accessToken = this.authorizationHeader.split(' ')[1];
    }
    static get config() {
        if (!this._initialized) {
            throw new Error('Must initialize Authorizer');
        }
        return {
            AccessToken: this._AccessToken,
            ServiceUser: this._ServiceUser
        };
    }
    get user() {
        var _a;
        return (_a = this._claims) === null || _a === void 0 ? void 0 : _a.user;
    }
    get scopes() {
        var _a, _b;
        return (_b = (_a = this._claims) === null || _a === void 0 ? void 0 : _a.scopes) !== null && _b !== void 0 ? _b : [];
    }
    get claims() {
        if (!this._claims) {
            throw new Error('Authorizer must be authenticated');
        }
        return this._claims;
    }
    static initialize(config) {
        this._AccessToken = { ...config.AccessToken };
        this._ServiceUser = { ...config.ServiceUser };
        this._initialized = true;
    }
    static createAuthHeader(claims, jwt_options = { expiresIn: '9h' }) {
        if (claims.scopes.includes(types_1.Scopes.SYSADMIN)) {
            if (!claims.user) {
                claims.user = this.config.ServiceUser.id;
            }
        }
        else {
            if (!claims.user) {
                throw new Error('Cannot create an authHeader without specifying user claim');
            }
        }
        const access_token = jwt.sign(claims, this.config.AccessToken.secret, jwt_options);
        return `Bearer ${access_token}`;
    }
    static createSysAdminAuthHeader(jwt_options = { expiresIn: '5m' }) {
        return this.createAuthHeader({
            roles: {},
            scopes: [types_1.Scopes.SYSADMIN],
            user: this.config.ServiceUser.id
        }, jwt_options);
    }
    static createRefreshToken(user, jwt_options = { expiresIn: '9h' }) {
        const claims = {
            user,
            grant_type: types_1.GrantTypes.REFRESH
        };
        return jwt.sign(claims, this.config.AccessToken.secret, jwt_options);
    }
    static make(header_or_marshalled_claims, authenticate_immediately = false) {
        if (!Authorizer._initialized) {
            throw new Error('Must initialize Authorizer');
        }
        const authorizer = (() => {
            if (header_or_marshalled_claims === null || header_or_marshalled_claims === void 0 ? void 0 : header_or_marshalled_claims.match(BEARER_TOKEN_REGEX)) {
                return new Authorizer(header_or_marshalled_claims);
            }
            const hydrated_claims = JSON.parse(new Buffer(header_or_marshalled_claims, 'base64').toString('ascii'));
            return new Authorizer(Authorizer.createAuthHeader(hydrated_claims));
        })();
        if (authenticate_immediately) {
            authorizer.authenticate();
        }
        return authorizer;
    }
    // To come...get new claims, or something?
    // refresh() {
    //   // stub
    // }
    /**
     *
     * @param {jwt.SignOptions} new_jwt_options
     * @note I don't really like this, but without the true auth server, this is required
     * to be able to effectively continuously authorize long-lived subscriptions.
     */
    extend(new_jwt_options = { expiresIn: '9h' }) {
        const claims_clone = { ...this.claims };
        delete claims_clone.iat;
        delete claims_clone.exp;
        this.accessToken = Authorizer.createAuthHeader(claims_clone, new_jwt_options).split(' ')[1];
        this.authenticate();
    }
    isExpired() {
        try {
            jwt.verify(this.accessToken, Authorizer.config.AccessToken.secret);
            return false;
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return true;
            }
            throw error;
        }
    }
    marshalClaims() {
        const claims = { ...this.claims };
        delete claims.iat;
        delete claims.exp;
        return new Buffer(JSON.stringify(claims)).toString('base64');
    }
    authenticate() {
        this._claims = jwt.verify(this.accessToken, Authorizer.config.AccessToken.secret);
        for (const [role, group] of Object.entries(this._claims.roles || {})) {
            if (group) {
                this.roles.add(role, group);
            }
        }
    }
    getUser() {
        return this.user;
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
    identifiersThatCan({ action, matrix, only }) {
        let ids = [];
        for (const [role, idsWithRoleFromJWT] of this.roles.entries()) {
            ids = ids.concat(Array.from(idsWithRoleFromJWT).filter(id => {
                const resource = new oid_1.Oid(id).unwrap().scope;
                return matrix.allows({ role, at: resource, to: action });
            }));
        }
        if (only) {
            ids = ids.filter(id => {
                const { scope } = new oid_1.Oid(id).unwrap();
                const a = permissions_matrix_1.ResourceAsScopesSingleton.get(scope);
                const b = permissions_matrix_1.ResourceAsScopesSingleton.get(only);
                return a === b;
            });
        }
        return ids;
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
Authorizer._initialized = false;
__decorate([
    required_decorator_1.Required(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
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
    __metadata("design:paramtypes", [String, Object, permissions_matrix_1.Permissions,
        authorizer_treat_as_directive_1.AuthorizerTreatAsMap]),
    __metadata("design:returntype", void 0)
], Authorizer.prototype, "can", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Array)
], Authorizer.prototype, "identifiersThatCan", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Boolean)
], Authorizer.prototype, "inScope", null);
exports.Authorizer = Authorizer;
//# sourceMappingURL=authorizer.js.map