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
export class AuthorizerTreatAsMap<K = string, V = Resource> extends Map<K, V> {}
/**
 *
 * @param resource: Resource Decorate the target property with metadata stored
 * under`TreatAsSymbol` to be used by invokers of `authorizer.can()`
 */
export function AuthorizerTreatAs(resource: Resource): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, target);
    const treatAsMap: AuthorizerTreatAsMap = retrieved || new Map<string, Resource>();
    treatAsMap.set(propertyKey.toString(), resource);
    Reflect.defineMetadata(AuthResourceSymbol, treatAsMap, target);
  };
}

export interface getAuthorizerTreatAsOptions {
  inflect_against: string;
}

export function getAuthorizerTreatAs(
  target: any,
  options: getAuthorizerTreatAsOptions = { inflect_against: '_id' }
): AuthorizerTreatAsMap {
  const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, target);
  return retrieved || new AuthorizerTreatAsMap();
}
