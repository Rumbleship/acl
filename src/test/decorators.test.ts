import { AuthorizerTreatAsMap, AuthResourceSymbol } from './../decorators';
import { Roles, Actions, PermissionsMatrix, Resource } from './../types';
import { Authorizer } from './../authorizer';
import { createAuthHeader } from '../helpers';
import { AuthorizerTreatAs, getAuthorizerTreatAs } from '../decorators';

const SECRET = 'signingsecret';
const user_id = 'u_abcde';
const owner_id = 'u_different';
const authorizable = { user_id, owner_id };
const userOfUserRelatedToAuthorizableeHeader = createAuthHeader(
  {
    roles: {
      [Roles.ADMIN]: [],
      [Roles.USER]: [user_id],
      [Roles.PENDING]: []
    },
    scopes: []
  },
  SECRET
);
const userOfOwnerRelatedToAuthorizable = createAuthHeader(
  {
    roles: {
      [Roles.ADMIN]: [],
      [Roles.USER]: [owner_id],
      [Roles.PENDING]: []
    },
    scopes: []
  },
  SECRET
);
const pendingUserAuthHeader = createAuthHeader(
  {
    roles: {
      [Roles.ADMIN]: [],
      [Roles.USER]: [],
      [Roles.PENDING]: [user_id]
    },
    scopes: []
  },
  SECRET
);
const matrix: PermissionsMatrix = {
  [Roles.USER]: { [Resource.User]: [Actions.QUERY] }
};

class SuperClass {
  superCallCount: number = 0;
  // tslint:disable-next-line: no-shadowed-variable
  constructor(public user_id: string) {}
  permissionedByExternalAuthorizable(header: string): boolean {
    this.superCallCount++;
    const authorizer = new Authorizer(header, SECRET);
    authorizer.authenticate();
    if (authorizer.can(Actions.QUERY, authorizable, [matrix])) {
      return true;
    }
    return false;
  }
  reflexiveMethod(header: string): boolean {
    this.superCallCount++;
    const authorizer = new Authorizer(header, SECRET);
    authorizer.authenticate();
    if (authorizer.can(Actions.QUERY, this, [matrix])) {
      return true;
    }
    return false;
  }
}

class PropertyDecoratorSubclass extends SuperClass {
  @AuthorizerTreatAs(Resource.User)
  public owner_id: string;

  // tslint:disable-next-line: no-shadowed-variable
  constructor(public user_id: string, owner_id: string) {
    super(user_id);
    this.owner_id = owner_id;
  }
}

describe('Given: instance of a subclass that extends super', () => {
  const mySuper = new SuperClass(user_id);
  const mySub = new PropertyDecoratorSubclass(user_id, owner_id);
  describe('And: the subclass has decorated a property to force processing of `owner_id` as a reference to a `Resource.User`', () => {
    describe('And: the permissioned action uses a wholly different object to permission on', () => {
      describe('When: invoking method with a jwt that matches on `user_id`', () => {
        test('Then: the superclass passes: inflected to `user_id`', () => {
          expect(
            mySuper.permissionedByExternalAuthorizable(userOfUserRelatedToAuthorizableeHeader)
          ).toBe(true);
        });
        test('Then: the subclass passes: inflected to `user_id`', () => {
          expect(
            mySub.permissionedByExternalAuthorizable(userOfUserRelatedToAuthorizableeHeader)
          ).toBe(true);
        });
      });
      describe('When: invoking method with a jwt that matches on `owner_id`', () => {
        test('Then: the superclass fails: cannot inflect', () => {
          expect(mySuper.permissionedByExternalAuthorizable(userOfOwnerRelatedToAuthorizable)).toBe(
            false
          );
        });
        test('Then: the subclass fails: cannot inflect', () => {
          expect(mySub.permissionedByExternalAuthorizable(userOfOwnerRelatedToAuthorizable)).toBe(
            false
          );
        });
      });
      describe('When: invoking method with a jwt that has no roles that match', () => {
        test('Then: the superclass fails: no roles', () => {
          expect(mySuper.permissionedByExternalAuthorizable(pendingUserAuthHeader)).toBe(false);
        });
        test('Then: the subclass fails: no roles', () => {
          expect(mySub.permissionedByExternalAuthorizable(pendingUserAuthHeader)).toBe(false);
        });
      });
    });
    describe('And: the action being permissioned does so reflexively (e.g. passes `this` to .can()`)', () => {
      describe('When: invoking method with a jwt that matches on `user_id`', () => {
        test('Then: the superclass passes: inflected to `user_id`', () => {
          expect(mySuper.reflexiveMethod(userOfUserRelatedToAuthorizableeHeader)).toBe(true);
        });
        test('Then: the subclass passes: inflected to `user_id`', () => {
          expect(mySub.reflexiveMethod(userOfUserRelatedToAuthorizableeHeader)).toBe(true);
        });
      });
      describe('When: invoking method with a jwt that matches on `owner_id`', () => {
        test('Then: the superclass fails: cannot inflect to `owner_id`', () => {
          expect(mySuper.reflexiveMethod(userOfOwnerRelatedToAuthorizable)).toBe(false);
        });
        test('Then: the subclass passes: property decorator forces consideration of `owner_id` as a reference to `Resource.User`', () => {
          expect(mySub.reflexiveMethod(userOfOwnerRelatedToAuthorizable)).toBe(true);
        });
      });
      describe('When: invoking method with a jwt that has no roles that match', () => {
        test('Then: the superclass fails: no roles', () => {
          expect(mySuper.reflexiveMethod(pendingUserAuthHeader)).toBe(false);
        });
        test('Then: the subclass fails: no roles', () => {
          expect(mySub.reflexiveMethod(pendingUserAuthHeader)).toBe(false);
        });
      });
    });
  });
});

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
  test('It inflects; returning a Map populated with all ResourceIds that match the passed `authorizable`', () => {
    const undecoratedAuthorizable: object = {
      user_id: 'foo',
      division_id: 'bar'
    };
    const map = getAuthorizerTreatAs(undecoratedAuthorizable);
    expect(map.get(Resource.User)!.has('user_id')).toBe(true);
    expect(map.get(Resource.Division)!.has('division_id')).toBe(true);
    expect(map.get(Resource.Order)!.has('id')).toBe(true);
    expect(map.get(Resource.Order)!.size).toBe(1);
  });
});

describe('Unit: AuthorizerTreatAsMap', () => {
  test('It can be instatiated with a new Map()-like parameter', () => {
    const map = new AuthorizerTreatAsMap([[Resource.Division, ['hashid']]]);
    expect(map.get(Resource.Division)!.has('hashid')).toBe(true);
  });
  test('It can be instatiated with deprecated object-like parameter ', () => {
    const map = new AuthorizerTreatAsMap({
      [Resource.Division]: ['hashid']
    });
    expect(map.get(Resource.Division)!.has('hashid')).toBe(true);
  });
  describe('Adding attributes', () => {
    test('An attribute can be added to a Resource that has not been set on the map', () => {
      const map = new AuthorizerTreatAsMap([[Resource.Division, ['hashid']]]);
      expect(map.get(Resource.Division)!.has('foobar')).toBe(false);
      map.add(Resource.Division, 'foobar');
      expect(map.get(Resource.Division)!.has('hashid')).toBe(true);
    });
  });
});
