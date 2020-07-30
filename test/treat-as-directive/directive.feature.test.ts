import { Oid } from '@rumbleship/oid';
import { MockConfig } from './../mock-config';
import { Permissions } from './../../src/permissions-matrix';
import { Authorizer } from './../../src/authorizer';
import { Roles, Resource, Actions, Scopes } from './../../src/types';
import { AuthorizerTreatAs } from './../../src/authorizer-treat-as.directive';

Authorizer.initialize(MockConfig);

const user = Oid.Create('User', 1).toString();
const different_user = Oid.Create('User', 2).toString();
const authorizable = { user_id: user, owner_id: different_user };
const userOfUserRelatedToAuthorizableeHeader = Authorizer.createAuthHeader({
  roles: {
    [Roles.ADMIN]: [],
    [Roles.USER]: [user],
    [Roles.PENDING]: []
  },
  scopes: [Scopes.USER],
  user
});
const userOfOwnerRelatedToAuthorizable = Authorizer.createAuthHeader({
  roles: {
    [Roles.ADMIN]: [],
    [Roles.USER]: [different_user],
    [Roles.PENDING]: []
  },
  scopes: [],
  user: different_user
});
const pendingUserAuthHeader = Authorizer.createAuthHeader({
  roles: {
    [Roles.ADMIN]: [],
    [Roles.USER]: [],
    [Roles.PENDING]: [user]
  },
  scopes: [],
  user
});

const matrix = new Permissions();
matrix.allow({
  role: Roles.USER,
  at: Resource.User,
  to: [Actions.QUERY]
});

class SuperClass {
  superCallCount: number = 0;
  // tslint:disable-next-line: no-shadowed-variable
  constructor(public user_id: string) {}
  permissionedByExternalAuthorizable(header: string): boolean {
    this.superCallCount++;
    const authorizer = Authorizer.make(header, true);
    if (authorizer.can(Actions.QUERY, authorizable, matrix)) {
      return true;
    }
    return false;
  }
  reflexiveMethod(header: string): boolean {
    this.superCallCount++;
    const authorizer = Authorizer.make(header, true);
    if (authorizer.can(Actions.QUERY, this, matrix)) {
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
  const mySuper = new SuperClass(user);
  const mySub = new PropertyDecoratorSubclass(user, different_user);
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
