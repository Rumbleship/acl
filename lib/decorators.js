"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const types_1 = require("./types");
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
/**
 * @param _initializedWith Mapping of Resources to attributes represent them
 * Can be passed in two shapes, the latter is for backwards compatiblity and *deprecated*.
 *   1. Standard Map Constructor, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 *   2. Object shaped, {k1: v1, k2: v2};
 *        or specifically: {r1: [a1, a2], r2: [a3, a4]}
 */
class AuthorizerTreatAsMap extends Map {
    constructor(_initializedWith = []) {
        super();
        this._initializedWith = _initializedWith;
        if (Array.isArray(this._initializedWith)) {
            for (const [k, v] of this._initializedWith) {
                this.add(k, v);
            }
        }
        else {
            for (const resource in this._initializedWith) {
                // tslint:disable-next-line: forin
                this.add(resource, Reflect.get(this._initializedWith, resource));
            }
        }
    }
    add(k, v) {
        v = Array.isArray(v) ? v : [v];
        const listOfAttributes = this.get(k) || new Set();
        for (const attr of v) {
            listOfAttributes.add(attr);
        }
        this.set(k, listOfAttributes);
    }
}
exports.AuthorizerTreatAsMap = AuthorizerTreatAsMap;
const AuthResourceSymbol = Symbol('AuthResourceSymbol');
/**
 *
 * @param resource The resource that should be explicitly connected to the target
 *  property being decorated.
 */
function AuthorizerTreatAs(resource) {
    return (target, propertyKey) => {
        const retrieved = Reflect.getMetadata(AuthResourceSymbol, target);
        const treatAsMap = retrieved || new AuthorizerTreatAsMap();
        treatAsMap.add(resource, propertyKey.toString());
        Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
    };
}
exports.AuthorizerTreatAs = AuthorizerTreatAs;
/**
 *
 * @param authorizable Any potentially authorizable object
 * @returns AuthorizerTreatAsMap explicitly collating each Authorizable Resource to its list of ids.
 *  By default, this will contain each Authorizable, it's basic foreign-key attribute, and `id` for convenience of implementation, e.g. a single entry would look like:
 *    `...{User: new Set(['id', 'user_id'])}`
 *
 */
function getAuthorizerTreatAs(authorizable) {
    const retrieved = Reflect.getMetadata(AuthResourceSymbol, authorizable);
    const treatAsMap = retrieved || new AuthorizerTreatAsMap();
    for (const resource of Object.keys(types_1.Resource)) {
        treatAsMap.add(resource, 'id');
        const key = `${resource.toLowerCase()}_id`;
        if (Reflect.has(authorizable, key)) {
            treatAsMap.add(resource, key);
        }
    }
    return treatAsMap;
}
exports.getAuthorizerTreatAs = getAuthorizerTreatAs;
//# sourceMappingURL=decorators.js.map