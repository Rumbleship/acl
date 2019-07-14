export declare enum Roles {
    ADMIN = "admin",
    USER = "user",
    PENDING = "pending"
}
export declare enum GQLOperation {
    CREATE = "create",
    DELETE = "delete",
    EXECUTE = "execute",
    QUERY = "query",
    UPDATE = "update"
}
export declare enum Actions {
    CREATE = "create",
    EXECUTE = "execute",
    DELETE = "delete",
    UPDATE = "update",
    APPROVE = "approve",
    VERIFY = "verify",
    REQUEST = "request",
    QUERY = "query",
    MUTATION = "mutation"
}
export declare enum Resource {
    Division = "Division",
    User = "User",
    Order = "Order"
}
export declare enum Scopes {
    SYSADMIN = "system:*",
    BANKINGADMIN = "banking:*",
    ORDERADMIN = "orders:*"
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
    scopes: Scopes[];
}
export interface Claims extends ClaimsInput {
    exp: Date;
    iat: Date;
}
