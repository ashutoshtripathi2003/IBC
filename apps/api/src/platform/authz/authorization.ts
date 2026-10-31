/**
 * Platform authorization (RBAC with room for attribute checks).
 *
 * Roles are stored per user (identity.user_roles); the role → permission mapping
 * lives in code so it is versioned, reviewed and tested with the application.
 * Resource-level rules (e.g. "only the owner may revoke this session") are
 * expressed as explicit checks next to the resource, combined with permissions.
 */
export const Permissions = {
  SelfRead: 'self:read',
  SelfUpdate: 'self:update',
  SelfSessionsManage: 'self:sessions:manage',
  UsersReadAny: 'users:read_any',
  UsersSuspend: 'users:suspend',
  AuditRead: 'audit:read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const Roles = {
  Member: 'member',
  PlatformAdmin: 'platform_admin',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

const MEMBER_PERMISSIONS: readonly Permission[] = [
  Permissions.SelfRead,
  Permissions.SelfUpdate,
  Permissions.SelfSessionsManage,
];

const ROLE_PERMISSIONS: Readonly<Record<string, readonly Permission[] | undefined>> = {
  [Roles.Member]: MEMBER_PERMISSIONS,
  [Roles.PlatformAdmin]: [
    ...MEMBER_PERMISSIONS,
    Permissions.UsersReadAny,
    Permissions.UsersSuspend,
    Permissions.AuditRead,
  ],
};

export interface Principal {
  userId: string;
  sessionId: string;
  roles: readonly string[];
}

export function permissionsFor(roles: readonly string[]): Set<Permission> {
  const result = new Set<Permission>();
  for (const role of roles) {
    // Unknown roles grant nothing (deny by default).
    for (const permission of ROLE_PERMISSIONS[role] ?? []) result.add(permission);
  }
  return result;
}

export function hasPermission(principal: Principal, permission: Permission): boolean {
  return permissionsFor(principal.roles).has(permission);
}
