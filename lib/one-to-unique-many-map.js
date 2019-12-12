"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @param _initializedWith A Map() constructor shaped set of values that should be used to
 * seed the one:many map, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 */
class OneToUniqueManyMap extends Map {
    constructor(_initializedWith = []) {
        super();
        this._initializedWith = _initializedWith;
        for (const [k, v] of this._initializedWith) {
            this.add(k, v);
        }
    }
    add(one, v) {
        v = Array.isArray(v) ? v : [v];
        const many = this.get(one) || new Set();
        for (const entry of v) {
            many.add(entry);
        }
        this.set(one, many);
    }
}
exports.OneToUniqueManyMap = OneToUniqueManyMap;
//# sourceMappingURL=one-to-unique-many-map.js.map