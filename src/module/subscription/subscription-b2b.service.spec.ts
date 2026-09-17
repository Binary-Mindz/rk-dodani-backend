import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BillingInterval,
  BillingProvider,
  PlanAudience,
  SubscriptionStatus,
  UserRoleCode,
  UserStatus,
  Prisma,
  CustomSubscriptionAssignmentStatus,
} from '@prisma/client';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChatService } from '../chat/chat.service';
import { MailService } from 'common/mail/mail.service';

describe('SubscriptionService - B2B Engine Specs', () => {
  let service: SubscriptionService;
  let prisma: any;
  let configService: any;
  let mailService: any;
  let chatService: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      plan: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      subscription: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      role: {
        findUnique: jest.fn(),
      },
      userRole: {
        updateMany: jest.fn(),
        upsert: jest.fn(),
      },
      customSubscriptionAssignment: {
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      entitlement: {
        create: jest.fn().mockResolvedValue({ id: 'ent-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_dummy_key_12345';
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return null;
      }),
      getOrThrow: jest.fn().mockReturnValue('sk_test_dummy_key_12345'),
    };

    mailService = {
      sendEnterpriseAccountCredentials: jest.fn().mockResolvedValue(undefined),
      sendCustomSubscriptionEmail: jest.fn().mockResolvedValue(undefined),
    };

    chatService = {
      ensureTeamConversation: jest.fn().mockResolvedValue(undefined),
    };

    auditService = {
      logCustom: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
        { provide: ChatService, useValue: chatService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  describe('Sarah Enterprise PO Procurement Flow', () => {
    it('directly provisions non-existent user on-the-fly and activates PO subscription immediately', async () => {
      // User does not exist initially
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'sarah-new-user-id',
        email: 'sarah@enterprise.com',
        firstName: 'Sarah',
        lastName: 'Admin',
        fullName: 'Sarah Admin',
        status: UserStatus.ACTIVE,
      });

      prisma.role.findUnique.mockResolvedValue({
        id: 'role-enterprise-id',
        code: UserRoleCode.ENTERPRISE,
      });

      const customPlanMock = {
        id: 'plan-custom-po-1',
        code: 'CUSTOM_PO_123',
        name: 'Enterprise 500 Seats PO',
        planTitle: 'Enterprise 500 Seats PO',
        billingInterval: BillingInterval.YEARLY,
        currency: 'USD',
        priceAmount: 50000,
        trialDays: 0,
        targetAudience: PlanAudience.B2B,
      };
      prisma.plan.create.mockResolvedValue(customPlanMock);

      const subscriptionMock = {
        id: 'sub-po-active-1',
        userId: 'sarah-new-user-id',
        planId: customPlanMock.id,
        status: SubscriptionStatus.ACTIVE,
        poNumber: 'PO-ENTERPRISE-2026-001',
        paymentMethod: 'PURCHASE_ORDER',
        seats: 500,
        plan: customPlanMock,
      };
      prisma.subscription.create.mockResolvedValue(subscriptionMock);

      const assignmentMock = {
        id: 'assign-po-1',
        userId: 'sarah-new-user-id',
        planId: customPlanMock.id,
        subscriptionId: subscriptionMock.id,
        isPo: true,
        poNumber: 'PO-ENTERPRISE-2026-001',
        checkoutUrl: null,
        checkoutSessionId: null,
        createdAt: new Date(),
        user: { email: 'sarah@enterprise.com', fullName: 'Sarah Admin' },
        plan: customPlanMock,
        subscription: subscriptionMock,
      };
      prisma.customSubscriptionAssignment.create.mockResolvedValue(assignmentMock);

      const result = await service.assignCustomSubscription('admin-user-id', {
        isPo: true,
        poNumber: 'PO-ENTERPRISE-2026-001',
        newUser: {
          email: 'sarah@enterprise.com',
          firstName: 'Sarah',
          lastName: 'Admin',
        },
        targetAudience: PlanAudience.B2B,
        seats: 500,
        planTitle: 'Enterprise 500 Seats PO',
        billingInterval: BillingInterval.YEARLY,
        customPrice: 50000,
      });

      expect(result).toBeDefined();
      expect(result.isPo).toBe(true);
      expect(result.poNumber).toBe('PO-ENTERPRISE-2026-001');
      expect(result.paymentUrl).toBeNull();
      expect(result.paymentSessionId).toBeNull();
      expect(result.userId).toBe('sarah-new-user-id');

      // User created on the fly
      expect(prisma.user.create).toHaveBeenCalled();
      // Role upgraded to ENTERPRISE
      expect(prisma.userRole.upsert).toHaveBeenCalled();
      // Subscription created with ACTIVE status and PO details
      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.ACTIVE,
            poNumber: 'PO-ENTERPRISE-2026-001',
            paymentMethod: 'PO',
            seats: 500,
          }),
        }),
      );

      // Account credentials emailed to Sarah instead of payment link
      expect(mailService.sendEnterpriseAccountCredentials).toHaveBeenCalledWith(
        'sarah@enterprise.com',
        'Sarah Admin',
        expect.any(String),
        'Enterprise 500 Seats PO',
        'PO-ENTERPRISE-2026-001',
      );
      expect(mailService.sendCustomSubscriptionEmail).not.toHaveBeenCalled();
    });

    it('assigns TRIALING status and trial dates when trialDays > 0 for offline PO enterprise user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'trial-enterprise-user-id',
        email: 'trial.admin@enterprise.com',
        fullName: 'Trial Admin',
        status: UserStatus.ACTIVE,
      });

      prisma.role.findUnique.mockResolvedValue({
        id: 'role-enterprise-id',
        code: UserRoleCode.ENTERPRISE,
      });

      const customPlanMock = {
        id: 'plan-custom-trial-id',
        name: 'Enterprise 14-Day Pilot',
        priceAmount: new Prisma.Decimal(0),
        currency: 'USD',
        trialDays: 14,
      };
      prisma.plan.create.mockResolvedValue(customPlanMock);

      const subscriptionMock = {
        id: 'sub-trial-id',
        status: SubscriptionStatus.TRIALING,
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 86400000),
      };
      prisma.subscription.create.mockResolvedValue(subscriptionMock);

      const assignmentMock = {
        id: 'assignment-trial-id',
        userId: 'trial-enterprise-user-id',
        planId: 'plan-custom-trial-id',
        isPo: true,
        poNumber: 'PO-PILOT-14',
        status: CustomSubscriptionAssignmentStatus.PAID,
        user: { email: 'trial.admin@enterprise.com', fullName: 'Trial Admin' },
        plan: customPlanMock,
        subscription: subscriptionMock,
      };
      prisma.customSubscriptionAssignment.create.mockResolvedValue(assignmentMock);

      const result = await service.assignCustomSubscription('admin-user-id', {
        isPo: true,
        poNumber: 'PO-PILOT-14',
        trialDays: 14,
        newUser: {
          email: 'trial.admin@enterprise.com',
          firstName: 'Trial',
          lastName: 'Admin',
        },
        targetAudience: PlanAudience.B2B,
        seats: 50,
        planTitle: 'Enterprise 14-Day Pilot',
      });

      expect(result).toBeDefined();
      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.TRIALING,
            poNumber: 'PO-PILOT-14',
            seats: 50,
            trialStartsAt: expect.any(Date),
            trialEndsAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('14-Day Free Trial Payment Verification', () => {
    it('accepts no_payment_required status for trial verification and assigns TRIALING status', async () => {
      // Mock stripe session retrieve
      (service as any).stripe = {
        checkout: {
          sessions: {
            retrieve: jest.fn().mockResolvedValue({
              id: 'cs_test_trial_session',
              payment_status: 'no_payment_required',
              customer: 'cus_123',
              subscription: 'sub_stripe_123',
              metadata: {
                userId: 'user-trial-1',
                planId: 'plan-trial-1',
                seats: '1',
              },
            }),
          },
        },
        subscriptions: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'sub_stripe_123',
            status: 'trialing',
            trial_start: Math.floor(Date.now() / 1000),
            trial_end: Math.floor(Date.now() / 1000) + 14 * 86400,
          }),
        },
      };

      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({
        id: 'sub-trial-created-1',
        status: SubscriptionStatus.TRIALING,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-trial-1',
        email: 'trial@example.com',
      });
      prisma.plan.findUnique.mockResolvedValue({
        id: 'plan-trial-1',
        name: 'Trial Plan',
        targetAudience: PlanAudience.B2C,
        trialDays: 14,
        billingInterval: BillingInterval.MONTHLY,
      });
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-student-id',
        code: UserRoleCode.STUDENT,
      });

      await service.verifySessionAndAssignRole('cs_test_trial_session');

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.TRIALING,
          }),
        }),
      );
    });
  });
});
