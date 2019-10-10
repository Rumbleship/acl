import { Roles, Actions, PermissionsMatrix, Resource } from './../types';
import { Authorizer } from './../authorizer';
import { createAuthHeader } from '../helpers';
import { AuthorizedResource, AuthorizedAttribute } from '../decorators';

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
  permissionedMethod(header: string): boolean {
    this.superCallCount++;
    const authorizer = new Authorizer(header, SECRET);
    authorizer.authenticate();
    const attribute = Reflect.get(this, Symbol.for(`permissionedMethodAuthorizedAttribute`));
    const r = Reflect.get(this, Symbol.for(`permissionedMethodAuthorizedResource`));
    if (authorizer.can(Actions.QUERY, authorizable, [matrix], attribute, r)) {
      return true;
    }
    return false;
  }
}

class AuthorizedSubClass extends SuperClass {
  subCallCount: number = 0;
  @AuthorizedAttribute('owner_id')
  @AuthorizedResource('User')
  permissionedMethod(header: string): boolean {
    this.subCallCount++;
    const superValue = super.permissionedMethod(header);
    return superValue;
  }
}

describe('Scenario: A Subclass can decorate a method that invokes the authorizer to adjust `attribute` and/or `resource` passed to Authorizer', () => {
  test('The superclass allows a request from a permissioned user, and fails one from an unpermissioned', () => {
    const mySuper = new SuperClass();
    expect(mySuper.permissionedMethod(userOfUserRelatedToAuthorizableeHeader)).toBe(true);
    expect(mySuper.superCallCount).toBe(1);
    expect(mySuper.permissionedMethod(userOfOwnerRelatedToAuthorizable)).toBe(false);
    expect(mySuper.superCallCount).toBe(2);
    expect(mySuper.permissionedMethod(pendingUserAuthHeader)).toBe(false);
    expect(mySuper.superCallCount).toBe(3);
  });
  test('A subclass can decorate its overridden version to extend auth, and not reimplement all features of superclass method ', () => {
    const mySub = new AuthorizedSubClass();
    expect(mySub.permissionedMethod(userOfOwnerRelatedToAuthorizable)).toBe(true);
    expect(mySub.superCallCount).toBe(1);
    expect(mySub.subCallCount).toBe(1);
    expect(mySub.permissionedMethod(userOfUserRelatedToAuthorizableeHeader)).toBe(true);
    expect(mySub.superCallCount).toBe(2);
    expect(mySub.subCallCount).toBe(2);
    expect(mySub.permissionedMethod(pendingUserAuthHeader)).toBe(false);
    expect(mySub.superCallCount).toBe(3);
  });
});
describe(`Given: an Authorizer wrapping a known secret 
            When: serializing the authorizer
            Then: the output does not include the secret  
  `, () => {
    const authorizer = new Authorizer(userOfOwnerRelatedToAuthorizable, SECRET);
    expect(authorizer).not.toContain(Reflect.get(authorizer, 'secret'));
  });
