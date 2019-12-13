"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permissions_matrix_1 = require("./../../src/permissions-matrix");
const types_1 = require("./../../src/types");
test('A specific role->resource associations can be granted a single action', () => {
    const matrix = new permissions_matrix_1.Permissions();
    matrix.allow({ role: types_1.Roles.USER, at: types_1.Resource.Division, to: types_1.Actions.READ });
    expect(matrix.allows({ role: types_1.Roles.USER, at: types_1.Resource.Division, to: types_1.Actions.READ })).toBe(true);
    expect(matrix.allows({
        role: types_1.Roles.USER,
        at: types_1.Resource.Division,
        to: types_1.Actions.CREATE
    })).toBe(false);
});
test('A specific role->resource association can be allowed an explicit list of actions', () => {
    const matrix = new permissions_matrix_1.Permissions();
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
describe('Given: a matrix exists', () => {
    const matrix = new permissions_matrix_1.Permissions();
    describe('When: asking for a role that has not been populated', () => {
        test('Then: an empty ResourceActionsMap is returned', () => {
            expect(matrix.get(types_1.Roles.PENDING).size).toBe(0);
        });
    });
    describe('And: a User of Division is only allowed to READ', () => {
        const role = types_1.Roles.USER;
        matrix.allow({
            role,
            at: types_1.Resource.Division,
            to: [types_1.Actions.READ]
        });
        describe.each([
            [{ actions: [types_1.Actions.READ, types_1.Actions.DELETE] }],
            [{ actions: [types_1.Actions.DELETE, types_1.Actions.READ] }]
        ])('When: asking about set of actions, some of which are allowed and some of which are not', ({ actions }) => {
            test('Then: it returns true, regardless of order of actions', () => {
                expect(matrix.allows({
                    role,
                    at: types_1.Resource.Division,
                    to: actions
                })).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=permissions-matrix.unit.test.js.map