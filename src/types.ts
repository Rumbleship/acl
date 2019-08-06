import { RefreshClaims } from './types';
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
  PURCHASE = 'purchase',
  SHIP = 'ship',
  RETURN = 'return'
}
export enum Resource {
  Division = 'Division',
  User = 'User',
  Order = 'Order'
}

export enum Scopes {
  SYSADMIN = 'system:*',
  BANKINGADMIN = 'banking:*',
  ORDERADMIN = 'orders:*',
  DIVISIONADMIN = 'divisions:*'
}

export enum GrantTypes {
  REFRESH = 'refresh',
  ACCESS = 'access'
}

export type PermissionsGroup = {
  // Only Resources defined are valid to permission on,
  // but all are not required to be permissioned on.
  [key in Resource]?: Actions[];
};

export type PermissionsMatrix = {
  [key in Roles]?: PermissionsGroup;
};

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
