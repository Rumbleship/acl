/**
 * @param _init A Map() constructor shaped set of values that should be used to
 * seed the one:many map, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 */
export class OneToUniqueManyMap<K, V> extends Map<K, Set<V>> {
  protected readonly _init!: Array<OneToUniqueManyMapConstructor<K, V>>;
  constructor(_init: Array<OneToUniqueManyMapConstructor<K, V>> = []) {
    super();
    this._init = _init;
    for (const [k, v] of this._init) {
      this.add(k, v);
    }
  }
  add(one: K, v: V | V[]) {
    v = Array.isArray(v) ? v : [v];
    const many = this.get(one) || new Set<V>();
    for (const entry of v) {
      many.add(entry);
    }
    this.set(one, many);
  }

  get(k: K): Set<V> {
    const retrieved = super.get(k);
    return retrieved || new Set<V>();
  }
}

export interface OneToUniqueManyMapConstructor<K, V> extends Array<K | V[]> {
  0: K;
  1: V[];
}
