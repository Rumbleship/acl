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

export function AuthorizedAttribute(attribute: string | string[]): MethodDecorator {
  return (target: any, propertyName: string | symbol, descriptor: any) => {
    const originalMethod = descriptor.value;
    Reflect.set(target, Symbol.for(`${propertyName.toString()}AuthorizedAttribute`), attribute);
    descriptor.value = function(...args: any[]) {
      return originalMethod.apply(this, args);
    };
  };
}
export function AuthorizedResource(resource: string): MethodDecorator {
  return (target: any, propertyName: string | symbol, descriptor: any) => {
    const originalMethod = descriptor.value;
    Reflect.set(target, Symbol.for(`${propertyName.toString()}AuthorizedResource`), resource);
    descriptor.value = function(...args: any[]) {
      return originalMethod.apply(this, args);
    };
  };
}

// Not using this yet.
// export function ActionType(action: Actions): MethodDecorator {
//   return (target: any, propertyName: string | symbol) => {
//     Reflect.set(target, propertyName, action);
//   };
// }
