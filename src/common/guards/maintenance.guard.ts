import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRoleCode } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'prisma/prisma.service';

export let maintenanceCache: {
  isUnderMaintenance: boolean;
  message: string;
  endTime: Date | null;
  lastChecked: number;
} | null = null;

export function invalidateMaintenanceCache() {
  maintenanceCache = null;
}

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url: string = request.originalUrl || request.url || '';
    const method: string = request.method;

    // 1. Whitelist essential operational routes (health checks, API documentation, maintenance settings)
    // Note: Registration and regular logins are NOT whitelisted during maintenance.
    if (
      url.includes('/health') ||
      url === '/' ||
      url.includes('/docs') ||
      url.includes('/settings/maintenance') ||
      url.includes('/admin/settings/maintenance')
    ) {
      return true;
    }

    // 2. Fetch or retrieve cached maintenance state (cached for max 3 seconds)
    const now = Date.now();
    if (!maintenanceCache || now - maintenanceCache.lastChecked > 3000) {
      try {
        const record = await this.prisma.systemMaintenance.findFirst();
        maintenanceCache = {
          isUnderMaintenance: record?.isUnderMaintenance ?? false,
          message:
            record?.message ||
            'The platform is currently undergoing scheduled maintenance. Please check back soon.',
          endTime: record?.endTime ?? null,
          lastChecked: now,
        };
      } catch {
        return true;
      }
    }

    if (!maintenanceCache.isUnderMaintenance) {
      return true;
    }

    // Check if auto-disable time has passed
    if (
      maintenanceCache.endTime &&
      new Date() >= new Date(maintenanceCache.endTime)
    ) {
      maintenanceCache = null;
      return true;
    }

    // 3. During maintenance, allow ONLY System Administrators (SUPER_ADMIN) to attempt login.
    // Regular users, enterprise owners, and enterprise team admins are strictly blocked.
    if (url.includes('/auth/login') && method === 'POST') {
      const email = request.body?.email
        ? String(request.body.email).trim().toLowerCase()
        : null;

      if (email) {
        const superAdminEmail = (
          this.configService.get<string>('SUPER_ADMIN_EMAIL') || ''
        )
          .trim()
          .toLowerCase();

        const isSuperAdminByEmail =
          superAdminEmail && email === superAdminEmail;

        const isSuperAdminInDb = await this.prisma.userRole.findFirst({
          where: {
            user: { email },
            role: { code: UserRoleCode.SUPER_ADMIN },
            isActive: true,
          },
        });

        if (isSuperAdminByEmail || isSuperAdminInDb) {
          return true;
        }
      }

      // Any non-super-admin attempting to log in during maintenance is blocked
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message:
          maintenanceCache.message ||
          'The platform is currently undergoing scheduled maintenance. Only system administrators can log in at this time.',
        data: {
          isUnderMaintenance: true,
          message: maintenanceCache.message,
          endTime: maintenanceCache.endTime,
        },
      });
    }

    // 4. Maintenance is active. Check if caller has an active JWT belonging to SYSTEM ADMIN (SUPER_ADMIN).
    // Enterprise admins (teamRole: ADMIN) and Enterprise users (role: ENTERPRISE) are NOT system admins and must be blocked.
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        if (secret) {
          const decoded = jwt.verify(token, secret) as any;
          if (
            decoded &&
            Array.isArray(decoded.roles) &&
            decoded.roles.includes(UserRoleCode.SUPER_ADMIN)
          ) {
            return true;
          }
        }
      } catch {
        // Invalid or expired token; proceed to block
      }
    }

    // 5. Deny access for all other incoming requests with 503 Service Unavailable
    throw new ServiceUnavailableException({
      statusCode: 503,
      error: 'Service Unavailable',
      message: maintenanceCache.message,
      data: {
        isUnderMaintenance: true,
        message: maintenanceCache.message,
        endTime: maintenanceCache.endTime,
      },
    });
  }
}
