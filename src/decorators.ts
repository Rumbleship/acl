import 'reflect-metadata';
import { Resource } from './types';
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
const AuthResourceSymbol = Symbol('AuthResourceSymbol');
export type AuthorizerTreatAsMap = Map<string, Set<Resource>>;
/**
 *
 * @param resource: Resource Decorate the target property with metadata stored
 * under`TreatAsSymbol` to be used by invokers of `authorizer.can()`
 */
export function AuthorizerTreatAs(resource: Resource): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const retrieved = Reflect.getMetadata(AuthResourceSymbol, target);
    const treatAsMap = retrieved || new Map<string, Set<Resource>>();
    const entry = treatAsMap.get(propertyKey) || new Set<Resource>();
    entry.add(resource);
    treatAsMap.set(propertyKey, entry);
    Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
  };
}

export function getAuthorizerTreatAs(target: any): AuthorizerTreatAsMap {
  const retrieved = Reflect.getMetadata(AuthResourceSymbol, target);
  return retrieved || (new Map<string, Set<Resource>>() as AuthorizerTreatAsMap);
}
