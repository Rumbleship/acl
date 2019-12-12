import 'reflect-metadata';
import { Resource, ResourceAttributeAsMapConstructor } from './types';
export function Required(): MethodDecorator {
  return (target: any, key: string | symbol, descriptor: any) => {
    const methodNameCallCount = Symbol.for(`${key.toString()}CallCount`);
    Object.defineProperty(target, methodNameCallCount, {
      value: 0,
      writable: true
    });
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      this[methodNameCallCount]++;
      return originalMethod.apply(this, args);
    };
  };
}

export function Requires(methodName: string | symbol): MethodDecorator {
  return (target: any, propertyName: string | symbol, descriptor: any) => {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const methodNameCalled = Symbol.for(`${methodName.toString()}CallCount`);
      const count = this[methodNameCalled];
      if (!count) {
        throw new Error(
          'Cannot query an unauthenticated Authorizer. Invoke `authenticate()` first.'
        );
      }
      return originalMethod.apply(this, args);
    };
  };
}

/**
 * @param _initializedWith Mapping of Resources to attributes represent them
 * Can be passed in two shapes, the latter is for backwards compatiblity and *deprecated*.
 *   1. Standard Map Constructor, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 *   2. Object shaped, {k1: v1, k2: v2};
 *        or specifically: {r1: [a1, a2], r2: [a3, a4]}
 * This parameter is transformed and used to set values on the {{this}} Map; it **should only be accessed** via standard Map methods; e.g. `.get()`, `.has()`
 */
export class AuthorizerTreatAsMap extends Map<Resource, Set<string>> {
  constructor(
    private readonly _initializedWith:
      | ResourceAttributeAsMapConstructor[]
      | { [key in Resource]?: string[] } = []
  ) {
    super();
    if (Array.isArray(this._initializedWith)) {
      for (const [k, v] of this._initializedWith) {
        this.add(k, v);
      }
    } else {
      // tslint:disable-next-line: no-console
      console.warn(
        'DEPRECATED: Initializing a map with object-format. Use standard new Map([[]]) syntax'
      );
      for (const resource in this._initializedWith) {
        // tslint:disable-next-line: forin
        this.add(resource as Resource, Reflect.get(this._initializedWith, resource));
      }
    }
  }
  add(k: Resource, v: string | string[]) {
    v = Array.isArray(v) ? v : [v];
    const listOfAttributes = this.get(k) || new Set<string>();
    for (const attr of v) {
      listOfAttributes.add(attr);
    }
    this.set(k, listOfAttributes);
  }
}

export const AuthResourceSymbol = Symbol('AuthResourceSymbol');
/**
 *
 * @param resource The resource that should be explicitly connected to the target
 *  property being decorated.
 */
export function AuthorizerTreatAs(resource: Resource): ParameterDecorator & PropertyDecorator {
  function propertyDecoratorImpl(target: object, propertyKey: string | symbol) {
    const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, target);
    const treatAsMap = retrieved || new AuthorizerTreatAsMap();
    treatAsMap.add(resource, propertyKey.toString());
    Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
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
  return (...args: PropertyDecoratorArgs) => {
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
//  declare type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
// declare type ParameterDecorator = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

// tslint:disable-next-line: ban-types
interface PropertyDecoratorArgs extends Array<Object | string | symbol> {
  // tslint:disable-next-line: ban-types
  0: Object;
  1: string | symbol;
}
// interface ParameterDecoratorArgs extends Array<Object | string | symbol | number> {
//   0: Object;
//   1: string | symbol;
//   2: number;
// }
/**
 *
 * @param authorizable Any potentially authorizable object
 * @returns AuthorizerTreatAsMap explicitly collating each Authorizable Resource to its list of ids.
 *  By default, this will contain each Authorizable, it's basic foreign-key attribute, and `id` for convenience of implementation, e.g. a single entry would look like:
 *    `...{User: new Set(['id', 'user_id'])}`
 *
 */
export function getAuthorizerTreatAs(authorizable: any): AuthorizerTreatAsMap {
  const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, authorizable);
  const treatAsMap = retrieved || new AuthorizerTreatAsMap();
  for (const resource of Object.keys(Resource)) {
    treatAsMap.add(resource as Resource, 'id');
    const key = `${resource.toLowerCase()}_id`;
    if (Reflect.has(authorizable, key)) {
      treatAsMap.add(resource as Resource, key);
    }
  }
  return treatAsMap;
}
