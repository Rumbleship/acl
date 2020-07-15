import {
  AuthorizerTreatAs,
  AuthResourceSymbol,
  getAuthorizerTreatAs,
  AuthorizerTreatAsMap
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
    describe.each([true, undefined])(
      'When: called with instruction to inflect',
      apply_inflected_defaults => {
        let map: AuthorizerTreatAsMap;
        beforeAll(
          () => (map = getAuthorizerTreatAs(undecoratedAuthorizable, apply_inflected_defaults))
        );
        test('Then: a map is returned with inflected ids', () => {
          expect(map.get(Resource.User).has('user_id')).toBe(true);
          expect(map.get(Resource.User).has('id')).toBe(true);
          expect(map.get(Resource.User).size).toBe(2);
          expect(map.get(Resource.Division).has('division_id')).toBe(true);
          expect(map.get(Resource.Division).has('id')).toBe(true);
          expect(map.get(Resource.Division).size).toBe(2);
          expect(map.get(Resource.Order).has('id')).toBe(true);
          expect(map.get(Resource.Order).size).toBe(1);
        });
      }
    );
    describe('When: called with `apply_inflected_defaults:false`', () => {
      let map: AuthorizerTreatAsMap;
      beforeAll(() => (map = getAuthorizerTreatAs(undecoratedAuthorizable, false)));
      test('Then: a map is returned without inflected ids', () => {
        expect(map.get(Resource.Division).size).toBe(0);
        expect(map.get(Resource.User).size).toBe(0);
      });
    });
  });
  describe('Given: a decorated authorizable', () => {
    class DecoratedAuthorizable {
      @AuthorizerTreatAs(Resource.Division)
      arbitrary_id: string = 'quux';
    }
    const authorizable = new DecoratedAuthorizable();
    describe.each([true, undefined])(
      'When: called with instruction to inflect',
      apply_inflected_defaults => {
        let map: AuthorizerTreatAsMap;
        beforeAll(() => (map = getAuthorizerTreatAs(authorizable, apply_inflected_defaults)));
        test('Then: a map is returned with the decorated keys as well', () => {
          expect(map.get(Resource.Division).has('id')).toBe(true);
          expect(map.get(Resource.Division).has('arbitrary_id')).toBe(true);
          expect(map.get(Resource.Division).size).toBe(2);
        });
      }
    );
    describe('When: called with `apply_inflected_defaults:false`', () => {
      let map: AuthorizerTreatAsMap;
      beforeAll(() => (map = getAuthorizerTreatAs(authorizable, false)));
      test('Then: a map is returned without inflected ids', () => {
        expect(map.get(Resource.Division).has('arbitrary_id')).toBe(true);
        expect(map.get(Resource.Division).size).toBe(1);
      });
    });
  });
});

describe('Feature: An arbitrary id can be decorated to correspond to multiple resources', () => {
  describe('Given: a decorated authorizable', () => {
    class DecoratedAuthorizable {
      @AuthorizerTreatAs([Resource.Division, Resource.User])
      arbitrary_id: string = 'quux';
    }

    test('It assigns decorated properties to the specified resource key as well as inflecting', () => {
      const authorizable = new DecoratedAuthorizable();
      const map = getAuthorizerTreatAs(authorizable);
      expect(map.get(Resource.Division).has('id')).toBe(true);
      expect(map.get(Resource.Division).has('arbitrary_id')).toBe(true);
      expect(map.get(Resource.Division).size).toBe(2);
      expect(map.get(Resource.User).has('id')).toBe(true);
      expect(map.get(Resource.User).has('arbitrary_id')).toBe(true);
      expect(map.get(Resource.User).size).toBe(2);
    });
  });
});
