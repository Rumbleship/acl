"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const types_1 = require("./types");
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
class Authorizer {
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
        const { roles, exp } = jwt.verify(this.accessToken, this.secret);
        this.roles = roles;
        this.exp = exp;
    }
    isAuthenticated() {
        // probably and some logic on expiry here too.
        if (this.exp < new Date()) {
            throw new Error('expired');
        }
        return !!this.roles;
    }
    getRoles() {
        return this.roles || baseRoles();
    }
    // Can't figure out why Hapi needs this passed through its auth layer right now -- oh well.
    getClaims() {
        return jwt.verify(this.accessToken, this.secret);
    }
    allowed(options) {
        if (!this.roles) {
            throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
        }
        const { to: permission, from, match: attribute = 'hashid', against: authorizable } = options;
        let access = false;
        switch (this.sourceType) {
            case types_1.PermissionSource.DECORATOR:
                throw new Error('decorators not currently supported');
            case types_1.PermissionSource.MATRIX:
                Object.entries(this.roles).forEach(([role, identifiersWithPermissions]) => {
                    const permissions = this.permissionsBeingConsidered(role, authorizable, from);
                    const identifier = authorizable[attribute];
                    if (this.isUserSysAdmin() ||
                        (identifiersWithPermissions.includes(identifier) && permissions.includes(permission))) {
                        access = true;
                    }
                });
                break;
        }
        return access;
    }
    isUserSysAdmin() {
        if (!this.roles) {
            return false;
        }
        return Object.values(this.roles).every((identifiersWithPermissions) => identifiersWithPermissions.includes('*'));
    }
    permissionsBeingConsidered(role, authorizable, from) {
        const permissionable = from || authorizable.constructor.name;
        if (permissionable === 'Object') {
            throw new Error('Cannot permission on generic `Object`');
        }
        if (!this.matrix[role]) {
            return [];
        }
        return this.matrix[role][permissionable];
    }
}
exports.Authorizer = Authorizer;
function createAuthHeader(claims, secret, options) {
    const accessToken = jwt.sign(claims, secret, options);
    return `Bearer ${accessToken}`;
}
exports.createAuthHeader = createAuthHeader;
function baseRoles() {
    return Object.values(types_1.Roles).reduce((base, key) => (Object.assign({}, base, { [key]: [] })), {});
}
exports.baseRoles = baseRoles;
function sysAdminRoles() {
    const roles = baseRoles();
    Object.keys(roles).forEach(role => roles[role].push('*'));
    return roles;
}
exports.sysAdminRoles = sysAdminRoles;
//# sourceMappingURL=authorizer.js.map