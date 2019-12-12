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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorizer_treat_as_directive_1 = require("./../../authorizer-treat-as.directive");
const types_1 = require("./../../types");
const authorizer_treat_as_directive_2 = require("../../authorizer-treat-as.directive");
describe('Unit: @AuthorizeTreatAs', () => {
    test('Decorating an attribute adds that attribute to the metadata map under specified resource', () => {
        class Foo {
            constructor(some_attribute) {
                this.some_attribute = some_attribute;
            }
        }
        __decorate([
            authorizer_treat_as_directive_2.AuthorizerTreatAs(types_1.Resource.Division),
            __metadata("design:type", String)
        ], Foo.prototype, "some_attribute", void 0);
        const foo = new Foo('bar');
        const retrievedMetadata = Reflect.getMetadata(authorizer_treat_as_directive_1.AuthResourceSymbol, foo);
        expect(retrievedMetadata).toBeTruthy();
        expect(retrievedMetadata.get(types_1.Resource.Division).has('some_attribute')).toBe(true);
    });
    // Cannot apply parameter decorators to constructors and retrieve the name of the parameter.
    // See: https://github.com/microsoft/TypeScript/issues/15904
    test.skip('Decorating a parameter adds that attribute to the metadata map under specified resource', () => {
        let Foo = class Foo {
            constructor(some_attribute) {
                this.some_attribute = some_attribute;
            }
            behaveCompiler() {
                return this.some_attribute;
            }
        };
        Foo = __decorate([
            __param(0, authorizer_treat_as_directive_2.AuthorizerTreatAs(types_1.Resource.Division)),
            __metadata("design:paramtypes", [String])
        ], Foo);
        const foo = new Foo('bar');
        const retrievedMetadata = Reflect.getMetadata(authorizer_treat_as_directive_1.AuthResourceSymbol, foo);
        expect(retrievedMetadata).toBeTruthy();
        expect(retrievedMetadata.get(types_1.Resource.Division).has('some_attribute')).toBe(true);
    });
});
//# sourceMappingURL=decorator.unit.test.js.map