/**
 * @param _init A Map() constructor shaped set of values that should be used to
 * seed the one:many map, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 */
export declare class OneToUniqueManyMap<K, V> extends Map<K, Set<V>> {
    protected readonly _init: Array<OneToUniqueManyMapConstructor<K, V>>;
    constructor(_init?: Array<OneToUniqueManyMapConstructor<K, V>>);
    add(one: K, v: V | V[]): void;
    get(k: K): Set<V>;
}
export interface OneToUniqueManyMapConstructor<K, V> extends Array<K | V[]> {
    0: K;
    1: V[];
}
