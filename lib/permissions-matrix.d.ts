import { Resource, Actions, Roles } from './types';
import { OneToUniqueManyMap } from './utils/one-to-unique-many-map';
export declare class ResourceActionsMap extends OneToUniqueManyMap<Resource, Actions> {
}
export declare class Permissions extends Map<Roles, ResourceActionsMap> {
    /**
     *
     * @param param0 an association of Role:Resource:Actions that should be allowed
     */
    allow({ role, at, to }: AllowRoleAtTo): void;
    /**
     *
     * @param param0 an association of Role:Resource:Actions that will be queried
     */
    allows({ role, at, to }: AllowRoleAtTo): boolean;
    /**
     * @param role the role to query underlying map
     * @returns either the previously set ResourceActionsMap or a newly instantiated one for typesafety
     */
    get(role: Roles): ResourceActionsMap;
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
