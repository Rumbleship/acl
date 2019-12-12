"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const types_1 = require("./../../types");
const authorizer_treat_as_directive_1 = require("../../authorizer-treat-as.directive");
describe('Unit: getAuthorizerTreatAs', () => {
    test('It inflects; returning a Map populated with all ResourceIds that match the passed `authorizable`', () => {
        const undecoratedAuthorizable = {
            user_id: 'foo',
            division_id: 'bar'
        };
        const map = authorizer_treat_as_directive_1.getAuthorizerTreatAs(undecoratedAuthorizable);
        expect(map.get(types_1.Resource.User).has('user_id')).toBe(true);
        expect(map.get(types_1.Resource.Division).has('division_id')).toBe(true);
        expect(map.get(types_1.Resource.Order).has('id')).toBe(true);
        expect(map.get(types_1.Resource.Order).size).toBe(1);
    });
});
//# sourceMappingURL=get-authorizer-treat-as.unit.test.js.map