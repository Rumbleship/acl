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

const AuthResourceSymbol = Symbol('AuthResourceSymbol');
/**
 *
 * @param resource The resource that should be explicitly connected to the target
 *  property being decorated.
 */
export function AuthorizerTreatAs(resource: Resource): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, target);
    const treatAsMap = retrieved || new AuthorizerTreatAsMap();
    treatAsMap.add(resource, propertyKey.toString());
    Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
  };
}

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
