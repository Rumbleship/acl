"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @param _init A Map() constructor shaped set of values that should be used to
 * seed the one:many map, e.g. `[[k1, v1], [k2, v2]]`;
 *        or specifically: [[r1, [a1,a2]], [r2, [a3, a4]]]
 */
class OneToUniqueManyMap extends Map {
    constructor(_init = []) {
        super();
        for (const [k, v] of _init) {
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
    get(k) {
        const retrieved = super.get(k);
        return retrieved || new Set();
    }
}
exports.OneToUniqueManyMap = OneToUniqueManyMap;
//# sourceMappingURL=one-to-unique-many-map.js.map