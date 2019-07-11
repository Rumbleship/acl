import * as tk from 'timekeeper';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { Authorizer, createAuthHeader } from './../index';
import { Roles, Resource, Actions, Scopes } from './../types';
import { baseRoles } from '../helpers';
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
  describe('Feature: An Authorizer can provide permissions', () => {
    describe('And: two resources: [`b_abcde`, `u_123ce`]', () => {
      describe('And: an Authorizer wrapping a signed AccessToken that has `User` role on the first, `b_abcde`, and `ADMIN` role for both the other, `s_123ce`, `u_54def`', () => {
        let authorizer: Authorizer;
        const id = 'b_abcde';
        const anotherId = 'u_123ce';
        const resource = { hashid: id };
        const authHeader = createAuthHeader(
          {
            roles: {
              [Roles.ADMIN]: [id, anotherId],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            },
            scopes: []
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(authHeader, SECRET);
          authorizer.authenticate();
        });
        describe('When: asking for an authorized action against an owned resource with a non-intersecting set of Actions allowed', () => {
          describe.each([Actions.UPDATE, Actions.READ, Actions.APPROVE])('%s:u_123ce', action => {
            test('Then: authorization via `can()  `is denied', () => {
              expect(authorizer.can(action, resource, [matrix], 'hashid', Resource.User)).toBe(
                false
              );
            });
          });
        });
        describe('When: asking for an unauthorized action against an owned resource with a non-intersecting set of Actions defined', () => {
          describe.each([Actions.REQUEST])('%s:u_123ce', action => {
            test('Then: authorization is denied', () => {
              expect(authorizer.can(action, resource, [matrix], 'hashid', Resource.User)).toBe(
                false
              );
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
        const authHeader = createAuthHeader(
          {
            roles: {
              [Roles.ADMIN]: [],
              [Roles.USER]: [id],
              [Roles.PENDING]: []
            },
            scopes: []
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(authHeader, SECRET);
          authorizer.authenticate();
        });
        describe('When: asking for an allowed Action against an owned Resource', () => {
          describe.each([Actions.READ, Actions.APPROVE])('%s:b_abcde', action => {
            test('Then: authorization via `can()` is granted', () => {
              expect(authorizer.can(action, resource, [matrix], 'hashid', Resource.Division)).toBe(
                true
              );
            });
          });
        });
        describe('When: asking for an allowed Action against an unowned Resource', () => {
          describe.each([Actions.READ, Actions.APPROVE])('%s:u_123ce', action => {
            test('Then: authorization via `can` is denied', () => {
              expect(
                authorizer.can(action, anotherResource, [matrix], 'hashid', Resource.Division)
              ).toBe(false);
            });
          });
        });
        describe('When: asking for an unapproved Action against an unowned Resource', () => {
          describe.each([Actions.UPDATE, Actions.REQUEST])('%s:u_123ce', action => {
            test('Then: authorization via `can()` is denied', () => {
              expect(
                authorizer.can(action, anotherResource, [matrix], 'hashid', Resource.Division)
              ).toBe(false);
            });
          });
        });
        describe('When: asking for an unapproved Action against an authorized Resource', () => {
          describe.each([Actions.UPDATE, Actions.REQUEST])('%s:b_abcde', action => {
            test('Then: autherization via `can()` is denied', () => {
              expect(authorizer.can(action, resource, [matrix], 'hashid', Resource.Division)).toBe(
                false
              );
            });
          });
        });
      });
      describe('And: an Authorizer wrapping an AccessToken that corresponds to SysAdmin Scope', () => {
        let authorizer: Authorizer;
        const authHeader = createAuthHeader(
          {
            roles: {
              [Roles.ADMIN]: [],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            },
            scopes: [Scopes.SYSADMIN]
          },
          SECRET
        );
        beforeAll(() => {
          authorizer = new Authorizer(authHeader, SECRET);
          authorizer.authenticate();
        });
        test('Then: The authorizer can successfully scope-check as a SysAdmin', () => {
          expect(authorizer.inScope(Scopes.SYSADMIN)).toBe(true);
        });
        describe('When: asking for any action against a resource', () => {
          describe.each([Actions.UPDATE, Actions.READ, Actions.APPROVE, Actions.REQUEST])(
            '%s:s_anything',
            action => {
              test('Then: authorization via `can()` is granted', () => {
                expect(
                  authorizer.can(action, { hashid: 'foo' }, [matrix], 'hashid', Resource.Division)
                ).toBe(true);
              });
            }
          );
        });
      });
    });
  });
  describe('Feature: An Authorizer only accepts a properly formatted `Bearer {{jwt.claims.here}}', () => {
    test.each([
      'bearer jwt.claims.here',
      'Bearer nosubsections',
      'Bearer',
      'hdaoe',
      'jwt.claims.here'
    ])(
      'Constructing an Authorizer with an invalid auth header: %s throws',
      (badAuthHeader: string) => {
        expect(() => new Authorizer(badAuthHeader, SECRET)).toThrow();
      }
    );
    test('Constructing an authorizer with a valid header `Bearer jwt.claims.here` succeeds', () => {
      expect(new Authorizer('Bearer jwt.claims.here', SECRET)).toBeTruthy();
    });
  });
  describe('Feature: authorization defaults to matching `hashid` or `id` based on whether the permission matrix is overridden at invocation', () => {
    describe(`And: two resources:
          One that should be authorized against 'id'
          One that should be authorized against its 'hashid' `, () => {
      const id = 'b_abcde';
      const hashid = 'u_123de';
      const permissionedOnId = { id };
      const permissionedOnHashid = { hashid };
      const authHeader = createAuthHeader(
        {
          roles: {
            [Roles.ADMIN]: [id, hashid],
            [Roles.USER]: [],
            [Roles.PENDING]: []
          },
          scopes: []
        },
        SECRET
      );
      describe('And: the permission matrix assigned at instantiation is not overriden at invocation', () => {
        let authorizer: Authorizer;
        beforeAll(() => {
          authorizer = new Authorizer(authHeader, SECRET);
          authorizer.authenticate();
        });
        describe('When: requesting permissions without specifying a field, against the hashid record', () => {
          test('Then: authorization for an allowed permission via `can()` is granted', () => {
            expect(
              authorizer.can(
                Actions.READ,
                permissionedOnHashid,
                [matrix],
                undefined,
                Resource.Division
              )
            ).toBe(true);
          });
        });
        describe('When: requesting permissions without specifying a field, against the id record', () => {
          test('Then: authorization for an allowed permission via `can()` is denied', () => {
            expect(
              authorizer.can(Actions.READ, permissionedOnId, [matrix], undefined, Resource.Division)
            ).toBe(false);
          });
        });
      });
    });
  });
  describe(`Feature: authorization defaults to using the PermissionGroup that corresponds to to constructor of passed 'AuthorizableResource'`, () => {
    describe(`Given: a named class 'User' and an anoymous object populated with same identifier: 'u_12345'`, () => {
      const hashid = 'u_12345';
      const division_id = 'b_abcde';
      class User {
        // tslint:disable-next-line: no-shadowed-variable
        constructor(private hashid: string, private division_id: string) {}
        toString() {
          return [this.hashid, this.division_id];
        }
      }
      const classResource = new User(hashid, division_id);
      const objectResource = { hashid };
      describe('And: an Authorizer that wraps an AccessToken ADMIN role on the resource', () => {
        const authHeader = createAuthHeader(
          {
            roles: {
              [Roles.ADMIN]: [hashid, division_id],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            },
            scopes: []
          },
          SECRET
        );
        const authorizer = new Authorizer(authHeader, SECRET);
        authorizer.authenticate();
        describe(`When: referencing the classResource`, () => {
          describe('And: not overriding default PermissionGroup', () => {
            test('Then: authorization via `can()` is granted', () => {
              expect(authorizer.can(Actions.DELETE, classResource, [matrix])).toBe(true);
            });
          });
          describe(`And: overriding the PermissionGroup default`, () => {
            test('Then: authorization requested via `can()` should be granted', () => {
              expect(
                authorizer.can(Actions.READ, classResource, [matrix], undefined, Resource.Division)
              ).toBe(true);
            });
          });
        });
        describe('When: referencing the objectResource', () => {
          describe('And: not overriding the default PermissionGroup', () => {
            test('Then: authorization via `can()` throws', () => {
              expect(() => authorizer.can(Actions.DELETE, objectResource, [matrix])).toThrow(
                'Cannot permission on generic `Object`'
              );
            });
          });
          describe(`And: overriding the PermissionGroup default`, () => {
            test('Then: authorization requested via `can()` should be granted', () => {
              expect(
                authorizer.can(Actions.READ, objectResource, [matrix], undefined, Resource.Division)
              ).toBe(true);
            });
          });
        });
        describe('And: when overriding matrix at invocation', () => {
          describe('When: requesting permissions on default attribute, default group', () => {
            test('Then: authorization for an allowed permission via `can()` is granted', () => {
              expect(
                authorizer.can(Actions.READ, classResource, [matrix], undefined, undefined)
              ).toBe(true);
            });
          });
          describe('When: requesting permissions on default attribute, default group', () => {
            test('Then: authorization for an unallowed permission via `can()` is denied', () => {
              expect(
                authorizer.can(Actions.REQUEST, classResource, [matrix], undefined, undefined)
              ).toBe(false);
            });
          });
        });
      });
    });
  });
  describe('Feature: `authenticate()` throws IFF jwt is expired', () => {
    describe('Given: time is frozen at X', () => {
      const now = new Date();
      beforeAll(() => {
        tk.freeze(now);
      });
      afterAll(() => {
        tk.reset();
      });
      describe('And: an Authorizer wrapping an accessToken whose `claims.exp` is in the future', () => {
        let authorizer: Authorizer;
        beforeAll(() => {
          const roles = baseRoles();
          const accessToken = jwt.sign({ roles }, SECRET);
          authorizer = new Authorizer(`Bearer ${accessToken}`, SECRET);
        });
        describe('When: authenticating the authorizer', () => {
          test('Then: authorizer.authenticate() should return true', () => {
            expect(() => authorizer.authenticate()).not.toThrow();
            expect(authorizer.authenticate()).toBe(true);
          });
        });
      });
      describe('And: an Authorizer wrapping an accessToken whose `claims.exp` is in the past', () => {
        let authorizer: Authorizer;
        let tenSecondsAgo;
        beforeAll(() => {
          tenSecondsAgo = moment(now).subtract(10, 'seconds');
          tk.travel(tenSecondsAgo.toDate());
          const roles = baseRoles();
          const accessToken = jwt.sign({ roles }, SECRET, {
            expiresIn: '2sec'
          });
          authorizer = new Authorizer(`Bearer ${accessToken}`, SECRET);
          tk.travel(now);
        });
        describe('When: authenticating the authorizer', () => {
          test('Then: authorizer.authenticate() should throw', () => {
            expect(() => authorizer.authenticate()).toThrow();
          });
        });
      });
    });
  });
  describe('Feature: `inScope()` accepts an array or a single scope', () => {
    const id = 'u_12345';
    const authHeader = createAuthHeader(
      {
        roles: {
          [Roles.ADMIN]: [id],
          [Roles.USER]: [],
          [Roles.PENDING]: []
        },
        scopes: [Scopes.SYSADMIN]
      },
      SECRET
    );
    const authorizer = new Authorizer(authHeader, SECRET);
    authorizer.authenticate();
    describe('When querying inScope with a single parameter', () => {
      test('Then: a missing scope fails', () => {
        expect(authorizer.inScope(Scopes.BANKINGADMIN)).toBe(false);
      });
      test('Then: a present scope passes', () => {
        expect(authorizer.inScope(Scopes.SYSADMIN)).toBe(true);
      });
    });
    describe('When querying inScope with an array parameter', () => {
      test('Then: a missing scope fails', () => {
        expect(authorizer.inScope([Scopes.BANKINGADMIN])).toBe(false);
      });
      test('Then: a present scope passes', () => {
        expect(authorizer.inScope([Scopes.SYSADMIN])).toBe(true);
      });
    });
  });
});
