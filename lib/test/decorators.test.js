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
    constructor() {
        this.superCallCount = 0;
    }
    permissionedMethod(header) {
        this.superCallCount++;
        const authorizer = new authorizer_1.Authorizer(header, SECRET);
        authorizer.authenticate();
        const attribute = Reflect.get(this, Symbol.for(`permissionedMethodAuthorizedAttribute`));
        const r = Reflect.get(this, Symbol.for(`permissionedMethodAuthorizedResource`));
        if (authorizer.can(types_1.Actions.QUERY, authorizable, [matrix], attribute, r)) {
            return true;
        }
        return false;
    }
}
class AuthorizedSubClass extends SuperClass {
    constructor() {
        super(...arguments);
        this.subCallCount = 0;
    }
    permissionedMethod(header) {
        this.subCallCount++;
        const superValue = super.permissionedMethod(header);
        return superValue;
    }
}
__decorate([
    decorators_1.AuthorizedAttribute('owner_id'),
    decorators_1.AuthorizedResource('User'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Boolean)
], AuthorizedSubClass.prototype, "permissionedMethod", null);
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
//# sourceMappingURL=decorators.test.js.map