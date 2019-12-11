"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const AuthResourceSymbol = Symbol('AuthResourceSymbol');
/**
 *
 * @param resource: Resource Decorate the target property with metadata stored
 * under`TreatAsSymbol` to be used by invokers of `authorizer.can()`
 */
function AuthorizerTreatAs(resource) {
    return (target, propertyKey) => {
        const retrieved = Reflect.getMetadata(AuthResourceSymbol, target);
        const treatAsMap = retrieved || new Map();
        const entry = treatAsMap.get(propertyKey) || new Set();
        entry.add(resource);
        treatAsMap.set(propertyKey, entry);
        Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
    };
}
exports.AuthorizerTreatAs = AuthorizerTreatAs;
function getAuthorizerTreatAs(target) {
    const retrieved = Reflect.getMetadata(AuthResourceSymbol, target);
    return retrieved || new Map();
}
exports.getAuthorizerTreatAs = getAuthorizerTreatAs;
//# sourceMappingURL=decorators.js.map