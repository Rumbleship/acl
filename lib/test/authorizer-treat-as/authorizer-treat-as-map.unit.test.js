"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authorizer_treat_as_directive_1 = require("../../authorizer-treat-as.directive");
const types_1 = require("../../types");
describe('Unit: AuthorizerTreatAsMap', () => {
    test('It can be instatiated with a new Map()-like parameter', () => {
        const map = new authorizer_treat_as_directive_1.AuthorizerTreatAsMap([[types_1.Resource.Division, ['hashid']]]);
        expect(map.get(types_1.Resource.Division).has('hashid')).toBe(true);
    });
    describe('Adding attributes', () => {
        test('An attribute can be added to a Resource that has not been set on the map', () => {
            const map = new authorizer_treat_as_directive_1.AuthorizerTreatAsMap([[types_1.Resource.Division, ['hashid']]]);
            expect(map.get(types_1.Resource.Division).has('foobar')).toBe(false);
            map.add(types_1.Resource.Division, 'foobar');
            expect(map.get(types_1.Resource.Division).has('hashid')).toBe(true);
        });
    });
});
//# sourceMappingURL=authorizer-treat-as-map.unit.test.js.map