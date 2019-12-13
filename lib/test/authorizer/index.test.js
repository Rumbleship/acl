"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const permissions_matrix_1 = require("../../permissions-matrix");
const tk = require("timekeeper");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const index_1 = require("../../index");
const types_1 = require("../../types");
const helpers_1 = require("../../helpers");
const authorizer_treat_as_directive_1 = require("../../authorizer-treat-as.directive");
const SECRET = 'signingsecret';
// const matrixAsObject = {
//   [Roles.ADMIN]: {
//     [Resource.Division]: [Actions.UPDATE, Actions.QUERY, Actions.APPROVE],
//     [Resource.User]: [Actions.DELETE]
//   },
//   [Roles.USER]: {
//     [Resource.Division]: [Actions.QUERY, Actions.APPROVE]
//   },
//   [Roles.PENDING]: {
//     [Resource.Division]: [Actions.REQUEST]
//   }
// };
const matrix = new permissions_matrix_1.Permissions();
matrix.allow({
    role: types_1.Roles.ADMIN,
    at: types_1.Resource.Division,
    to: [types_1.Actions.UPDATE, types_1.Actions.QUERY, types_1.Actions.APPROVE]
});
matrix.allow({
    role: types_1.Roles.ADMIN,
    at: types_1.Resource.User,
    to: [types_1.Actions.DELETE]
});
matrix.allow({
    role: types_1.Roles.USER,
    at: types_1.Resource.Division,
    to: [types_1.Actions.QUERY, types_1.Actions.APPROVE]
});
matrix.allow({
    role: types_1.Roles.PENDING,
    at: types_1.Resource.Division,
    to: [types_1.Actions.UPDATE, types_1.Actions.QUERY, types_1.Actions.APPROVE]
});
describe(`Given: a permission matrix that gives:
    admin: 'UPDATE', 'READ', 'APPROVE' on a 'Division'
            'DELETE' on a 'User'
    user: 'READ', 'APPROVE' on a 'Division',
    pending: 'REQUEST' on a 'Division'`, () => {
    // describe('Feature: An Authorizer can provide permissions', () => {
    //   describe('And: two resources: [`b_abcde`, `u_123ce`]', () => {
    //     describe('And: an Authorizer wrapping a signed AccessToken that has `User` role on the first, `b_abcde`, and `ADMIN` role for both the other, `s_123ce`, `u_54def`', () => {
    //       let authorizer: Authorizer;
    //       const id = 'b_abcde';
    //       const anotherId = 'u_123ce';
    //       const resource = { hashid: id };
    //       const authHeader = createAuthHeader(
    //         {
    //           roles: {
    //             [Roles.ADMIN]: [id, anotherId],
    //             [Roles.USER]: [],
    //             [Roles.PENDING]: []
    //           },
    //           scopes: []
    //         },
    //         SECRET
    //       );
    //       beforeAll(() => {
    //         authorizer = new Authorizer(authHeader, SECRET);
    //         authorizer.authenticate();
    //       });
    //       describe('When: asking for an authorized action against an owned resource with a non-intersecting set of Actions allowed', () => {
    //         describe.each([Actions.UPDATE, Actions.QUERY, Actions.APPROVE])(
    //           '%s:u_123ce',
    //           action => {
    //             test('Then: authorization via `can()  `is denied', () => {
    //               expect(authorizer.can(action, resource, matrix)).toBe(false);
    //             });
    //           }
    //         );
    //       });
    //       describe('When: asking for an unauthorized action against an owned resource with a non-intersecting set of Actions defined', () => {
    //         describe.each([Actions.REQUEST])('%s:u_123ce', action => {
    //           test('Then: authorization is denied', () => {
    //             // expect(authorizer.can(action, resource, matrix, 'hashid')).toBe(false);
    //             expect(authorizer.can(action, resource, matrix)).toBe(false);
    //           });
    //         });
    //       });
    //     });
    //     describe('And: an Authorizer wrapping a signed AccessToken that has `User` roles for one of them, `b_abcde`', () => {
    //       let authorizer: Authorizer;
    //       const id = 'b_abcde';
    //       const anotherId = 'u_123ce';
    //       const resource = { hashid: id };
    //       const anotherResource = { hashid: anotherId };
    //       const authHeader = createAuthHeader(
    //         {
    //           roles: {
    //             [Roles.ADMIN]: [],
    //             [Roles.USER]: [id],
    //             [Roles.PENDING]: []
    //           },
    //           scopes: []
    //         },
    //         SECRET
    //       );
    //       beforeAll(() => {
    //         authorizer = new Authorizer(authHeader, SECRET);
    //         authorizer.authenticate();
    //       });
    //       describe('When: asking for an allowed Action against an owned Resource', () => {
    //         describe.each([Actions.QUERY, Actions.APPROVE])('%s:b_abcde', action => {
    //           test('Then: authorization via `can()` is granted', () => {
    //             const map = new AuthorizerTreatAsMap([[Resource.Division, ['hashid']]]);
    //             expect(authorizer.can(action, resource, matrix, map)).toBe(true);
    //           });
    //         });
    //       });
    //       describe('When: asking for an allowed Action against an unowned Resource', () => {
    //         describe.each([Actions.QUERY, Actions.APPROVE])('%s:u_123ce', action => {
    //           test('Then: authorization via `can` is denied', () => {
    //             expect(authorizer.can(action, anotherResource, matrix)).toBe(false);
    //           });
    //         });
    //       });
    //       describe('When: asking for an unapproved Action against an unowned Resource', () => {
    //         describe.each([Actions.UPDATE, Actions.REQUEST])('%s:u_123ce', action => {
    //           test('Then: authorization via `can()` is denied', () => {
    //             expect(authorizer.can(action, anotherResource, matrix)).toBe(false);
    //           });
    //         });
    //       });
    //       describe('When: asking for an unapproved Action against an authorized Resource', () => {
    //         describe.each([Actions.UPDATE, Actions.REQUEST])('%s:b_abcde', action => {
    //           test('Then: autherization via `can()` is denied', () => {
    //             expect(authorizer.can(action, resource, matrix)).toBe(false);
    //           });
    //         });
    //       });
    //     });
    //     describe('And: an Authorizer wrapping an AccessToken that corresponds to SysAdmin Scope', () => {
    //       let authorizer: Authorizer;
    //       const authHeader = createAuthHeader(
    //         {
    //           roles: {
    //             [Roles.ADMIN]: [],
    //             [Roles.USER]: [],
    //             [Roles.PENDING]: []
    //           },
    //           scopes: [Scopes.SYSADMIN]
    //         },
    //         SECRET
    //       );
    //       beforeAll(() => {
    //         authorizer = new Authorizer(authHeader, SECRET);
    //         authorizer.authenticate();
    //       });
    //       test('Then: The authorizer can successfully scope-check as a SysAdmin', () => {
    //         expect(authorizer.inScope(Scopes.SYSADMIN)).toBe(true);
    //       });
    //       describe('When: asking for any action against a resource', () => {
    //         describe.each([Actions.UPDATE, Actions.QUERY, Actions.APPROVE, Actions.REQUEST])(
    //           '%s:s_anything',
    //           action => {
    //             test('Then: authorization via `can()` is granted', () => {
    //               expect(
    //                 // authorizer.can(action, { hashid: 'foo' }, matrix, 'hashid', Resource.Division)
    //                 authorizer.can(action, { hashid: 'foo' }, matrix)
    //               ).toBe(true);
    //             });
    //           }
    //         );
    //       });
    //     });
    //   });
    // });
    describe('Feature: An Authorizer only accepts a properly formatted `Bearer {{jwt.claims.here}}', () => {
        test.each([
            'bearer jwt.claims.here',
            'Bearer nosubsections',
            'Bearer',
            'hdaoe',
            'jwt.claims.here',
            ''
        ])('Constructing an Authorizer with an invalid auth header: %s throws', (badAuthHeader) => {
            expect(() => new index_1.Authorizer(badAuthHeader, SECRET)).toThrow();
        });
        test('Constructing an authorizer with a valid header `Bearer jwt.claims.here` succeeds', () => {
            expect(new index_1.Authorizer('Bearer jwt.claims.here', SECRET)).toBeTruthy();
        });
        test('Constructing an Authorizer without a secret throws', () => {
            expect(() => new index_1.Authorizer('Bearer jwt.claims.here', '')).toThrow();
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
            const another_id = 'a_921812';
            class User {
                // tslint:disable-next-line: no-shadowed-variable
                constructor(
                // tslint:disable-next-line: no-shadowed-variable
                id, 
                // tslint:disable-next-line: no-shadowed-variable
                division_id, 
                // tslint:disable-next-line: no-shadowed-variable
                owner_id, 
                // tslint:disable-next-line: no-shadowed-variable
                counterparty_id, 
                // tslint:disable-next-line: no-shadowed-variable
                another_id) {
                    this.id = id;
                    this.division_id = division_id;
                    this.owner_id = owner_id;
                    this.counterparty_id = counterparty_id;
                    this.another_id = another_id;
                }
                compilerDoesntLikeUnusedAttrs() {
                    return [this.id, this.division_id, this.owner_id, this.counterparty_id, this.another_id];
                }
            }
            __decorate([
                authorizer_treat_as_directive_1.AuthorizerTreatAs(types_1.Resource.User),
                __metadata("design:type", String)
            ], User.prototype, "another_id", void 0);
            const classResource = new User(id, division_id, owner_id, counterparty_id, another_id);
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
                    describe('And: not providing an explicit `attribute:resource` map', () => {
                        test('Then: authorization via `can()` is granted', () => {
                            // Delete the User implicitly identified by User.id.
                            // Allowed because a this accessToken has Admin Rights on the u_hashid,
                            // and per Matrix, Admin rights on a u_hashid allow deletion.
                            expect(authorizer.can(types_1.Actions.DELETE, classResource, matrix)).toBe(true);
                        });
                    });
                    describe('And: explicitly mapping `hashid` to `Resource.Division`', () => {
                        // Delete the User implicitly identified by User.division_id
                        // Denied because this accessToken has Admin rights on the user.division_id
                        // And per Matrix, Admin rights on a user.division_id rejects deletion.
                        test('Then: authorization is denied', () => {
                            const map = new authorizer_treat_as_directive_1.AuthorizerTreatAsMap();
                            map.add(types_1.Resource.Division, 'hashid');
                            expect(authorizer.can(types_1.Actions.DELETE, classResource, matrix, map)).toBe(false);
                        });
                    });
                    describe('And: explicitly mapping both `owner_id` and `counterparty_id` to `Resource.User`', () => {
                        const map = new authorizer_treat_as_directive_1.AuthorizerTreatAsMap([
                            [types_1.Resource.User, ['owner_id', 'counterparty_id']]
                        ]);
                        // map.add(Resource.User, 'owner_id');
                        // map.add(Resource.User, 'counterparty_id');
                        // Request the User explicitly identified by User.owner_id or User.counterparty_id
                        // Not allowed beacuse this accessToken has does not have Admin rights on the user.owner_id or the user.counterparty_id
                        test('Then: authorization via `can()` is denied', () => {
                            expect(authorizer.can(types_1.Actions.REQUEST, classResource, matrix, map)).toBe(false);
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
    describe('Feature: methods throw if the authorizer has not yet been authenticated', () => {
        describe('Given: two authorizers, one authenticated, one not, exist', () => {
            const id = 'b_abcde';
            const authHeader = index_1.createAuthHeader({
                roles: {
                    [types_1.Roles.ADMIN]: [id],
                    [types_1.Roles.USER]: [],
                    [types_1.Roles.PENDING]: []
                },
                user: 'u_abcde',
                client: 'here for good measure',
                scopes: [types_1.Scopes.BANKINGADMIN]
            }, SECRET);
            const unauthenticated = new index_1.Authorizer(authHeader, SECRET);
            const authenticated = new index_1.Authorizer(authHeader, SECRET);
            beforeAll(() => {
                authenticated.authenticate();
            });
            describe.each(['getUser', 'getRoles', 'getClient', 'inScope'])('When: invoking %s on the unauthenticated authorizer', methodName => {
                test('Then: an error is thrown', () => {
                    expect(() => unauthenticated[methodName]()).toThrowError();
                });
            });
            describe.each(['getUser', 'getRoles', 'getClient', 'inScope'])('When: invoking %s on the authenticated authorizer', methodName => {
                test('Then: no error is thrown', () => {
                    expect(() => authenticated[methodName]()).not.toThrowError();
                });
            });
            test('Then: inScope passes args through decorator', () => {
                expect(authenticated.inScope(types_1.Scopes.BANKINGADMIN)).toBe(true);
                expect(authenticated.inScope([types_1.Scopes.BANKINGADMIN])).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=index.test.js.map