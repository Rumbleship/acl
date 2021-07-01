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
exports.Auth0Authorizer = void 0;
const jwt = require("jsonwebtoken");
const jwks = require("jwks-rsa");
const oid_1 = require("@rumbleship/oid");
const permissions_matrix_1 = require("./permissions-matrix");
const types_1 = require("./types");
const helpers_1 = require("./helpers");
const required_decorator_1 = require("./required.decorator");
const authorizer_treat_as_directive_1 = require("./authorizer-treat-as.directive");
const authorizer_1 = require("./authorizer");
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
class Auth0Authorizer extends authorizer_1.Authorizer {
    static initialize(config, auth0) {
        this._AccessToken = { ...config.AccessToken };
        this._ServiceUser = { ...config.ServiceUser };
        this._Auth0 = { ...auth0 };
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
    static createServiceUserAuthHeader(jwt_options = { expiresIn: '5m' }) {
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
        if (!Auth0Authorizer._initialized) {
            throw new Error('Must initialize Authorizer');
        }
        const authorizer = (() => {
            if (header_or_marshalled_claims === null || header_or_marshalled_claims === void 0 ? void 0 : header_or_marshalled_claims.match(BEARER_TOKEN_REGEX)) {
                return new Auth0Authorizer(header_or_marshalled_claims);
            }
            const hydrated_claims = JSON.parse(Buffer.from(header_or_marshalled_claims, 'base64').toString('ascii'));
            return new Auth0Authorizer(Auth0Authorizer.createAuthHeader(hydrated_claims));
        })();
        if (authenticate_immediately) {
            void authorizer.authenticate();
        }
        return authorizer;
    }
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
        this.accessToken = Auth0Authorizer.createAuthHeader(claims_clone, new_jwt_options).split(' ')[1];
        void this.authenticate();
    }
    isExpired() {
        try {
            jwt.verify(this.accessToken, Auth0Authorizer.config.AccessToken.secret);
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
        return Buffer.from(JSON.stringify(claims)).toString('base64');
    }
    async authenticate() {
        const decoded = jwt.decode(this.accessToken);
        const client = new jwks.JwksClient({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${Auth0Authorizer._Auth0.domain}/.well-known/jwks.json`
        });
        await client
            .getSigningKey(decoded.kid)
            .then(key => jwt.verify(this.accessToken, key.getPublicKey(), { algorithms: [key.alg] }));
    }
    getUser() {
        return this.user;
    }
    getOnBehalfOf() {
        return this.on_behalf_of;
    }
    /**
     * @deprecated in favor of `marshalClaims()` + `Authorizer.make()`. Old Mediator code requires
     * access to the raw claims. Chore: https://www.pivotaltracker.com/story/show/174103802
     */
    getClaims() {
        return { ...this.claims };
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
    can(requestedAction, 
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    authorizable, matrix, treatAuthorizableAttributesAs = authorizer_treat_as_directive_1.getAuthorizerTreatAs(authorizable)) {
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
__decorate([
    required_decorator_1.Required(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Auth0Authorizer.prototype, "authenticate", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], Auth0Authorizer.prototype, "getUser", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], Auth0Authorizer.prototype, "getOnBehalfOf", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, permissions_matrix_1.Permissions,
        authorizer_treat_as_directive_1.AuthorizerTreatAsMap]),
    __metadata("design:returntype", Boolean)
], Auth0Authorizer.prototype, "can", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Array)
], Auth0Authorizer.prototype, "identifiersThatCan", null);
__decorate([
    required_decorator_1.Requires('authenticate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Boolean)
], Auth0Authorizer.prototype, "inScope", null);
exports.Auth0Authorizer = Auth0Authorizer;
//# sourceMappingURL=auth0-authorizer.js.map