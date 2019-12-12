"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const one_to_unique_many_map_1 = require("./../../utils/one-to-unique-many-map");
var SomeEnum;
(function (SomeEnum) {
    SomeEnum["FOO"] = "FOO";
    SomeEnum["BAR"] = "BAR";
})(SomeEnum || (SomeEnum = {}));
test('Constructing a OneToUniqueMany populates it', () => {
    const map = new one_to_unique_many_map_1.OneToUniqueManyMap([[SomeEnum.FOO, ['bar']]]);
    expect(map.get(SomeEnum.FOO).has('bar')).toBe(true);
});
test('Constructing a OneToUniqueMany with duplicate values: V populates it', () => {
    const map = new one_to_unique_many_map_1.OneToUniqueManyMap([[SomeEnum.FOO, ['bar', 'bar']]]);
    expect(map.get(SomeEnum.FOO).has('bar')).toBe(true);
});
test('Querying for a Key that hasnt been set returns an empty Set<V>', () => {
    const map = new one_to_unique_many_map_1.OneToUniqueManyMap([[SomeEnum.FOO, ['bar', 'bar']]]);
    expect(map.get(SomeEnum.BAR)).toBeTruthy();
    expect(map.get(SomeEnum.BAR).size).toBe(0);
});
//# sourceMappingURL=one-to-unique-many.unit.test.js.map