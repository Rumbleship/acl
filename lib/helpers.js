"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const types_1 = require("./types");
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
    /// as any below is because RolesAt has possibly undefined members.
    Object.keys(roles).forEach(role => roles[role].push('*'));
    return roles;
}
exports.sysAdminRoles = sysAdminRoles;
//# sourceMappingURL=helpers.js.map