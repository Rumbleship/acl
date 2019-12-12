import 'reflect-metadata';
import { Resource, ResourceAttributeAsMapConstructor } from './types';
export declare function Required(): MethodDecorator;
export declare function Requires(methodName: string | symbol): MethodDecorator;
/**
 * @param _initializedWith Mapping of Resources to attributes represent them
 * Can be passed in two shapes, the latter is for backwards compatiblity and *deprecated*.
 *   1. Standard Map Constructor, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 *   2. Object shaped, {k1: v1, k2: v2};
 *        or specifically: {r1: [a1, a2], r2: [a3, a4]}
 */
export declare class AuthorizerTreatAsMap extends Map<Resource, Set<string>> {
    private readonly _initializedWith;
    constructor(_initializedWith?: ResourceAttributeAsMapConstructor[] | {
        [key in Resource]?: string[];
    });
    add(k: Resource, v: string | string[]): void;
}
/**
 *
 * @param resource The resource that should be explicitly connected to the target
 *  property being decorated.
 */
export declare function AuthorizerTreatAs(resource: Resource): PropertyDecorator;
/**
 *
 * @param authorizable Any potentially authorizable object
 * @returns AuthorizerTreatAsMap explicitly collating each Authorizable Resource to its list of ids.
 *  By default, this will contain each Authorizable, it's basic foreign-key attribute, and `id` for convenience of implementation, e.g. a single entry would look like:
 *    `...{User: new Set(['id', 'user_id'])}`
 *
 */
export declare function getAuthorizerTreatAs(authorizable: any): AuthorizerTreatAsMap;
