import { ClaimsInput } from './types';
export declare enum PermissionSource {
    MATRIX = "matrix",
    DECORATOR = "decorator"
}
export declare enum Roles {
    ADMIN = "admin",
    USER = "user",
    PENDING = "pending"
}
export declare enum Actions {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    REQUEST = "request",
    APPROVE = "approve"
}
export declare enum Resource {
    Division = "Division",
    User = "User",
    Order = "Order"
}
export interface PermissionsGroup {
    PermissionedObjects?: Actions[];
}
export interface PermissionsMatrix {
    [Roles.ADMIN]: PermissionsGroup & {
        [key: string]: any[];
    };
    [Roles.USER]: PermissionsGroup & {
        [key: string]: any[];
    };
    [Roles.PENDING]: PermissionsGroup & {
        [key: string]: any[];
    };
}
export interface RolesAt {
    [key: string]: any[];
    [Roles.ADMIN]: string[];
    [Roles.USER]: string[];
    [Roles.PENDING]: string[];
}
export interface ClaimsInput {
    name?: string;
    user?: string;
    client?: string;
    roles: RolesAt;
}
export interface Claims extends ClaimsInput {
    exp: Date;
    iat: Date;
}
export interface IAllowedQuery {
    to: Actions;
    from?: Resource;
    match?: string;
    against: object;
}
