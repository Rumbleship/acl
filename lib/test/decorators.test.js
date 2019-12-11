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
const types_1 = require("./../types");
const authorizer_1 = require("./../authorizer");
const helpers_1 = require("../helpers");
const decorators_1 = require("../decorators");
const SECRET = 'signingsecret';
const user_id = 'u_abcde';
const owner_id = 'u_different';
const authorizable = { user_id, owner_id };
const userOfUserRelatedToAuthorizableeHeader = helpers_1.createAuthHeader({
    roles: {
        [types_1.Roles.ADMIN]: [],
        [types_1.Roles.USER]: [user_id],
        [types_1.Roles.PENDING]: []
    },
    scopes: []
}, SECRET);
const userOfOwnerRelatedToAuthorizable = helpers_1.createAuthHeader({
    roles: {
        [types_1.Roles.ADMIN]: [],
        [types_1.Roles.USER]: [owner_id],
        [types_1.Roles.PENDING]: []
    },
    scopes: []
}, SECRET);
const pendingUserAuthHeader = helpers_1.createAuthHeader({
    roles: {
        [types_1.Roles.ADMIN]: [],
        [types_1.Roles.USER]: [],
        [types_1.Roles.PENDING]: [user_id]
    },
    scopes: []
}, SECRET);
const matrix = {
    [types_1.Roles.USER]: { [types_1.Resource.User]: [types_1.Actions.QUERY] }
};
class SuperClass {
    constructor(user_id) {
        this.user_id = user_id;
        this.superCallCount = 0;
    }
    permissionedByExternalAuthorizable(header) {
        this.superCallCount++;
        const authorizer = new authorizer_1.Authorizer(header, SECRET);
        authorizer.authenticate();
        if (authorizer.can(types_1.Actions.QUERY, authorizable, [matrix])) {
            return true;
        }
        return false;
    }
    reflexiveMethod(header) {
        this.superCallCount++;
        const authorizer = new authorizer_1.Authorizer(header, SECRET);
        authorizer.authenticate();
        if (authorizer.can(types_1.Actions.QUERY, this, [matrix])) {
            return true;
        }
        return false;
    }
}
class PropertyDecoratorSubclass extends SuperClass {
    // tslint:disable-next-line: no-shadowed-variable
    constructor(user_id, owner_id) {
        super(user_id);
        this.user_id = user_id;
        this.owner_id = owner_id;
    }
}
__decorate([
    decorators_1.AuthorizerTreatAs(types_1.Resource.User),
    __metadata("design:type", String)
], PropertyDecoratorSubclass.prototype, "owner_id", void 0);
describe('Given: instance of a subclass that extends super', () => {
    const mySuper = new SuperClass(user_id);
    const mySub = new PropertyDecoratorSubclass(user_id, owner_id);
    describe('And: the subclass has decorated a property to force processing of `owner_id` as a reference to a `Resource.User`', () => {
        describe('And: the permissioned action uses a wholly different object to permission on', () => {
            describe('When: invoking method with a jwt that matches on `user_id`', () => {
                test('Then: the superclass passes: inflected to `user_id`', () => {
                    expect(mySuper.permissionedByExternalAuthorizable(userOfUserRelatedToAuthorizableeHeader)).toBe(true);
                });
                test('Then: the subclass passes: inflected to `user_id`', () => {
                    expect(mySub.permissionedByExternalAuthorizable(userOfUserRelatedToAuthorizableeHeader)).toBe(true);
                });
            });
            describe('When: invoking method with a jwt that matches on `owner_id`', () => {
                test('Then: the superclass fails: cannot inflect', () => {
                    expect(mySuper.permissionedByExternalAuthorizable(userOfOwnerRelatedToAuthorizable)).toBe(false);
                });
                test('Then: the subclass fails: cannot inflect', () => {
                    expect(mySub.permissionedByExternalAuthorizable(userOfOwnerRelatedToAuthorizable)).toBe(false);
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
//# sourceMappingURL=decorators.test.js.map