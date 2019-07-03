import { ClaimsInput } from './types';
export enum PermissionSource {
  MATRIX = 'matrix',
  DECORATOR = 'decorator'
}
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
  REQUEST = 'request',
  APPROVE = 'approve'
}

export enum Resource {
  Division = 'Division',
  User = 'User',
  Order = 'Order'
}

export interface PermissionsGroup {
  PermissionedObjects?: Actions[];
}

export interface PermissionsMatrix {
  [Roles.ADMIN]: PermissionsGroup & { [key: string]: any[] };
  [Roles.USER]: PermissionsGroup & { [key: string]: any[] };
  [Roles.PENDING]: PermissionsGroup & { [key: string]: any[] };
}

// "I have role X at resources [A, B, C]"
export interface RolesAt {
  [key: string]: any[];
  [Roles.ADMIN]: string[]; // should be Oid[]
  [Roles.USER]: string[]; // should be Oid[]
  [Roles.PENDING]: string[]; // should be Oid[]
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

// tslint:disable-next-line: interface-name
export interface IAllowedQuery {
  to: Actions;
  from?: Resource;
  match?: string;
  against: object;
}

// const Permissions = {
//   [PENDING]: {
//     User: ['read']
//   },
//   [USER]: {
//     Division: ['read', 'update'],
//     Order: ['read', 'create']
//   },
//   [ADMIN]: {
//     Division: ['read', 'create', 'update'],
//     Order: ['read', 'create', 'update'],
//     User: ['read', 'create', 'update']
//   }
// };
