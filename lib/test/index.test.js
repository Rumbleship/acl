"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tk = require("timekeeper");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const index_1 = require("./../index");
const types_1 = require("./../types");
const helpers_1 = require("../helpers");
const SECRET = 'signingsecret';
describe(`Given: a permission matrix that gives:
      admin: 'UPDATE', 'READ', 'APPROVE' on a 'Division'
              'DELETE' on a 'User'
      user: 'READ', 'APPROVE' on a 'Division',
      pending: 'REQUEST' on a 'Division'`, () => {
    const matrix = {
        [types_1.Roles.ADMIN]: {
            [types_1.Resource.Division]: [types_1.Actions.UPDATE, types_1.Actions.QUERY, types_1.Actions.APPROVE],
            [types_1.Resource.User]: [types_1.Actions.DELETE]
        },
        [types_1.Roles.USER]: {
            [types_1.Resource.Division]: [types_1.Actions.QUERY, types_1.Actions.APPROVE]
        },
        [types_1.Roles.PENDING]: {
            [types_1.Resource.Division]: [types_1.Actions.REQUEST]
        }
    };
    describe('Feature: An Authorizer can provide permissions', () => {
        describe('And: two resources: [`b_abcde`, `u_123ce`]', () => {
            describe('And: an Authorizer wrapping a signed AccessToken that has `User` role on the first, `b_abcde`, and `ADMIN` role for both the other, `s_123ce`, `u_54def`', () => {
                let authorizer;
                const id = 'b_abcde';
                const anotherId = 'u_123ce';
                const resource = { hashid: id };
                const authHeader = index_1.createAuthHeader({
                    roles: {
                        [types_1.Roles.ADMIN]: [id, anotherId],
                        [types_1.Roles.USER]: [],
                        [types_1.Roles.PENDING]: []
                    },
                    scopes: []
                }, SECRET);
                beforeAll(() => {
                    authorizer = new index_1.Authorizer(authHeader, SECRET);
                    authorizer.authenticate();
                });
                describe('When: asking for an authorized action against an owned resource with a non-intersecting set of Actions allowed', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.QUERY, types_1.Actions.APPROVE])('%s:u_123ce', action => {
                        test('Then: authorization via `can()  `is denied', () => {
                            expect(authorizer.can(action, resource, [matrix], 'hashid', types_1.Resource.User)).toBe(false);
                        });
                    });
                });
                describe('When: asking for an unauthorized action against an owned resource with a non-intersecting set of Actions defined', () => {
                    describe.each([types_1.Actions.REQUEST])('%s:u_123ce', action => {
                        test('Then: authorization is denied', () => {
                            expect(authorizer.can(action, resource, [matrix], 'hashid')).toBe(false);
                        });
                    });
                });
            });
            describe('And: an Authorizer wrapping a signed AccessToken that has `User` roles for one of them, `b_abcde`', () => {
                let authorizer;
                const id = 'b_abcde';
                const anotherId = 'u_123ce';
                const resource = { hashid: id };
                const anotherResource = { hashid: anotherId };
                const authHeader = index_1.createAuthHeader({
                    roles: {
                        [types_1.Roles.ADMIN]: [],
                        [types_1.Roles.USER]: [id],
                        [types_1.Roles.PENDING]: []
                    },
                    scopes: []
                }, SECRET);
                beforeAll(() => {
                    authorizer = new index_1.Authorizer(authHeader, SECRET);
                    authorizer.authenticate();
                });
                describe('When: asking for an allowed Action against an owned Resource', () => {
                    describe.each([types_1.Actions.QUERY, types_1.Actions.APPROVE])('%s:b_abcde', action => {
                        test('Then: authorization via `can()` is granted', () => {
                            expect(authorizer.can(action, resource, [matrix], 'hashid', types_1.Resource.Division)).toBe(true);
                        });
                    });
                });
                describe('When: asking for an allowed Action against an unowned Resource', () => {
                    describe.each([types_1.Actions.QUERY, types_1.Actions.APPROVE])('%s:u_123ce', action => {
                        test('Then: authorization via `can` is denied', () => {
                            expect(authorizer.can(action, anotherResource, [matrix], 'hashid', types_1.Resource.Division)).toBe(false);
                        });
                    });
                });
                describe('When: asking for an unapproved Action against an unowned Resource', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.REQUEST])('%s:u_123ce', action => {
                        test('Then: authorization via `can()` is denied', () => {
                            expect(authorizer.can(action, anotherResource, [matrix], 'hashid', types_1.Resource.Division)).toBe(false);
                        });
                    });
                });
                describe('When: asking for an unapproved Action against an authorized Resource', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.REQUEST])('%s:b_abcde', action => {
                        test('Then: autherization via `can()` is denied', () => {
                            expect(authorizer.can(action, resource, [matrix], 'hashid', types_1.Resource.Division)).toBe(false);
                        });
                    });
                });
            });
            describe('And: an Authorizer wrapping an AccessToken that corresponds to SysAdmin Scope', () => {
                let authorizer;
                const authHeader = index_1.createAuthHeader({
                    roles: {
                        [types_1.Roles.ADMIN]: [],
                        [types_1.Roles.USER]: [],
                        [types_1.Roles.PENDING]: []
                    },
                    scopes: [types_1.Scopes.SYSADMIN]
                }, SECRET);
                beforeAll(() => {
                    authorizer = new index_1.Authorizer(authHeader, SECRET);
                    authorizer.authenticate();
                });
                test('Then: The authorizer can successfully scope-check as a SysAdmin', () => {
                    expect(authorizer.inScope(types_1.Scopes.SYSADMIN)).toBe(true);
                });
                describe('When: asking for any action against a resource', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.QUERY, types_1.Actions.APPROVE, types_1.Actions.REQUEST])('%s:s_anything', action => {
                        test('Then: authorization via `can()` is granted', () => {
                            expect(authorizer.can(action, { hashid: 'foo' }, [matrix], 'hashid', types_1.Resource.Division)).toBe(true);
                        });
                    });
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
        ])('Constructing an Authorizer with an invalid auth header: %s throws', (badAuthHeader) => {
            expect(() => new index_1.Authorizer(badAuthHeader, SECRET)).toThrow();
        });
        test('Constructing an authorizer with a valid header `Bearer jwt.claims.here` succeeds', () => {
            expect(new index_1.Authorizer('Bearer jwt.claims.here', SECRET)).toBeTruthy();
        });
    });
    describe(`Feature: authorization defaults to using the Group that corresponds to to constructor of passed 'Authorizable'`, () => {
        describe(`Given: an Authorizable, 'User' class 
              And: an anoymous object 
              Both: populated with same id: 'u_12345' 
                And: reference to an AssociatedResource:Division, via division_id: 'b_abcde'`, () => {
            const id = 'u_12345';
            const division_id = 'b_abcde';
            class User {
                // tslint:disable-next-line: no-shadowed-variable
                constructor(id, division_id) {
                    this.id = id;
                    this.division_id = division_id;
                }
                toString() {
                    return [this.id, this.division_id];
                }
            }
            const classResource = new User(id, division_id);
            // const objectResource = { id, division_id };
            describe('And: an Authorizer that wraps an AccessToken with ADMIN role for both the AuthorizableResource and the AssociatedResource', () => {
                const authHeader = index_1.createAuthHeader({
                    roles: {
                        [types_1.Roles.ADMIN]: [id, division_id],
                        [types_1.Roles.USER]: [],
                        [types_1.Roles.PENDING]: []
                    },
                    scopes: []
                }, SECRET);
                const authorizer = new index_1.Authorizer(authHeader, SECRET);
                authorizer.authenticate();
                describe(`When: asking for permissions to execute an Action included in the Roles for Group identified by the name of the ClassResource:User`, () => {
                    describe('And: not overriding default attribute', () => {
                        describe('And: not specifying a resource', () => {
                            test('Then: authorization via `can()` is granted', () => {
                                // Delete the User implicitly identified by User.id.
                                // Allowed because a this accessToken has Admin Rights on the u_hashid,
                                // and per Matrix, Admin rights on a u_hashid allow deletion.
                                expect(authorizer.can(types_1.Actions.DELETE, classResource, [matrix])).toBe(true);
                            });
                        });
                        describe('And: specifying the associated Resource:Division', () => {
                            // Delete the User implicitly identified by User.division_id
                            // Denied because this accessToken has Admin rights on the user.division_id
                            // And per Matrix, Admin rights on a user.division_id rejects deletion.
                            test('Then: authorization is denied', () => {
                                expect(authorizer.can(types_1.Actions.DELETE, classResource, [matrix], undefined, types_1.Resource.Division)).toBe(false);
                            });
                        });
                    });
                    describe('And: overriding default attribute', () => {
                        describe('And: not specifying a resource', () => {
                            // Delete the User explicitly identified by User.id
                            // Allowed beacuse this accessToken has Admin rights on the user.id
                            // And per matrix, Admin rights on a User allows deletion
                            test('Then: authorization via `can()` is allowed', () => {
                                expect(authorizer.can(types_1.Actions.DELETE, classResource, [matrix], 'id')).toBe(true);
                            });
                        });
                        describe('And: specifying the associated Resource:Division', () => {
                            // Delete the User explicitly identified by User.id, explicitly checked against Division rules.
                            // Denied because this accessToken has Admin rights on the User.division_id
                            // And per matrix, Admin rights on Division denies deletion
                            test('Then: authorization is denied', () => {
                                expect(authorizer.can(types_1.Actions.DELETE, classResource, [matrix], 'id', types_1.Resource.Division)).toBe(false);
                            });
                        });
                    });
                });
                // describe.only('When: referencing the objectResource', () => {
                //   describe(`And: overriding the PermissionGroup default`, () => {
                //     test('Then: authorization requested via `can()` should be granted', () => {
                //       expect(
                //         authorizer.can(Actions.QUERY, objectResource, [matrix], undefined, Resource.Division)
                //       ).toBe(true);
                //     });
                //   });
                // });
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
                let authorizer;
                beforeAll(() => {
                    const roles = helpers_1.baseRoles();
                    const accessToken = jwt.sign({ roles }, SECRET);
                    authorizer = new index_1.Authorizer(`Bearer ${accessToken}`, SECRET);
                });
                describe('When: authenticating the authorizer', () => {
                    test('Then: authorizer.authenticate() should return true', () => {
                        expect(() => authorizer.authenticate()).not.toThrow();
                        expect(authorizer.authenticate()).toBe(true);
                    });
                });
            });
            describe('And: an Authorizer wrapping an accessToken whose `claims.exp` is in the past', () => {
                let authorizer;
                let tenSecondsAgo;
                beforeAll(() => {
                    tenSecondsAgo = moment(now).subtract(10, 'seconds');
                    tk.travel(tenSecondsAgo.toDate());
                    const roles = helpers_1.baseRoles();
                    const accessToken = jwt.sign({ roles }, SECRET, {
                        expiresIn: '2sec'
                    });
                    authorizer = new index_1.Authorizer(`Bearer ${accessToken}`, SECRET);
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
            const authHeader = index_1.createAuthHeader({
                roles: {
                    [types_1.Roles.ADMIN]: [id],
                    [types_1.Roles.USER]: [],
                    [types_1.Roles.PENDING]: []
                },
                scopes: [types_1.Scopes.SYSADMIN]
            }, SECRET);
            const authorizer = new index_1.Authorizer(authHeader, SECRET);
            authorizer.authenticate();
            describe('When: asking for a more specific scope, e.g. BANKINGADMIN', () => {
                test('Then: `inScope()` returns true', () => {
                    expect(authorizer.inScope(types_1.Scopes.BANKINGADMIN)).toBe(true);
                });
            });
        });
    });
    describe('Feature: `inScope()` accepts an array or a single scope', () => {
        const id = 'u_12345';
        const authHeader = index_1.createAuthHeader({
            roles: {
                [types_1.Roles.ADMIN]: [id],
                [types_1.Roles.USER]: [],
                [types_1.Roles.PENDING]: []
            },
            scopes: [types_1.Scopes.BANKINGADMIN]
        }, SECRET);
        const authorizer = new index_1.Authorizer(authHeader, SECRET);
        authorizer.authenticate();
        describe('When querying inScope with a single parameter', () => {
            test('Then: a missing scope fails', () => {
                expect(authorizer.inScope(types_1.Scopes.ORDERADMIN)).toBe(false);
            });
            test('Then: a present scope passes', () => {
                expect(authorizer.inScope(types_1.Scopes.BANKINGADMIN)).toBe(true);
            });
        });
        describe('When querying inScope with an array parameter', () => {
            test('Then: a missing scope fails', () => {
                expect(authorizer.inScope([types_1.Scopes.ORDERADMIN])).toBe(false);
            });
            test('Then: a present scope passes', () => {
                expect(authorizer.inScope([types_1.Scopes.BANKINGADMIN])).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=index.test.js.map