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
            [types_1.Resource.Division]: [types_1.Actions.UPDATE, types_1.Actions.READ, types_1.Actions.APPROVE],
            [types_1.Resource.User]: [types_1.Actions.DELETE]
        },
        [types_1.Roles.USER]: {
            [types_1.Resource.Division]: [types_1.Actions.READ, types_1.Actions.APPROVE]
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
                    }
                }, SECRET);
                beforeAll(() => {
                    authorizer = new index_1.Authorizer(authHeader, SECRET, types_1.PermissionSource.MATRIX, matrix);
                    authorizer.authenticate();
                });
                describe('When: asking for an authorized action against an owned resource with a non-intersecting set of Actions allowed', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.READ, types_1.Actions.APPROVE])('%s:u_123ce', action => {
                        test('Then: authorization via `can()  `is denied', () => {
                            expect(authorizer.can(action, resource, undefined, 'hashid', types_1.Resource.User)).toBe(false);
                        });
                        test('Then: authorization via deprecated `allowed()` is denied', () => {
                            expect(authorizer.allowed({
                                to: action,
                                from: types_1.Resource.User,
                                match: 'hashid',
                                against: resource
                            })).toBe(false);
                        });
                    });
                });
                describe('When: asking for an unauthorized action against an owned resource with a non-intersecting set of Actions defined', () => {
                    describe.each([types_1.Actions.REQUEST])('%s:u_123ce', action => {
                        test('Then: authorization is denied', () => {
                            expect(authorizer.can(action, resource, undefined, 'hashid', types_1.Resource.User)).toBe(false);
                        });
                        test('Then: authorization via deprecated `allowed()` is denied', () => {
                            expect(authorizer.allowed({
                                to: action,
                                from: types_1.Resource.User,
                                match: 'hashid',
                                against: resource
                            })).toBe(false);
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
                    }
                }, SECRET);
                beforeAll(() => {
                    authorizer = new index_1.Authorizer(authHeader, SECRET, types_1.PermissionSource.MATRIX, matrix);
                    authorizer.authenticate();
                });
                describe('When: asking for an allowed Action against an owned Resource', () => {
                    describe.each([types_1.Actions.READ, types_1.Actions.APPROVE])('%s:b_abcde', action => {
                        test('Then: authorization via `can()` is granted', () => {
                            expect(authorizer.can(action, resource, undefined, 'hashid', types_1.Resource.Division)).toBe(true);
                        });
                        test('Then: authorization via deprecated `allowed()` is granted', () => {
                            expect(authorizer.allowed({
                                to: action,
                                from: types_1.Resource.Division,
                                match: 'hashid',
                                against: resource
                            })).toBe(true);
                        });
                    });
                });
                describe('When: asking for an allowed Action against an unowned Resource', () => {
                    describe.each([types_1.Actions.READ, types_1.Actions.APPROVE])('%s:u_123ce', action => {
                        test('Then: authorization via `can` is denied', () => {
                            expect(authorizer.can(action, anotherResource, undefined, 'hashid', types_1.Resource.Division)).toBe(false);
                        });
                        test('Then: authorization via deprecated `allowed()` is denied', () => {
                            expect(authorizer.allowed({
                                to: action,
                                from: types_1.Resource.Division,
                                match: 'hashid',
                                against: anotherResource
                            })).toBe(false);
                        });
                    });
                });
                describe('When: asking for an unapproved Action against an unowned Resource', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.REQUEST])('%s:u_123ce', action => {
                        test('Then: authorization via `can()` is denied', () => {
                            expect(authorizer.can(action, anotherResource, undefined, 'hashid', types_1.Resource.Division)).toBe(false);
                        });
                        test('Then: authorization via deprecated `allowed()` is denied', () => {
                            expect(authorizer.allowed({
                                to: action,
                                from: types_1.Resource.Division,
                                match: 'hashid',
                                against: anotherResource
                            })).toBe(false);
                        });
                    });
                });
                describe('When: asking for an unapproved Action against an authorized Resource', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.REQUEST])('%s:b_abcde', action => {
                        test('Then: autherization via `can()` is denied', () => {
                            expect(authorizer.can(action, resource, undefined, 'hashid', types_1.Resource.Division)).toBe(false);
                        });
                        test('Then: authorization via deprecated `allowed()` is denied', () => {
                            expect(authorizer.allowed({
                                to: action,
                                from: types_1.Resource.Division,
                                match: 'hashid',
                                against: resource
                            })).toBe(false);
                        });
                    });
                });
            });
            describe('And: an Authorizer wrapping an AccessToken that corresponds to SysAdmin roles', () => {
                let authorizer;
                const authHeader = index_1.createAuthHeader({
                    roles: {
                        [types_1.Roles.ADMIN]: ['*'],
                        [types_1.Roles.USER]: ['*'],
                        [types_1.Roles.PENDING]: ['*']
                    }
                }, SECRET);
                beforeAll(() => {
                    authorizer = new index_1.Authorizer(authHeader, SECRET, types_1.PermissionSource.MATRIX, matrix);
                    authorizer.authenticate();
                });
                test('Then: `authorizer.isUserSysAdmin() returns true', () => {
                    expect(authorizer.isUserSysAdmin()).toBe(true);
                });
                describe('When: asking for any action against a resource', () => {
                    describe.each([types_1.Actions.UPDATE, types_1.Actions.READ, types_1.Actions.APPROVE, types_1.Actions.REQUEST])('%s:s_anything', action => {
                        test('Then: authorization via `can()` is granted', () => {
                            expect(authorizer.can(action, { hashid: 'foo' }, undefined, 'hashid', types_1.Resource.Division)).toBe(true);
                        });
                        test('Then: authorization via deprecated `allowed()` is granted', () => {
                            expect(authorizer.allowed({
                                to: action,
                                from: types_1.Resource.Division,
                                match: 'hashid',
                                against: { hashid: 'foo' }
                            })).toBe(true);
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
    describe('Feature: `can()` defaults to matching against attribute `hashid` ', () => {
        describe('And: the permission matrix assigned at instantiation is not overriden at invocation', () => {
            describe(`And: two resources:
          One that should be authorized against 'id'
          One that should be authorized against its 'hashid' `, () => {
                const id = 'b_abcde';
                const hashid = 'u_123de';
                const permissionedOnId = { id };
                const permissionedOnHashid = { hashid };
                describe('When: requesting permissions without specifying a field, against the hashid record', () => {
                    let authorizer;
                    const authHeader = index_1.createAuthHeader({
                        roles: {
                            [types_1.Roles.ADMIN]: [id, hashid],
                            [types_1.Roles.USER]: [],
                            [types_1.Roles.PENDING]: []
                        }
                    }, SECRET);
                    beforeAll(() => {
                        authorizer = new index_1.Authorizer(authHeader, SECRET, types_1.PermissionSource.MATRIX, matrix);
                        authorizer.authenticate();
                    });
                    test('Then: authorization for an allowed permission via `can()` is granted', () => {
                        expect(authorizer.can(types_1.Actions.READ, permissionedOnHashid, undefined, undefined, types_1.Resource.Division)).toBe(true);
                    });
                    test('Then: authorization for an allowed permission via deprecated `allowed()` is granted', () => {
                        expect(authorizer.allowed({
                            to: types_1.Actions.READ,
                            from: types_1.Resource.Division,
                            against: permissionedOnHashid
                        })).toBe(true);
                    });
                });
                describe('When: requesting permissions without specifying a field, against the id record', () => {
                    let authorizer;
                    const authHeader = index_1.createAuthHeader({
                        roles: {
                            [types_1.Roles.ADMIN]: [id, hashid],
                            [types_1.Roles.USER]: [],
                            [types_1.Roles.PENDING]: []
                        }
                    }, SECRET);
                    beforeAll(() => {
                        authorizer = new index_1.Authorizer(authHeader, SECRET, types_1.PermissionSource.MATRIX, matrix);
                        authorizer.authenticate();
                    });
                    test('Then: authorization for an allowed permission via `can()` is denied', () => {
                        expect(authorizer.can(types_1.Actions.READ, permissionedOnId, undefined, undefined, types_1.Resource.Division)).toBe(false);
                    });
                    test('Then: authorization for an allowed permission via deprecated `allowed()` is denied', () => {
                        expect(authorizer.allowed({
                            to: types_1.Actions.READ,
                            from: types_1.Resource.Division,
                            against: permissionedOnId
                        })).toBe(false);
                    });
                });
            });
        });
    });
    describe(`Feature: authorization defaults to using the PermissionGroup that corresponds to to constructor of passed 'AuthorizableResource'`, () => {
        describe(`Given: a named class 'User' and an anoymous object populated with same identifier: 'u_12345'`, () => {
            const hashid = 'u_12345';
            class User {
                // tslint:disable-next-line: no-shadowed-variable
                constructor(hashid) {
                    this.hashid = hashid;
                }
                toString() {
                    return this.hashid;
                }
            }
            const classResource = new User(hashid);
            const objectResource = { hashid };
            describe('And: an Authorizer that wraps an AccessToken ADMIN role on the resource', () => {
                const authHeader = index_1.createAuthHeader({
                    roles: {
                        [types_1.Roles.ADMIN]: [hashid],
                        [types_1.Roles.USER]: [],
                        [types_1.Roles.PENDING]: []
                    }
                }, SECRET);
                const authorizer = new index_1.Authorizer(authHeader, SECRET, types_1.PermissionSource.MATRIX, matrix);
                authorizer.authenticate();
                describe(`When: referencing the classResource`, () => {
                    describe('And: not overriding default PermissionGroup', () => {
                        test('The: authorization via deprecated `allowed()` is granted', () => {
                            expect(authorizer.allowed({
                                to: types_1.Actions.DELETE,
                                against: classResource
                            })).toBe(true);
                        });
                        test('Then: authorization via `can()` is granted', () => {
                            expect(authorizer.can(types_1.Actions.DELETE, classResource)).toBe(true);
                        });
                    });
                    describe(`And: overriding the PermissionGroup default`, () => {
                        test('Then: authorization requested via `can()` should be granted', () => {
                            expect(authorizer.can(types_1.Actions.READ, classResource, undefined, undefined, types_1.Resource.Division)).toBe(true);
                        });
                        test('Then: authorization requested via deprecated `allowed()` should be granted', () => {
                            expect(authorizer.allowed({
                                to: types_1.Actions.READ,
                                from: types_1.Resource.Division,
                                against: classResource
                            })).toBe(true);
                        });
                    });
                });
                describe('When: referencing the objectResource', () => {
                    describe('And: not overriding the default PermissionGroup', () => {
                        test('Then: authorization via `can()` throws', () => {
                            expect(() => authorizer.can(types_1.Actions.DELETE, objectResource)).toThrow('Cannot permission on generic `Object`');
                        });
                        test('Then: authorization via deprecated `allowed()` throws', () => {
                            expect(() => authorizer.allowed({
                                to: types_1.Actions.DELETE,
                                against: objectResource
                            })).toThrow('Cannot permission on generic `Object`');
                        });
                    });
                    describe(`And: overriding the PermissionGroup default`, () => {
                        test('Then: authorization requested via `can()` should be granted', () => {
                            expect(authorizer.can(types_1.Actions.READ, objectResource, undefined, undefined, types_1.Resource.Division)).toBe(true);
                        });
                        test('Then: authorization requested via deprecated `allowed()` should be granted', () => {
                            expect(authorizer.allowed({
                                to: types_1.Actions.READ,
                                from: types_1.Resource.Division,
                                against: objectResource
                            })).toBe(true);
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
                let authorizer;
                beforeAll(() => {
                    const roles = index_1.baseRoles();
                    const accessToken = jwt.sign({ roles }, SECRET);
                    authorizer = new index_1.Authorizer(`Bearer ${accessToken}`, SECRET, types_1.PermissionSource.MATRIX, matrix);
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
                    const roles = index_1.baseRoles();
                    const accessToken = jwt.sign({ roles }, SECRET, {
                        expiresIn: '2sec'
                    });
                    authorizer = new index_1.Authorizer(`Bearer ${accessToken}`, SECRET, types_1.PermissionSource.MATRIX, matrix);
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
    describe('Feature: helpers.sysAdminRoles() constructs a claims object with just `["*"]`', () => {
        test.each(Object.values(types_1.Roles))('Then: the %s role is present, with "*" in its array', role => {
            const roles = helpers_1.sysAdminRoles();
            expect(roles[role]).toStrictEqual(['*']);
        });
    });
    describe('Feature: helpers.baseRoles() returns a claims object with empty arrays for all roles', () => {
        test.each(Object.values(types_1.Roles))('Then: the %s role is present, with "*" in its array', role => {
            const roles = index_1.baseRoles();
            expect(roles[role]).toStrictEqual([]);
        });
    });
});
//# sourceMappingURL=index.test.js.map