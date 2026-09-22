import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRoleCode } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import {
  MaintenanceGuard,
  invalidateMaintenanceCache,
} from './maintenance.guard';

describe('MaintenanceGuard', () => {
  let guard: MaintenanceGuard;
  let prisma: any;
  let configService: any;
  const JWT_SECRET = 'test-jwt-secret';

  beforeEach(() => {
    invalidateMaintenanceCache();

    prisma = {
      systemMaintenance: {
        findFirst: jest.fn(),
      },
      userRole: {
        findFirst: jest.fn(),
      },
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return JWT_SECRET;
        if (key === 'SUPER_ADMIN_EMAIL') return 'admin@system.com';
        return null;
      }),
    };

    guard = new MaintenanceGuard(prisma, configService);
  });

  const mockContext = (
    url: string,
    method = 'GET',
    authHeader?: string,
    body?: any,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          url,
          originalUrl: url,
          method,
          headers: authHeader ? { authorization: authHeader } : {},
          body: body || {},
        }),
      }),
    }) as any;

  it('allows access to whitelisted health check routes regardless of maintenance state', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'System upgrade in progress',
      endTime: null,
    });

    const context = mockContext('/health');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('allows access when maintenance is disabled in database', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: false,
    });

    const context = mockContext('/v1/services');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('blocks regular users with 503 ServiceUnavailableException when maintenance is active', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'Database migration under maintenance',
      endTime: null,
    });

    const context = mockContext('/v1/services');

    await expect(guard.canActivate(context)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('blocks registration requests during maintenance mode', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'Maintenance in progress',
      endTime: null,
    });

    const context = mockContext('/v1/auth/register', 'POST', undefined, {
      email: 'newuser@example.com',
      password: 'Password123!',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('blocks regular user login attempts during maintenance mode', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'Maintenance in progress',
      endTime: null,
    });
    prisma.userRole.findFirst.mockResolvedValue(null); // Not a SUPER_ADMIN

    const context = mockContext('/v1/auth/login', 'POST', undefined, {
      email: 'regular.student@gmail.com',
      password: 'Password123!',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('blocks enterprise admin/user login attempts during maintenance mode', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'Maintenance in progress',
      endTime: null,
    });
    // Enterprise admin does NOT have SUPER_ADMIN role
    prisma.userRole.findFirst.mockResolvedValue(null);

    const context = mockContext('/v1/auth/login', 'POST', undefined, {
      email: 'enterprise.admin@company.com',
      password: 'Password123!',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('allows system admin (SUPER_ADMIN) login attempt during maintenance mode', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'Maintenance in progress',
      endTime: null,
    });
    prisma.userRole.findFirst.mockResolvedValue({
      id: 'ur-superadmin',
      role: { code: UserRoleCode.SUPER_ADMIN },
    });

    const context = mockContext('/v1/auth/login', 'POST', undefined, {
      email: 'system.superadmin@platform.com',
      password: 'AdminPassword123!',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('allows super admin users through during maintenance if valid SUPER_ADMIN JWT is provided', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'Emergency maintenance',
      endTime: null,
    });

    const token = jwt.sign(
      { sub: 'super-admin-1', roles: [UserRoleCode.SUPER_ADMIN] },
      JWT_SECRET,
    );

    const context = mockContext(
      '/v1/admin/services',
      'GET',
      `Bearer ${token}`,
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('blocks logged-in enterprise users during maintenance if their JWT does not have SUPER_ADMIN', async () => {
    prisma.systemMaintenance.findFirst.mockResolvedValue({
      isUnderMaintenance: true,
      message: 'Emergency maintenance',
      endTime: null,
    });

    const token = jwt.sign(
      { sub: 'enterprise-user-1', roles: [UserRoleCode.ENTERPRISE] },
      JWT_SECRET,
    );

    const context = mockContext('/v1/services', 'GET', `Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
