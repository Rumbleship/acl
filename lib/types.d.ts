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
    QUERY = "query",
    APPROVE = "approve",
    VERIFY = "verify",
    REQUEST = "request",
    PURCHASE = "PURCHASE",
    SHIP = "SHIP",
    RETURN = "RETURN"
}
export declare enum Resource {
    Division = "Division",
    User = "User",
    Order = "Order"
}
export declare enum Scopes {
    USER = "user",
    API_KEY = "api_key",
    SYSADMIN = "system:*",
    BANKINGADMIN = "banking:*",
    ORDERADMIN = "orders:*",
    DIVISIONADMIN = "divisions:*"
}
export declare enum GrantTypes {
    REFRESH = "refresh",
    ACCESS = "access"
}
export declare type RolesAt = {
    [key in Roles]?: string[];
};
export interface AccessClaims {
    name?: string;
    user?: string;
    client?: string;
    roles: RolesAt;
    scopes: Scopes[];
}
export interface RefreshClaims {
    owner: string;
    grant_type: GrantTypes;
}
export interface Claims extends AccessClaims, RefreshClaims {
    exp: number;
    iat: number;
}
export interface ResourceAttributeAsMapConstructor extends Array<Resource | string[]> {
    0: Resource;
    1: string[];
}
