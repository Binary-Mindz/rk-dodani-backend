import { Test, TestingModule } from '@nestjs/testing';
import {
  PlanAudience,
  SubscriptionStatus,
  TeamRole,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtStrategy } from 'common/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('UsersService & JwtStrategy - B2B Team Context Specs', () => {
  let usersService: UsersService;
  let jwtStrategy: JwtStrategy;
  let prisma: any;
  let auditService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      subscription: {
        findFirst: jest.fn(),
      },
    };

    auditService = {
      logCustom: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret-12345'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('UsersService.getProfile Team Context', () => {
    it('returns enterprise association, teamRole, and inherited plan coverage for team member (Maxwell)', async () => {
      const maxwellUser = {
        id: 'user-maxwell',
        email: 'maxwell@enterprise.com',
        emailVerified: true,
        firstName: 'Maxwell',
        lastName: 'Edison',
        fullName: 'Maxwell Edison',
        avatarUrl: null,
        phone: null,
        status: UserStatus.ACTIVE,
        parentUserId: 'owner-sarah',
        teamRole: TeamRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [{ role: { code: UserRoleCode.STUDENT } }],
        subscriptions: [], // Maxwell has no direct subscription
        parentUser: {
          id: 'owner-sarah',
          email: 'sarah@enterprise.com',
          firstName: 'Sarah',
          lastName: 'Director',
          fullName: 'Sarah Director',
          subscriptions: [
            {
              id: 'sub-sarah-b2b',
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
              cancelAtPeriodEnd: false,
              provider: 'MANUAL',
              seats: 250,
              plan: {
                id: 'plan-b2b-250',
                code: 'ENTERPRISE_250',
                name: 'Enterprise 250 Seats',
                title: 'Enterprise Plan',
                targetAudience: PlanAudience.B2B,
                billingInterval: 'YEARLY',
                currency: 'USD',
                priceAmount: 25000,
              },
            },
          ],
        },
      };

      prisma.user.findUnique.mockResolvedValue(maxwellUser);

      const profile = await usersService.getProfile('user-maxwell');

      expect(profile).toBeDefined();
      expect(profile.onATeam).toBe(true);
      expect(profile.teamRole).toBe(TeamRole.MEMBER);
      expect(profile.roles).toContain(UserRoleCode.ENTERPRISE);

      // Verify teamContext
      expect(profile.teamContext).toEqual({
        isTeamMember: true,
        isTeamOwner: false,
        teamRole: TeamRole.MEMBER,
        enterpriseAccount: {
          ownerId: 'owner-sarah',
          ownerName: 'Sarah Director',
          ownerEmail: 'sarah@enterprise.com',
          planName: 'Enterprise 250 Seats',
          planTitle: 'Enterprise Plan',
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          seatsAllocated: 250,
        },
      });

      // Verify purchaseInfo reflects inherited enterprise coverage
      expect(profile.purchaseInfo).toBeDefined();
      expect(profile.purchaseInfo?.isEnterpriseCovered).toBe(true);
      expect(profile.purchaseInfo?.plan.name).toBe('Enterprise 250 Seats');
    });

    it('returns isTeamOwner: true and teamRole: OWNER for enterprise account owner (Sarah)', async () => {
      const sarahUser = {
        id: 'owner-sarah',
        email: 'sarah@enterprise.com',
        emailVerified: true,
        firstName: 'Sarah',
        lastName: 'Director',
        fullName: 'Sarah Director',
        avatarUrl: null,
        phone: null,
        status: UserStatus.ACTIVE,
        parentUserId: null,
        teamRole: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [{ role: { code: UserRoleCode.ENTERPRISE } }],
        subscriptions: [
          {
            id: 'sub-sarah-b2b',
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
            cancelAtPeriodEnd: false,
            provider: 'MANUAL',
            seats: 250,
            plan: {
              id: 'plan-b2b-250',
              code: 'ENTERPRISE_250',
              name: 'Enterprise 250 Seats',
              title: 'Enterprise Plan',
              targetAudience: PlanAudience.B2B,
              billingInterval: 'YEARLY',
              currency: 'USD',
              priceAmount: 25000,
            },
          },
        ],
        parentUser: null,
      };

      prisma.user.findUnique.mockResolvedValue(sarahUser);

      const profile = await usersService.getProfile('owner-sarah');

      expect(profile.onATeam).toBe(false);
      expect(profile.teamRole).toBe(TeamRole.OWNER);
      expect(profile.teamContext.isTeamOwner).toBe(true);
      expect(profile.teamContext.isTeamMember).toBe(false);
      expect(profile.teamContext.teamRole).toBe(TeamRole.OWNER);
      expect(profile.teamContext.enterpriseAccount).toEqual({
        ownerId: 'owner-sarah',
        ownerName: 'Sarah Director',
        ownerEmail: 'sarah@enterprise.com',
        planName: 'Enterprise 250 Seats',
        planTitle: 'Enterprise Plan',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        seatsAllocated: 250,
      });
    });
  });

  describe('JwtStrategy Role Inheritance', () => {
    it('injects UserRoleCode.ENTERPRISE into roles for team member under active enterprise plan', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-maxwell',
        parentUserId: 'owner-sarah',
        teamRole: TeamRole.MEMBER,
        roles: [{ role: { code: UserRoleCode.STUDENT } }],
      });

      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-parent-active',
      });

      const validatedData = await jwtStrategy.validate({
        sub: 'user-maxwell',
        email: 'maxwell@enterprise.com',
      } as any);

      expect(validatedData).toBeDefined();
      expect(validatedData.roles).toContain(UserRoleCode.ENTERPRISE);
      expect(validatedData.parentUserId).toBe('owner-sarah');
      expect(validatedData.rootEnterpriseId).toBe('owner-sarah');
      expect(validatedData.teamRole).toBe(TeamRole.MEMBER);
    });
  });
});
