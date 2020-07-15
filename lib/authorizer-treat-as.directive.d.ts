import 'reflect-metadata';
import { Resource } from './types';
import { OneToUniqueManyMap } from './utils/one-to-unique-many-map';
export declare const AuthResourceSymbol: unique symbol;
export declare class AuthorizerTreatAsMap extends OneToUniqueManyMap<Resource, string> {
}
/**
 *
 * @param authorizable Any potentially authorizable object
 * @returns AuthorizerTreatAsMap explicitly collating each Authorizable Resource to its list of ids.
 *  By default, this will contain each Authorizable, it's basic foreign-key attribute, and `id` for convenience of implementation, e.g. a single entry would look like:
 *    `...{User: new Set(['id', 'user_id'])}`
 *
 */
export declare function getAuthorizerTreatAs(authorizable: any, apply_inflected_defaults?: boolean): AuthorizerTreatAsMap;
/**
 *
 * @param singleOrListOfResources The resource that should be explicitly connected to the target
 *  property being decorated.
 */
export declare function AuthorizerTreatAs(singleOrListOfResources: Resource | Resource[]): ParameterDecorator & PropertyDecorator;
