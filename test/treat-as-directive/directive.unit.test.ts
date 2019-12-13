import {
  AuthorizerTreatAs,
  AuthResourceSymbol,
  getAuthorizerTreatAs
} from './../../src/authorizer-treat-as.directive';
import { Resource } from './../../src/types';

describe('Unit: @AuthorizeTreatAs', () => {
  test('Decorating an attribute adds that attribute to the metadata map under specified resource', () => {
    class Foo {
      @AuthorizerTreatAs(Resource.Division)
      some_attribute: string;
      constructor(some_attribute: string) {
        this.some_attribute = some_attribute;
      }
    }
    const foo = new Foo('bar');
    const retrievedMetadata = Reflect.getMetadata(AuthResourceSymbol, foo);
    expect(retrievedMetadata).toBeTruthy();
    expect(retrievedMetadata.get(Resource.Division)!.has('some_attribute')).toBe(true);
  });

  // Cannot apply parameter decorators to constructors and retrieve the name of the parameter.
  // See: https://github.com/microsoft/TypeScript/issues/15904
  test.skip('Decorating a parameter adds that attribute to the metadata map under specified resource', () => {
    class Foo {
      constructor(
        @AuthorizerTreatAs(Resource.Division)
        public some_attribute: string
      ) {}
      behaveCompiler() {
        return this.some_attribute;
      }
    }
    const foo = new Foo('bar');
    const retrievedMetadata = Reflect.getMetadata(AuthResourceSymbol, foo);
    expect(retrievedMetadata).toBeTruthy();
    expect(retrievedMetadata.get(Resource.Division)!.has('some_attribute')).toBe(true);
  });
});

describe('Unit: getAuthorizerTreatAs', () => {
  describe('Given: an undecorated authorizable', () => {
    const undecoratedAuthorizable: object = {
      user_id: 'foo',
      division_id: 'bar'
    };
    test('It inflects; returning a Map populated with all ResourceIds that match the passed `authorizable`', () => {
      const map = getAuthorizerTreatAs(undecoratedAuthorizable);
      expect(map.get(Resource.User).has('user_id')).toBe(true);
      expect(map.get(Resource.User).has('id')).toBe(true);
      expect(map.get(Resource.User).size).toBe(2);
      expect(map.get(Resource.Division).has('division_id')).toBe(true);
      expect(map.get(Resource.Division).has('id')).toBe(true);
      expect(map.get(Resource.Division).size).toBe(2);
      expect(map.get(Resource.Order).has('id')).toBe(true);
      expect(map.get(Resource.Order).size).toBe(1);
    });
  });
  describe('Given: a decorated authorizable', () => {
    class DecoratedAuthorizable {
      @AuthorizerTreatAs(Resource.Division)
      arbitrary_id: string = 'quux';
    }

    test('It assigns decorated properties to the specified resource key as well as inflecting', () => {
      const authorizable = new DecoratedAuthorizable();
      const map = getAuthorizerTreatAs(authorizable);
      expect(map.get(Resource.Division).has('id')).toBe(true);
      expect(map.get(Resource.Division).has('arbitrary_id')).toBe(true);
      expect(map.get(Resource.Division).size).toBe(2);
    });
  });
});
