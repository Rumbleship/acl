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
      [Resource.Division]: [Actions.UPDATE, Actions.QUERY, Actions.APPROVE],
      [Resource.User]: [Actions.DELETE]
    },
    [Roles.USER]: {
      [Resource.Division]: [Actions.QUERY, Actions.APPROVE]
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
          describe.each([Actions.UPDATE, Actions.QUERY, Actions.APPROVE])('%s:u_123ce', action => {
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
              expect(authorizer.can(action, resource, [matrix], 'hashid')).toBe(false);
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
          describe.each([Actions.QUERY, Actions.APPROVE])('%s:b_abcde', action => {
            test('Then: authorization via `can()` is granted', () => {
              expect(authorizer.can(action, resource, [matrix], 'hashid', Resource.Division)).toBe(
                true
              );
            });
          });
        });
        describe('When: asking for an allowed Action against an unowned Resource', () => {
          describe.each([Actions.QUERY, Actions.APPROVE])('%s:u_123ce', action => {
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
          describe.each([Actions.UPDATE, Actions.QUERY, Actions.APPROVE, Actions.REQUEST])(
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
      'jwt.claims.here',
      ''
    ])(
      'Constructing an Authorizer with an invalid auth header: %s throws',
      (badAuthHeader: string) => {
        expect(() => new Authorizer(badAuthHeader, SECRET)).toThrow();
      }
    );
    test('Constructing an authorizer with a valid header `Bearer jwt.claims.here` succeeds', () => {
      expect(new Authorizer('Bearer jwt.claims.here', SECRET)).toBeTruthy();
    });
    test('Constructing an Authorizer without a secret throws', () => {
      expect(() => new Authorizer('Bearer jwt.claims.here', '')).toThrow();
    });
  });
  describe(`Feature: authorization defaults to using the Group that corresponds to to constructor of passed 'Authorizable'`, () => {
    describe(`Given: an Authorizable, 'User' class
              And: an anoymous object
              Both: populated with same id: 'u_12345'
                And: reference to an AssociatedResource:Division, via division_id: 'b_abcde'`, () => {
      const id = 'u_12345';
      const division_id = 'b_abcde';
      const owner_id = 'o_abcde';
      const counterparty_id = 'c_12345';
      class User {
        // tslint:disable-next-line: no-shadowed-variable
        constructor(
          private id: string,
          private division_id: string,
          private owner_id: string,
          private counterparty_id: string
        ) {}
        toString() {
          return [this.id, this.division_id, this.owner_id, this.counterparty_id];
        }
      }
      const classResource = new User(id, division_id, owner_id, counterparty_id);
      // const objectResource = { id, division_id };
      describe('And: an Authorizer that wraps an AccessToken with ADMIN role for both the AuthorizableResource and the AssociatedResource', () => {
        const authHeader = createAuthHeader(
          {
            roles: {
              [Roles.ADMIN]: [id, division_id],
              [Roles.USER]: [],
              [Roles.PENDING]: []
            },
            scopes: []
          },
          SECRET
        );
        const authorizer = new Authorizer(authHeader, SECRET);
        authorizer.authenticate();
        describe(`When: asking for permissions to execute an Action included in the Roles for Group identified by the name of the ClassResource:User`, () => {
          describe('And: not overriding default attribute', () => {
            describe('And: not specifying a resource', () => {
              test('Then: authorization via `can()` is granted', () => {
                // Delete the User implicitly identified by User.id.
                // Allowed because a this accessToken has Admin Rights on the u_hashid,
                // and per Matrix, Admin rights on a u_hashid allow deletion.
                expect(authorizer.can(Actions.DELETE, classResource, [matrix])).toBe(true);
              });
            });
            describe('And: specifying the associated Resource:Division', () => {
              // Delete the User implicitly identified by User.division_id
              // Denied because this accessToken has Admin rights on the user.division_id
              // And per Matrix, Admin rights on a user.division_id rejects deletion.
              test('Then: authorization is denied', () => {
                expect(
                  authorizer.can(
                    Actions.DELETE,
                    classResource,
                    [matrix],
                    undefined,
                    Resource.Division
                  )
                ).toBe(false);
              });
            });
          });
          describe('And: overriding default attribute', () => {
            describe('And: not specifying a resource', () => {
              // Delete the User explicitly identified by User.id
              // Allowed beacuse this accessToken has Admin rights on the user.id
              // And per matrix, Admin rights on a User allows deletion
              test('Then: authorization via `can()` is allowed', () => {
                expect(authorizer.can(Actions.DELETE, classResource, [matrix], 'id')).toBe(true);
              });
            });
            describe('And: specifying the associated Resource:Division', () => {
              // Delete the User explicitly identified by User.id, explicitly checked against Division rules.
              // Denied because this accessToken has Admin rights on the User.division_id
              // And per matrix, Admin rights on Division denies deletion
              test('Then: authorization is denied', () => {
                expect(
                  authorizer.can(Actions.DELETE, classResource, [matrix], 'id', Resource.Division)
                ).toBe(false);
              });
            });
          });
          describe('And: overriding default attribute with multiple attributes where one is valid', () => {
            describe('And: not specifying a resource', () => {
              // Delete the User explicitly identified by User.id or User.division_id
              // Allowed beacuse this accessToken has Admin rights on the user.id and user.division_id
              // And per matrix, Admin rights on a User allows deletion
              test('Then: authorization via `can()` is allowed', () => {
                expect(
                  authorizer.can(Actions.DELETE, classResource, [matrix], ['id', 'division_id'])
                ).toBe(true);
              });
            });
          });
          describe('And: overriding default attribute with multiple attributes where none are valid', () => {
            describe('And: not specifying a resource', () => {
              // Request the User explicitly identified by User.owner_id or User.counterparty_id
              // Not allowed beacuse this accessToken has does not have Admin rights on the user.owner_id or the user.counterparty_id
              test('Then: authorization via `can()` is denied', () => {
                expect(
                  authorizer.can(
                    Actions.REQUEST,
                    classResource,
                    [matrix],
                    ['owner_id', 'counterparty_id']
                  )
                ).toBe(false);
              });
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
  describe('Feature: `inScope()` always returns true for a system administrator', () => {
    describe('Given: A user with an authHeader that contains SYSADMIN scope', () => {
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
      describe('When: asking for a more specific scope, e.g. BANKINGADMIN', () => {
        test('Then: `inScope()` returns true', () => {
          expect(authorizer.inScope(Scopes.BANKINGADMIN)).toBe(true);
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
        scopes: [Scopes.BANKINGADMIN]
      },
      SECRET
    );
    const authorizer = new Authorizer(authHeader, SECRET);
    authorizer.authenticate();
    describe('When querying inScope with a single parameter', () => {
      test('Then: a missing scope fails', () => {
        expect(authorizer.inScope(Scopes.ORDERADMIN)).toBe(false);
      });
      test('Then: a present scope passes', () => {
        expect(authorizer.inScope(Scopes.BANKINGADMIN)).toBe(true);
      });
    });
    describe('When querying inScope with an array parameter', () => {
      test('Then: a missing scope fails', () => {
        expect(authorizer.inScope([Scopes.ORDERADMIN])).toBe(false);
      });
      test('Then: a present scope passes', () => {
        expect(authorizer.inScope([Scopes.BANKINGADMIN])).toBe(true);
      });
    });
  });
  describe('Feature: methods throw if the authorizer has not yet been authenticated', () => {
    describe('Given: two authorizers, one authenticated, one not, exist', () => {
      const id = 'b_abcde';
      const authHeader = createAuthHeader(
        {
          roles: {
            [Roles.ADMIN]: [id],
            [Roles.USER]: [],
            [Roles.PENDING]: []
          },
          user: 'u_abcde',
          client: 'here for good measure',
          scopes: [Scopes.BANKINGADMIN]
        },
        SECRET
      );
      const unauthenticated = new Authorizer(authHeader, SECRET);
      const authenticated = new Authorizer(authHeader, SECRET);
      beforeAll(() => {
        authenticated.authenticate();
      });
      describe.each(['getUser', 'getRoles', 'getClient', 'inScope'])(
        'When: invoking %s on the unauthenticated authorizer',
        methodName => {
          test('Then: an error is thrown', () => {
            expect(() => (unauthenticated as any)[methodName]()).toThrowError();
          });
        }
      );
      describe.each(['getUser', 'getRoles', 'getClient', 'inScope'])(
        'When: invoking %s on the authenticated authorizer',
        methodName => {
          test('Then: no error is thrown', () => {
            expect(() => (authenticated as any)[methodName]()).not.toThrowError();
          });
        }
      );
      test('Then: inScope passes args through decorator', () => {
        expect(authenticated.inScope(Scopes.BANKINGADMIN)).toBe(true);
        expect(authenticated.inScope([Scopes.BANKINGADMIN])).toBe(true);
      });
    });
  });
});
