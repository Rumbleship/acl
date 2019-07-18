"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const types_1 = require("./types");
function createAuthHeader(claims, secret, options) {
    const accessToken = jwt.sign(claims, secret, options);
    return `Bearer ${accessToken}`;
}
exports.createAuthHeader = createAuthHeader;
function createRefreshToken(owner, secret, options = { expiresIn: '9h' }) {
    const claims = {
        owner,
        grant_type: types_1.GrantTypes.REFRESH
    };
    return jwt.sign(claims, secret, options);
}
exports.createRefreshToken = createRefreshToken;
function baseRoles() {
    return Object.values(types_1.Roles).reduce((base, key) => (Object.assign({}, base, { [key]: [] })), {});
}
exports.baseRoles = baseRoles;
// Taken from `type-graphql` as a useful utility.
function getArrayFromOverloadedRest(overloadedArray) {
    const items = Array.isArray(overloadedArray[0])
        ? overloadedArray[0]
        : overloadedArray;
    return items;
}
exports.getArrayFromOverloadedRest = getArrayFromOverloadedRest;
//# sourceMappingURL=helpers.js.map