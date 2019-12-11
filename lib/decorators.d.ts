import 'reflect-metadata';
import { Resource } from './types';
export declare function Required(): MethodDecorator;
export declare function Requires(methodName: string | symbol): MethodDecorator;
export declare type AuthorizerTreatAsMap = Map<string, Set<Resource>>;
/**
 *
 * @param resource: Resource Decorate the target property with metadata stored
 * under`TreatAsSymbol` to be used by invokers of `authorizer.can()`
 */
export declare function AuthorizerTreatAs(resource: Resource): PropertyDecorator;
export declare function getAuthorizerTreatAs(target: any): AuthorizerTreatAsMap;
