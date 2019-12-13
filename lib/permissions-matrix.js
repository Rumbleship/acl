"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const one_to_unique_many_map_1 = require("./utils/one-to-unique-many-map");
const oid_1 = require("@rumbleship/oid");
/**
 * Lookup table that maps OidScopes to the Authorizable Resource; critical because
 * both OidScopes:Buyer|Supplier are treated as the samee core Authorizable(Division)
 */
const ResourceAsScopesSingleton = new Map([
    [oid_1.Registry.Buyer.name, types_1.Resource.Division],
    [oid_1.Registry.Supplier.name, types_1.Resource.Division],
    [types_1.Resource.Division, types_1.Resource.Division],
    // Strictly speaking these last two collide; opting to include for clarity.
    [oid_1.Registry.User.name, types_1.Resource.User],
    [types_1.Resource.User, types_1.Resource.User]
]);
class ResourceActionsMap extends one_to_unique_many_map_1.OneToUniqueManyMap {
}
exports.ResourceActionsMap = ResourceActionsMap;
class Permissions extends Map {
    /**
     *
     * @param param0 an association of Role:Resource:Actions that should be allowed
     */
    allow({ role, at, to }) {
        const resource = ResourceAsScopesSingleton.get(at);
        const resourceActions = this.get(role) || new ResourceActionsMap();
        resourceActions.add(resource, to);
        this.set(role, resourceActions);
    }
    /**
     *
     * @param param0 an association of Role:Resource:Actions that will be queried
     */
    allows({ role, at, to }) {
        const resource = ResourceAsScopesSingleton.get(at);
        const allowedActionsPerResource = this.get(role);
        const actions = allowedActionsPerResource.get(resource);
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