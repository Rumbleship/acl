"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArrayFromOverloadedRest = exports.baseRoles = void 0;
const types_1 = require("./types");
function baseRoles() {
    return Object.values(types_1.Roles).reduce((base, key) => ({ ...base, [key]: [] }), {});
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