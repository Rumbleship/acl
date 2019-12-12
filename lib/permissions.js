"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const one_to_unique_many_map_1 = require("./one-to-unique-many-map");
class ResourceActionsMap extends one_to_unique_many_map_1.OneToUniqueManyMap {
}
exports.ResourceActionsMap = ResourceActionsMap;
class Permissions extends Map {
    /**
     *
     * @param param0 an association of Role:Resource:Actions that should be allowed
     */
    allow({ role, at, to }) {
        const resourceActions = new ResourceActionsMap();
        resourceActions.add(at, to);
        this.set(role, resourceActions);
    }
    /**
     *
     * @param param0 an association of Role:Resource:Actions that will be queried
     */
    allows({ role, at, to }) {
        const allowedActionsPerResource = this.get(role) || new ResourceActionsMap();
        const actions = allowedActionsPerResource.get(at) || new Set();
        let allowed = false;
        for (const action of new Set(Array.isArray(to) ? to : [to])) {
            if (actions.has(action)) {
                allowed = true;
                break;
            }
        }
        return allowed;
    }
}
exports.Permissions = Permissions;
//# sourceMappingURL=permissions.js.map