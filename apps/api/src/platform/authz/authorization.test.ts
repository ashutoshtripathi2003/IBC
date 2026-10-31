import { describe, expect, it } from 'vitest';
import { hasPermission, Permissions, permissionsFor, Roles } from './authorization.js';

const principal = (roles: string[]) => ({ userId: 'u', sessionId: 's', roles });

describe('authorization', () => {
  it('grants members only self-service permissions', () => {
    const member = principal([Roles.Member]);
    expect(hasPermission(member, Permissions.SelfRead)).toBe(true);
    expect(hasPermission(member, Permissions.SelfSessionsManage)).toBe(true);
    expect(hasPermission(member, Permissions.UsersReadAny)).toBe(false);
    expect(hasPermission(member, Permissions.AuditRead)).toBe(false);
  });

  it('grants platform admins administrative permissions', () => {
    const admin = principal([Roles.PlatformAdmin]);
    expect(hasPermission(admin, Permissions.UsersSuspend)).toBe(true);
    expect(hasPermission(admin, Permissions.SelfRead)).toBe(true);
  });

  it('denies by default for unknown or missing roles', () => {
    expect(permissionsFor(['superuser', 'root']).size).toBe(0);
    expect(hasPermission(principal([]), Permissions.SelfRead)).toBe(false);
  });
});
