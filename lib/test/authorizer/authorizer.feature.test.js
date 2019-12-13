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
const authorizer_1 = require("./../../src/authorizer");
const permissions_matrix_1 = require("./../../src/permissions-matrix");
const types_1 = require("./../../src/types");
const helpers_1 = require("./../../src/helpers");
const authorizer_treat_as_directive_1 = require("./../../src/authorizer-treat-as.directive");
const SECRET = 'signingsecret';
const user_id = 'u_abcde';
const buyer_id = 'b_12345';
const supplier_id = 's_8eho0o9';
const adminOfUserHeader = helpers_1.createAuthHeader({
    roles: {
        [types_1.Roles.ADMIN]: [user_id]
    },
    scopes: []
}, SECRET);
const userOfUserHeader = helpers_1.createAuthHeader({
    roles: {
        [types_1.Roles.USER]: [user_id]
    },
    scopes: []
}, SECRET);
const adminOfBuyerHeader = helpers_1.createAuthHeader({
    roles: {
        [types_1.Roles.ADMIN]: [buyer_id]
    },
    scopes: []
}, SECRET);
// const userOfBuyerHeader = createAuthHeader(
//   {
//     roles: {
//       [Roles.USER]: [buyer_id]
//     },
//     scopes: []
//   },
//   SECRET
// );
describe('Working with an explicitly listed Action', () => {
    describe('Scenario: matching on default attribute:id || reflexive self-permissioning of core Authorizables (User|Division)', () => {
        describe('Given: A matrix that allows Role:Admins of Resource:User to Actions:Delete', () => {
            const matrix = new permissions_matrix_1.Permissions();
            matrix.allow({
                role: types_1.Roles.ADMIN,
                at: types_1.Resource.User,
                to: [types_1.Actions.DELETE]
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${user_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(adminOfUserHeader, SECRET);
                authorizer.authenticate();
                class Authorizable {
                    constructor(id) {
                        this.id = id;
                    }
                }
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
                    const noMatchOnId = new Authorizable('u_foobar');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, noMatchOnId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
                    const matchOnId = new Authorizable(user_id);
                    test('Then: authorization is allowed', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, matchOnId, matrix)).toBe(true);
                    });
                });
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${user_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(userOfUserHeader, SECRET);
                authorizer.authenticate();
                class Authorizable {
                    constructor(id) {
                        this.id = id;
                    }
                }
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
                    const noMatchOnId = new Authorizable('u_foobar');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, noMatchOnId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
                    const matchOnId = new Authorizable(user_id);
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, matchOnId, matrix)).toBe(false);
                    });
                });
            });
        });
    });
    describe('Scenario: matching on default association attribute:division_id', () => {
        describe('Given: A matrix that allows Role:Admins of Resource:Division to Actions:Delete', () => {
            const matrix = new permissions_matrix_1.Permissions();
            matrix.allow({
                role: types_1.Roles.ADMIN,
                at: types_1.Resource.Division,
                to: [types_1.Actions.DELETE]
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${buyer_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(adminOfBuyerHeader, SECRET);
                authorizer.authenticate();
                class Authorizable {
                    constructor(division_id) {
                        this.division_id = division_id;
                    }
                }
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${buyer_id}`, () => {
                    const noMatchOnDivisionId = new Authorizable('b_foobar');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, noMatchOnDivisionId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${buyer_id}`, () => {
                    const matchOnDivisionId = new Authorizable(buyer_id);
                    test('Then: authorization is allowed', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, matchOnDivisionId, matrix)).toBe(true);
                    });
                });
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${buyer_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(userOfUserHeader, SECRET);
                authorizer.authenticate();
                class Authorizable {
                    constructor(id) {
                        this.id = id;
                    }
                }
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${buyer_id}`, () => {
                    const noMatchOnId = new Authorizable('b_foobar');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, noMatchOnId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${buyer_id}`, () => {
                    const matchOnId = new Authorizable(buyer_id);
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, matchOnId, matrix)).toBe(false);
                    });
                });
            });
        });
    });
    describe('Scenario: matching on directive-specified association attribute:buyer_id', () => {
        class Authorizable {
            constructor(division_id, _hereforShape) {
                this._hereforShape = _hereforShape;
                this.buyer_id = division_id;
            }
        }
        __decorate([
            authorizer_treat_as_directive_1.AuthorizerTreatAs(types_1.Resource.Division),
            __metadata("design:type", String)
        ], Authorizable.prototype, "buyer_id", void 0);
        describe('Given: A matrix that allows Role:Admins of Resource:Division to Actions:Delete', () => {
            const matrix = new permissions_matrix_1.Permissions();
            matrix.allow({
                role: types_1.Roles.ADMIN,
                at: types_1.Resource.Division,
                to: [types_1.Actions.DELETE]
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${buyer_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(adminOfBuyerHeader, SECRET);
                authorizer.authenticate();
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute DOES NOT MATCH:${buyer_id}`, () => {
                    const noMatchOnDivisionId = new Authorizable('b_foobar', 's_1209a');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, noMatchOnDivisionId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute matches:${buyer_id}`, () => {
                    const matchOnDivisionId = new Authorizable(buyer_id, supplier_id);
                    test('Then: authorization is allowed', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, matchOnDivisionId, matrix)).toBe(true);
                    });
                });
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${buyer_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(userOfUserHeader, SECRET);
                authorizer.authenticate();
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute DOES NOT MATCH:${buyer_id}`, () => {
                    const noMatchOnId = new Authorizable('b_foobar', 's_09aoeud');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, noMatchOnId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute matches:${buyer_id}`, () => {
                    const matchOnId = new Authorizable(buyer_id, supplier_id);
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.DELETE, matchOnId, matrix)).toBe(false);
                    });
                });
            });
        });
    });
});
describe('Working with an unlisted action', () => {
    describe('Scenario: matching on default attribute:id || reflexive self-permissioning of core Authorizables (User|Division)', () => {
        describe('Given: A matrix that allows Role:Admins of Resource:User to Actions:Delete', () => {
            const matrix = new permissions_matrix_1.Permissions();
            matrix.allow({
                role: types_1.Roles.ADMIN,
                at: types_1.Resource.User,
                to: [types_1.Actions.DELETE]
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${user_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(adminOfUserHeader, SECRET);
                authorizer.authenticate();
                class Authorizable {
                    constructor(id) {
                        this.id = id;
                    }
                }
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
                    const noMatchOnId = new Authorizable('u_foobar');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.READ, noMatchOnId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
                    const matchOnId = new Authorizable(user_id);
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.READ, matchOnId, matrix)).toBe(false);
                    });
                });
            });
            describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${user_id}}`, () => {
                const authorizer = new authorizer_1.Authorizer(userOfUserHeader, SECRET);
                authorizer.authenticate();
                class Authorizable {
                    constructor(id) {
                        this.id = id;
                    }
                }
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
                    const noMatchOnId = new Authorizable('u_foobar');
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.READ, noMatchOnId, matrix)).toBe(false);
                    });
                });
                describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
                    const matchOnId = new Authorizable(user_id);
                    test('Then: authorization is denied', () => {
                        expect(authorizer.can(types_1.Actions.READ, matchOnId, matrix)).toBe(false);
                    });
                });
            });
        });
    });
});
describe('Feature: methods throw if the authorizer has not yet been authenticated', () => {
    describe('Given: two authorizers, one authenticated, one not, exist', () => {
        const id = 'b_abcde';
        const authHeader = helpers_1.createAuthHeader({
            roles: {
                [types_1.Roles.ADMIN]: [id],
                [types_1.Roles.USER]: [],
                [types_1.Roles.PENDING]: []
            },
            user: 'u_abcde',
            client: 'here for good measure',
            scopes: [types_1.Scopes.BANKINGADMIN]
        }, SECRET);
        const unauthenticated = new authorizer_1.Authorizer(authHeader, SECRET);
        const authenticated = new authorizer_1.Authorizer(authHeader, SECRET);
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
describe('Feature: `inScope()` always returns true for a system administrator', () => {
    describe('Given: A user with an authHeader that contains SYSADMIN scope', () => {
        const id = 'u_12345';
        const authHeader = helpers_1.createAuthHeader({
            roles: {
                [types_1.Roles.ADMIN]: [id],
                [types_1.Roles.USER]: [],
                [types_1.Roles.PENDING]: []
            },
            scopes: [types_1.Scopes.SYSADMIN]
        }, SECRET);
        const authorizer = new authorizer_1.Authorizer(authHeader, SECRET);
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
    const authHeader = helpers_1.createAuthHeader({
        roles: {
            [types_1.Roles.ADMIN]: [id],
            [types_1.Roles.USER]: [],
            [types_1.Roles.PENDING]: []
        },
        scopes: [types_1.Scopes.BANKINGADMIN]
    }, SECRET);
    const authorizer = new authorizer_1.Authorizer(authHeader, SECRET);
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
//# sourceMappingURL=authorizer.feature.test.js.map