"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const one_to_unique_many_map_1 = require("./utils/one-to-unique-many-map");
class ResourceActionsMap extends one_to_unique_many_map_1.OneToUniqueManyMap {
}
exports.ResourceActionsMap = ResourceActionsMap;
class Permissions extends Map {
    /**
     *
     * @param param0 an association of Role:Resource:Actions that should be allowed
     */
    allow({ role, at, to }) {
        const resourceActions = this.get(role) || new ResourceActionsMap();
        resourceActions.add(at, to);
        this.set(role, resourceActions);
    }
    /**
     *
     * @param param0 an association of Role:Resource:Actions that will be queried
     */
    allows({ role, at, to }) {
        const allowedActionsPerResource = this.get(role);
        const actions = allowedActionsPerResource.get(at);
        let allowed = false;
        for (const action of new Set(Array.isArray(to) ? to : [to])) {
            if (actions.has(action)) {
                allowed = true;
                break;
            }
        }
        return allowed;
    }
    /**
     * @param role the role to query underlying map
     * @returns either the previously set ResourceActionsMap or a newly instantiated one for typesafety
     */
    get(role) {
        return super.get(role) || new ResourceActionsMap();
    }
}
exports.Permissions = Permissions;
//# sourceMappingURL=permissions-matrix.js.map