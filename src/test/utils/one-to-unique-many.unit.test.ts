import { OneToUniqueManyMap } from './../../utils/one-to-unique-many-map';
enum SomeEnum {
  FOO = 'FOO',
  BAR = 'BAR'
}
test('Constructing a OneToUniqueMany populates it', () => {
  const map = new OneToUniqueManyMap<SomeEnum, string>([[SomeEnum.FOO, ['bar']]]);
  expect(map.get(SomeEnum.FOO).has('bar')).toBe(true);
});

test('Constructing a OneToUniqueMany with duplicate values: V populates it', () => {
  const map = new OneToUniqueManyMap<SomeEnum, string>([[SomeEnum.FOO, ['bar', 'bar']]]);
  expect(map.get(SomeEnum.FOO).has('bar')).toBe(true);
});

test('Querying for a Key that hasnt been set returns an empty Set<V>', () => {
  const map = new OneToUniqueManyMap<SomeEnum, string>([[SomeEnum.FOO, ['bar', 'bar']]]);
  expect(map.get(SomeEnum.BAR)).toBeTruthy();
  expect(map.get(SomeEnum.BAR).size).toBe(0);
});
