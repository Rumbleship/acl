import 'reflect-metadata';

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
