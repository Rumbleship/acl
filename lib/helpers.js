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
//# sourceMappingURL=helpers.js.map