"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizerTreatAs = exports.getAuthorizerTreatAs = exports.AuthorizerTreatAsMap = exports.AuthResourceSymbol = void 0;
require("reflect-metadata");
const types_1 = require("./types");
const one_to_unique_many_map_1 = require("./utils/one-to-unique-many-map");
exports.AuthResourceSymbol = Symbol('AuthResourceSymbol');
class AuthorizerTreatAsMap extends one_to_unique_many_map_1.OneToUniqueManyMap {
}
exports.AuthorizerTreatAsMap = AuthorizerTreatAsMap;
/**
 *
 * @param authorizable Any potentially authorizable object
 * @returns AuthorizerTreatAsMap explicitly collating each Authorizable Resource to its list of ids.
 *  By default, this will contain each Authorizable, it's basic foreign-key attribute, and `id` for convenience of implementation, e.g. a single entry would look like:
 *    `...{User: new Set(['id', 'user_id'])}`
 *
 */
function getAuthorizerTreatAs(authorizable, apply_inflected_defaults = true) {
    var _a;
    const retrieved = (_a = Reflect.getMetadata(exports.AuthResourceSymbol, authorizable)) !== null && _a !== void 0 ? _a : new AuthorizerTreatAsMap();
    const cloned_map = new AuthorizerTreatAsMap();
    // Add the original values to cloned map
    for (const [k, v] of retrieved.entries()) {
        cloned_map.add(k, Array.from(v));
    }
    if (apply_inflected_defaults) {
        for (const resource of Object.keys(types_1.Resource)) {
            cloned_map.add(resource, 'id');
            const key = `${resource.toLowerCase()}_id`;
            if (Reflect.has(authorizable, key)) {
                cloned_map.add(resource, key);
            }
        }
    }
    return cloned_map;
}
exports.getAuthorizerTreatAs = getAuthorizerTreatAs;
/**
 *
 * @param singleOrListOfResources The resource that should be explicitly connected to the target
 *  property being decorated.
 */
function AuthorizerTreatAs(singleOrListOfResources) {
    function propertyDecoratorImpl(target, propertyKey) {
        const retrieved = Reflect.getMetadata(exports.AuthResourceSymbol, target);
        const treatAsMap = retrieved || new AuthorizerTreatAsMap();
        if (!Array.isArray(singleOrListOfResources)) {
            singleOrListOfResources = [singleOrListOfResources];
        }
        for (const resource of singleOrListOfResources) {
            treatAsMap.add(resource, propertyKey.toString());
        }
        Reflect.defineMetadata(exports.AuthResourceSymbol, treatAsMap, target);
    }
    // Cannot apply parameter decorators to constructors and add metadata based on the property
    // see: https://github.com/microsoft/TypeScript/issues/15904
    // function parameterDecoratorImpl(
    //   target: object,
    //   propertyKey: string | symbol,
    //   _parameterIndex: number
    // ) {
    //   const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, target);
    //   const treatAsMap = retrieved || new AuthorizerTreatAsMap();
    //   treatAsMap.add(resource, propertyKey.toString());
    //   Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
    // }
    return (...args) => {
        propertyDecoratorImpl(args[0], args[1]);
        // args.length === 2
        //   ? propertyDecoratorImpl(args[0], args[1])
        //   : parameterDecoratorImpl(args[0], args[1], (args as ParameterDecoratorArgs)[2]);
    };
    // return (target: object, propertyKey: string | symbol) => {
    //   const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, target);
    //   const treatAsMap = retrieved || new AuthorizerTreatAsMap();
    //   treatAsMap.add(resource, propertyKey.toString());
    //   Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
    // };
}
exports.AuthorizerTreatAs = AuthorizerTreatAs;
// interface ParameterDecoratorArgs extends Array<Object | string | symbol | number> {
//   0: Object;
//   1: string | symbol;
//   2: number;
// }
//# sourceMappingURL=authorizer-treat-as.directive.js.map