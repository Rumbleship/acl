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
    APPROVE = "approve",
    QUERY = "query"
}
export declare enum Resource {
    Division = "Division",
    User = "User",
    Order = "Order"
}
export declare type PermissionsGroup = {
    [key in Resource]?: Actions[];
};
export declare type PermissionsMatrix = {
    [key in Roles]?: PermissionsGroup;
};
export declare type RolesAt = {
    [key in Roles]?: string[];
};
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
