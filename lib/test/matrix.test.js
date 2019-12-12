"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permissions_1 = require("./../permissions");
const types_1 = require("../types");
test('A specific role->resource associations can be granted a single action', () => {
    const matrix = new permissions_1.Permissions();
    matrix.allow({ role: types_1.Roles.USER, at: types_1.Resource.Division, to: types_1.Actions.READ });
    expect(matrix.allows({ role: types_1.Roles.USER, at: types_1.Resource.Division, to: types_1.Actions.READ })).toBe(true);
    expect(matrix.allows({
        role: types_1.Roles.USER,
        at: types_1.Resource.Division,
        to: types_1.Actions.CREATE
    })).toBe(false);
});
test('A specific role->resource associations can be granted a list of actions', () => {
    const matrix = new permissions_1.Permissions();
    matrix.allow({
        role: types_1.Roles.USER,
        at: types_1.Resource.Division,
        to: [types_1.Actions.READ, types_1.Actions.CREATE]
    });
    expect(matrix.allows({ role: types_1.Roles.USER, at: types_1.Resource.Division, to: types_1.Actions.READ })).toBe(true);
    expect(matrix.allows({
        role: types_1.Roles.USER,
        at: types_1.Resource.Division,
        to: types_1.Actions.CREATE
    })).toBe(true);
});
//# sourceMappingURL=matrix.test.js.map