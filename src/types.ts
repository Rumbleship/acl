export enum Roles {
  ADMIN = 'admin',
  USER = 'user',
  PENDING = 'pending'
}

export enum Actions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query',
  // are Approve and Verify the same action, e.g. a limited update?
  APPROVE = 'approve',
  VERIFY = 'verify',
  REQUEST = 'request',
  // these values are uppercased to be compatible with keys to make it easier to access values without having to change the case --2019-08-06 @preeV42500
  PURCHASE = 'PURCHASE',
  SHIP = 'SHIP',
  RETURN = 'RETURN'
}
export enum Resource {
  Division = 'Division',
  User = 'User',
  Order = 'Order'
}

export enum Scopes {
  USER = 'user',
  API_KEY = 'api_key',
  SYSADMIN = 'system:*',
  BANKINGADMIN = 'banking:*',
  ORDERADMIN = 'orders:*',
  DIVISIONADMIN = 'divisions:*'
}

export enum GrantTypes {
  REFRESH = 'refresh',
  ACCESS = 'access'
}

// "I have role X at resources [A, B, C]"
export type RolesAt = {
  [key in Roles]?: string[]; // should be Oid[]
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
  exp: Date;
  iat: Date;
}

export interface ResourceAttributeAsMapConstructor extends Array<Resource | string[]> {
  0: Resource;
  1: string[];
}
