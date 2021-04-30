import 'reflect-metadata';
import { Resource } from './types';
import { OneToUniqueManyMap } from './utils/one-to-unique-many-map';
export const AuthResourceSymbol = Symbol('AuthResourceSymbol');
export class AuthorizerTreatAsMap extends OneToUniqueManyMap<Resource, string> {}
/**
 *
 * @param authorizable Any potentially authorizable object
 * @returns AuthorizerTreatAsMap explicitly collating each Authorizable Resource to its list of ids.
 *  By default, this will contain each Authorizable, it's basic foreign-key attribute, and `id` for convenience of implementation, e.g. a single entry would look like:
 *    `...{User: new Set(['id', 'user_id'])}`
 *
 */
export function getAuthorizerTreatAs(
  authorizable: any,
  apply_inflected_defaults = true
): AuthorizerTreatAsMap {
  const retrieved: AuthorizerTreatAsMap =
    Reflect.getMetadata(AuthResourceSymbol, authorizable) ?? new AuthorizerTreatAsMap();
  const cloned_map = new AuthorizerTreatAsMap();
  // Add the original values to cloned map
  for (const [k, v] of retrieved.entries()) {
    cloned_map.add(k, Array.from(v));
  }
  if (apply_inflected_defaults) {
    for (const resource of Object.keys(Resource)) {
      cloned_map.add(resource as Resource, 'id');
      const key = `${resource.toLowerCase()}_id`;
      if (Reflect.has(authorizable as Record<string, unknown>, key)) {
        cloned_map.add(resource as Resource, key);
      }
    }
  }
  return cloned_map;
}

/**
 *
 * @param singleOrListOfResources The resource that should be explicitly connected to the target
 *  property being decorated.
 */
export function AuthorizerTreatAs(
  singleOrListOfResources: Resource | Resource[]
): ParameterDecorator & PropertyDecorator {
  function propertyDecoratorImpl(target: unknown, propertyKey: string | symbol) {
    const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, target as any);
    const treatAsMap = retrieved || new AuthorizerTreatAsMap();
    if (!Array.isArray(singleOrListOfResources)) {
      singleOrListOfResources = [singleOrListOfResources];
    }
    for (const resource of singleOrListOfResources) {
      treatAsMap.add(resource, propertyKey.toString());
    }
    Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target as any);
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
    propertyDecoratorImpl(args[0] as unknown, args[1]);
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

// eslint-disable-next-line @typescript-eslint/ban-types
interface PropertyDecoratorArgs extends Array<Object | string | symbol> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  0: Object;
  1: string | symbol;
}
// interface ParameterDecoratorArgs extends Array<Object | string | symbol | number> {
//   0: Object;
//   1: string | symbol;
//   2: number;
// }
