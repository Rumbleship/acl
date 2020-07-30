"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Requires = exports.Required = void 0;
require("reflect-metadata");
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
//# sourceMappingURL=required.decorator.js.map