"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Required() {
    return (target, key, descriptor) => {
        const methodNameCallCount = Symbol.for(`${key.toString()}CallCount`);
        Object.defineProperty(target, methodNameCallCount, {
            value: 0,
            writable: true
        });
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            this[methodNameCallCount]++;
            return originalMethod.apply(this, args);
        };
    };
}
exports.Required = Required;
function Requires(methodName) {
    return (target, propertyName, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const methodNameCalled = Symbol.for(`${methodName.toString()}CallCount`);
            const count = this[methodNameCalled];
            if (!count) {
                throw new Error('Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.');
            }
            return originalMethod.apply(this, args);
        };
    };
}
exports.Requires = Requires;
function AuthorizedAttribute(attribute) {
    return (target, propertyName, descriptor) => {
        const originalMethod = descriptor.value;
        Reflect.set(target, Symbol.for(`${propertyName.toString()}AuthorizedAttribute`), attribute);
        descriptor.value = function (...args) {
            return originalMethod.apply(this, args);
        };
    };
}
exports.AuthorizedAttribute = AuthorizedAttribute;
function AuthorizedResource(resource) {
    return (target, propertyName, descriptor) => {
        const originalMethod = descriptor.value;
        Reflect.set(target, Symbol.for(`${propertyName.toString()}AuthorizedResource`), resource);
        descriptor.value = function (...args) {
            return originalMethod.apply(this, args);
        };
    };
}
exports.AuthorizedResource = AuthorizedResource;
// Not using this yet.
// export function ActionType(action: Actions): MethodDecorator {
//   return (target: any, propertyName: string | symbol) => {
//     Reflect.set(target, propertyName, action);
//   };
// }
//# sourceMappingURL=decorators.js.map