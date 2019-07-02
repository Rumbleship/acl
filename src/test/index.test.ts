import { Authorizer } from './../index';
import { Roles, Resource, PermissionSource, Actions } from './../types';
import * as jwt from 'jsonwebtoken';
const SECRET = 'signingsecret';
describe(`Given: a permission matrix that gives: 
      admin: 'UPDATE', 'READ', 'APPROVE' on a 'Division'
              'DELETE' on a 'User'
      user: 'READ', 'APPROVE' on a 'Division',
      pending: 'REQUEST' on a 'Division'`, () => {
  const matrix = {
    [Roles.ADMIN]: {
      [Resource.Division]: [Actions.UPDATE, Actions.READ, Actions.APPROVE],
      [Resource.User]: [Actions.DELETE]
    },
    [Roles.USER]: {
      [Resource.Division]: [Actions.READ, Actions.APPROVE]
    },
    [Roles.PENDING]: {
      [Resource.Division]: [Actions.REQUEST]
    }
  };
  describe('Context: raw permission logic', () => {
    describe('And: two resources: [`b_abcde`, `u_123ce`]', () => {
      describe('And: an Authorizer wrapping a signed AccessToken that has `User` role on the first, `b_abcde`, and `ADMIN` role for both the other, `s_123ce`, `u_54def`', () => {
        let authorizer: Authorizer;
        const id = 'b_abcde';
        const anotherId = 'u_123ce';
        const resource = { hashid: id };
        const accessToken = jwt.sign(
          {
            roles: {
              [Roles.ADMIN]: [id, anotherId],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            }
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(accessToken, SECRET, PermissionSource.MATRIX, matrix);
        });
        describe('When: asking for an authorized action against an owned resource with a non-intersecting set of Actions allowed', () => {
          describe.each([Actions.UPDATE, Actions.READ, Actions.APPROVE])('%s:u_123ce', action => {
            let authorized: boolean;
            beforeEach(() => {
              authorized = authorizer.allowed({
                to: action,
                from: Resource.User,
                match: 'hashid',
                against: resource
              });
            });
            test('Then: authorization is denied', () => {
              expect(authorized).toBe(false);
            });
          });
        });
        describe('When: asking for an unauthorized action against an owned resource with a non-intersecting set of Actions defined', () => {
          describe.each([Actions.REQUEST])('%s:u_123ce', action => {
            let authorized: boolean;
            beforeEach(() => {
              authorized = authorizer.allowed({
                to: action,
                from: Resource.User,
                match: 'hashid',
                against: resource
              });
            });
            test('Then: authorization is denied', () => {
              expect(authorized).toBe(false);
            });
          });
        });
      });
      describe('And: an Authorizer wrapping a signed AccessToken that has `User` roles for one of them, `b_abcde`', () => {
        let authorizer: Authorizer;
        const id = 'b_abcde';
        const anotherId = 'u_123ce';
        const resource = { hashid: id };
        const anotherResource = { hashid: anotherId };
        const accessToken = jwt.sign(
          {
            roles: {
              [Roles.ADMIN]: [],
              [Roles.USER]: [id],
              [Roles.PENDING]: []
            }
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(accessToken, SECRET, PermissionSource.MATRIX, matrix);
        });
        describe('When: asking for an allowed Action against an owned Resource', () => {
          describe.each([Actions.READ, Actions.APPROVE])('%s:b_abcde', action => {
            let authorized: boolean;
            beforeEach(() => {
              authorized = authorizer.allowed({
                to: action,
                from: Resource.Division,
                match: 'hashid',
                against: resource
              });
            });
            test('Then: authorization is granted', () => {
              expect(authorized).toBe(true);
            });
          });
        });
        describe('When: asking for an allowed Action against an unowned Resource', () => {
          describe.each([Actions.READ, Actions.APPROVE])('%s:u_123ce', action => {
            let authorized: boolean;
            beforeEach(() => {
              authorized = authorizer.allowed({
                to: action,
                from: Resource.Division,
                match: 'hashid',
                against: anotherResource
              });
            });
            test('Then: authorization is denied', () => {
              expect(authorized).toBe(false);
            });
          });
        });
        describe('When: asking for an unapproved Action against an unowned Resource', () => {
          describe.each([Actions.UPDATE, Actions.REQUEST])('%s:u_123ce', action => {
            let authorized: boolean;
            beforeEach(() => {
              authorized = authorizer.allowed({
                to: action,
                from: Resource.Division,
                match: 'hashid',
                against: anotherResource
              });
            });
            test('Then: authorization is denied', () => {
              expect(authorized).toBe(false);
            });
          });
        });
        describe('When: asking for an unapproved Action against an authorized Resource', () => {
          describe.each([Actions.UPDATE, Actions.REQUEST])('%s:b_abcde', action => {
            let authorized: boolean;
            beforeEach(() => {
              authorized = authorizer.allowed({
                to: action,
                from: Resource.Division,
                match: 'hashid',
                against: resource
              });
            });
            test('Then: authorization is denied', () => {
              expect(authorized).toBe(false);
            });
          });
        });
      });
      describe('And: an Authorizer wrapping an AccessToken that corresponds to SysAdmin roles', () => {
        let authorizer: Authorizer;
        const accessToken = jwt.sign(
          {
            roles: {
              [Roles.ADMIN]: ['*'],
              [Roles.USER]: ['*'],
              [Roles.PENDING]: ['*']
            }
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(accessToken, SECRET, PermissionSource.MATRIX, matrix);
        });
        test('Then: `authorizer.isUserSysAdmin() returns true', () => {
          expect(authorizer.isUserSysAdmin()).toBe(true);
        });
        describe('When: asking for any action against a resource', () => {
          describe.each([Actions.UPDATE, Actions.READ, Actions.APPROVE, Actions.REQUEST])(
            '%s:s_anything',
            action => {
              let authorized: boolean;
              beforeAll(() => {
                authorized = authorizer.allowed({
                  to: action,
                  from: Resource.Division,
                  match: 'hashid',
                  against: { hashid: 'foo' }
                });
              });
              test('Then: authorization is granted', () => {
                expect(authorized).toBe(true);
              });
            }
          );
        });
      });
    });
  });
  describe('Feature: `allowed()` defaults to matching against attribute `hashid` ', () => {
    describe(`And: two resources:
        One that should be authorized against 'id'
        One that should be authorized against its 'hashid' `, () => {
      const id = 'b_abcde';
      const hashid = 'u_123de';
      const permissionedOnId = { id };
      const permissionedOnHashid = { hashid };
      describe('When: requesting permissions without specifying a field, against the hashid record', () => {
        let authorizer: Authorizer;
        const accessToken = jwt.sign(
          {
            roles: {
              [Roles.ADMIN]: [id, hashid],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            }
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(accessToken, SECRET, PermissionSource.MATRIX, matrix);
        });
        test('Then: an allowed permission should succeed', () => {
          expect(
            authorizer.allowed({
              to: Actions.READ,
              from: Resource.Division,
              against: permissionedOnHashid
            })
          ).toBe(true);
        });
      });
      describe('When: requesting permissions without specifying a field, against the id record', () => {
        let authorizer: Authorizer;
        const accessToken = jwt.sign(
          {
            roles: {
              [Roles.ADMIN]: [id, hashid],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            }
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(accessToken, SECRET, PermissionSource.MATRIX, matrix);
        });
        test('Then: an allowed permission should be denied', () => {
          expect(
            authorizer.allowed({
              to: Actions.READ,
              from: Resource.Division,
              against: permissionedOnId
            })
          ).toBe(false);
        });
      });
    });
  });
  describe(`Feature: 'allowed()' PermissionGroup defaults to constructor of passed 'AuthorizableResource'
    and can be explicitly specified as 'from'`, () => {
    describe(`Given: a named class 'User' and an anoymous object populated with same identifier: 'u_12345'`, () => {
      const hashid = 'u_12345';
      class User {
        // tslint:disable-next-line: no-shadowed-variable
        constructor(private hashid: string) {}
        toString() {
          return this.hashid;
        }
      }
      const classResource = new User(hashid);
      const objectResource = { hashid };
      describe('And: an Authorizer that wraps an AccessToken ADMIN role on the resource', () => {
        const accessToken = jwt.sign(
          {
            roles: {
              [Roles.ADMIN]: [hashid],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            }
          },
          SECRET
        );
        const authorizer = new Authorizer(accessToken, SECRET, PermissionSource.MATRIX, matrix);
        describe(`When: requesting authorization without specifying 'from'`, () => {
          test('Then: the classResource should succeed', () => {
            expect(
              authorizer.allowed({
                to: Actions.DELETE,
                against: classResource
              })
            ).toBe(true);
          });
          test('Then: the objectResource should throw', () => {
            expect(() =>
              authorizer.allowed({
                to: Actions.DELETE,
                against: objectResource
              })
            ).toThrow('Cannot permission on generic `Object`');
          });
        });
        describe(`When: requesting authorization and specifying 'from'`, () => {
          test('Then: the `from` should override default should succeed', () => {
            expect(
              authorizer.allowed({
                to: Actions.READ,
                from: Resource.Division,
                against: classResource
              })
            ).toBe(true);
          });
        });
      });
    });
  });
});
