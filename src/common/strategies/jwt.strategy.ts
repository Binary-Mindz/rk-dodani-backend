import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { CurrentUserData } from 'common/interfaces/current-user.interface';
import { JwtPayload } from 'common/interfaces/jwt-payload.interface';
import { PrismaService } from 'prisma/prisma.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PlanAudience, SubscriptionStatus, UserRoleCode } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserData> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        parentUserId: true,
        teamRole: true,
        roles: {
          where: { isActive: true },
          select: { role: { select: { code: true } } },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles: UserRoleCode[] = user.roles.map((item) => item.role.code);

    // If user is a member/admin on an enterprise team, verify if enterprise owner has active B2B plan
    if (user.parentUserId) {
      const activeParentSubscription = await this.prisma.subscription.findFirst(
        {
          where: {
            userId: user.parentUserId,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
            plan: {
              targetAudience: PlanAudience.B2B,
            },
          },
          select: { id: true },
        },
      );

      if (
        activeParentSubscription &&
        !roles.includes(UserRoleCode.ENTERPRISE)
      ) {
        roles.push(UserRoleCode.ENTERPRISE);
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
      roles,
      parentUserId: user.parentUserId,
      teamRole: user.teamRole,
      rootEnterpriseId: user.parentUserId || user.id,
    };
  }
}
