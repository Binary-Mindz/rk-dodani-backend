import { Test, TestingModule } from '@nestjs/testing';
import { PlanAudience, SubscriptionStatus, UserRoleCode } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ChatService } from '../chat/chat.service';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamService } from './team.service';

describe('TeamService', () => {
  let service: TeamService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      subscription: {
        findMany: jest.fn(),
      },
      user: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      teamInvitation: {
        create: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
      userRole: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: MailService,
          useValue: {
            sendTeamInvitation: jest.fn().mockResolvedValue(undefined),
            sendTeamMemberDirectProvisioned: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ChatService,
          useValue: {
            ensureTeamConversation: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logCustom: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  it('allows inviting members when the latest relevant subscription is a B2B plan', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      parentUserId: null,
      teamRole: null,
      roles: [{ role: { code: UserRoleCode.ENTERPRISE } }],
    });

    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-2',
        status: SubscriptionStatus.ACTIVE,
        seats: 10,
        plan: { targetAudience: PlanAudience.B2B },
      },
    ]);

    prisma.user.count.mockResolvedValue(0);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.teamInvitation.create.mockResolvedValue({ id: 'inv-1' });

    await expect(
      service.inviteMember('user-1', {
        email: 'member@example.com',
        role: 'MEMBER' as any,
        message: 'Welcome',
      } as any),
    ).resolves.toBeDefined();
  });

  it('directly provisions a new team member and assigns ENTERPRISE role', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'owner-1',
      parentUserId: null,
      teamRole: null,
      roles: [{ role: { code: UserRoleCode.ENTERPRISE } }],
    });

    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-enterprise',
        status: SubscriptionStatus.ACTIVE,
        seats: 250,
        plan: { name: 'Enterprise Bundle 250', targetAudience: PlanAudience.B2B },
      },
    ]);

    prisma.user.count.mockResolvedValue(5);
    prisma.user.findFirst.mockResolvedValue(null); // not existing

    prisma.user.create.mockResolvedValue({
      id: 'member-new-1',
      email: 'maxwell@company.com',
      fullName: 'Maxwell Edison',
      parentUserId: 'owner-1',
      teamRole: 'MEMBER',
    });

    const result = await service.directCreateMember('owner-1', {
      email: 'maxwell@company.com',
      firstName: 'Maxwell',
      lastName: 'Edison',
      password: 'InitialPassword123!',
    });

    expect(result).toBeDefined();
    expect(result.userId).toBe('member-new-1');
    expect(result.enterpriseOwnerId).toBe('owner-1');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('allows a delegated TeamRole.ADMIN (e.g. co-admin) to direct-create a member under root owner', async () => {
    // Delegated admin Maxwell is acting
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'admin-maxwell',
      parentUserId: 'owner-sarah',
      teamRole: 'ADMIN',
      roles: [{ role: { code: UserRoleCode.ENTERPRISE } }],
    });

    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-sarah',
        status: SubscriptionStatus.ACTIVE,
        seats: 500,
        plan: { name: 'Enterprise 500 Seats', targetAudience: PlanAudience.B2B },
      },
    ]);

    prisma.user.count.mockResolvedValue(10);
    prisma.user.findFirst.mockResolvedValue(null);

    prisma.user.create.mockResolvedValue({
      id: 'member-sub-2',
      email: 'employee@company.com',
      fullName: 'Jane Doe',
      parentUserId: 'owner-sarah', // Assigned to Sarah, the root owner!
      teamRole: 'MEMBER',
    });


    const result = await service.directCreateMember('admin-maxwell', {
      email: 'employee@company.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(result).toBeDefined();
    expect(result.enterpriseOwnerId).toBe('owner-sarah');
  });

  it('throws BadRequestException when seat limit is exceeded during direct provisioning', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'owner-1',
      parentUserId: null,
      teamRole: null,
      roles: [{ role: { code: UserRoleCode.ENTERPRISE } }],
    });

    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-full',
        status: SubscriptionStatus.ACTIVE,
        seats: 10,
        plan: { targetAudience: PlanAudience.B2B },
      },
    ]);

    prisma.user.count.mockResolvedValue(10); // All 10 seats filled

    await expect(
      service.directCreateMember('owner-1', {
        email: 'overflow@company.com',
        firstName: 'Over',
        lastName: 'Flow',
      }),
    ).rejects.toThrow('Seat capacity limit reached. You have utilized all 10 allowed seats.');
  });
});
