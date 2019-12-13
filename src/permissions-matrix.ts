import { Resource, Actions, Roles } from './types';
import { OneToUniqueManyMap } from './utils/one-to-unique-many-map';
import { Registry } from '@rumbleship/oid';

/**
 * Lookup table that maps OidScopes to the Authorizable Resource; critical because
 * both OidScopes:Buyer|Supplier are treated as the samee core Authorizable(Division)
 */
const ResourceAsScopesSingleton = new Map<string | Resource, Resource>([
  [Registry.Buyer.name, Resource.Division],
  [Registry.Supplier.name, Resource.Division],
  [Resource.Division, Resource.Division],
  // Strictly speaking these last two collide; opting to include for clarity.
  [Registry.User.name, Resource.User],
  [Resource.User, Resource.User]
]);

export class ResourceActionsMap extends OneToUniqueManyMap<Resource, Actions> {}
export class Permissions extends Map<Roles, ResourceActionsMap> {
  /**
   *
   * @param param0 an association of Role:Resource:Actions that should be allowed
   */
  allow({ role, at, to }: AllowRoleAtTo): void {
    const resource = ResourceAsScopesSingleton.get(at) as Resource;
    const resourceActions = this.get(role) || new ResourceActionsMap();
    resourceActions.add(resource, to);
    this.set(role, resourceActions);
  }
  /**
   *
   * @param param0 an association of Role:Resource:Actions that will be queried
   */
  allows({ role, at, to }: AllowRoleAtTo): boolean {
    const resource = ResourceAsScopesSingleton.get(at) as Resource;
    const allowedActionsPerResource = this.get(role);
    const actions = allowedActionsPerResource.get(resource);
    let allowed = false;
    for (const action of new Set<Actions>(Array.isArray(to) ? to : [to])) {
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
  get(role: Roles): ResourceActionsMap {
    return super.get(role) || new ResourceActionsMap();
  }
}

/**
 * Role: The role to be applied to the Resource
 * Resource: The authorizable Resource to be considered
 * To: An action or list of actions that can JWTs representing {role} at {resource} can take
 *
 * @example
 *  `{ role: Roles.User, at: Resource.Division, to: [Actions.READ]}`
 *   means a User of a Division can READ
 */
export interface AllowRoleAtTo {
  role: Roles;
  at: Resource | string;
  to: Actions | Actions[];
}
