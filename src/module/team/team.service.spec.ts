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
      },
      teamInvitation: {
        create: jest.fn(),
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
          },
        },
        {
          provide: ChatService,
          useValue: {},
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
});
