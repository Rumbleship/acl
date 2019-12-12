/**
 * @param _initializedWith A Map() constructor shaped set of values that should be used to
 * seed the one:many map, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 */
export declare class OneToUniqueManyMap<K, V> extends Map<K, Set<V>> {
    protected readonly _initializedWith: Array<OneToUniqueManyMapConstructor<K, V>>;
    constructor(_initializedWith?: Array<OneToUniqueManyMapConstructor<K, V>>);
    add(one: K, v: V | V[]): void;
}
export interface OneToUniqueManyMapConstructor<K, V> extends Array<K | V[]> {
    0: K;
    1: V[];
}
