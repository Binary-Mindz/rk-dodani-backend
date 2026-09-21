import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanService } from './plan.service';
import { AuditService } from '../audit/audit.service';

describe('PlanService', () => {
  let service: PlanService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      plan: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      entitlement: {
        deleteMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return Promise.all(cb);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logCustom: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<PlanService>(PlanService);
  });

  describe('remove', () => {
    it('throws NotFoundException if plan does not exist', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if plan is already soft-deleted', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: 'plan-1',
        deletedAt: new Date(),
        _count: { subscriptions: 0, entitlements: 0, customSubscriptionAssignments: 0 },
      });

      await expect(service.remove('plan-1')).rejects.toThrow(NotFoundException);
    });

    it('soft deletes plan when active or historical subscriptions exist', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: 'plan-1',
        name: 'Pro Tier',
        deletedAt: null,
        stripeProductId: null,
        _count: {
          subscriptions: 3,
          entitlements: 1,
          customSubscriptionAssignments: 0,
        },
      });

      prisma.plan.update.mockResolvedValue({
        id: 'plan-1',
        deletedAt: new Date(),
        isActive: false,
        isPublic: false,
      });

      const result = await service.remove('plan-1');

      expect(prisma.plan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
          isPublic: false,
        },
      });
      expect(result.softDeleted).toBe(true);
      expect(result.deleted).toBe(true);
    });

    it('hard deletes plan and unlinks entitlements when no subscriptions exist', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: 'plan-unused',
        name: 'Unused Tier',
        deletedAt: null,
        stripeProductId: null,
        _count: {
          subscriptions: 0,
          entitlements: 2,
          customSubscriptionAssignments: 0,
        },
      });

      prisma.plan.delete.mockResolvedValue({ id: 'plan-unused' });

      const result = await service.remove('plan-unused');

      expect(prisma.entitlement.deleteMany).toHaveBeenCalledWith({
        where: { planId: 'plan-unused' },
      });
      expect(prisma.plan.delete).toHaveBeenCalledWith({
        where: { id: 'plan-unused' },
      });
      expect(result.softDeleted).toBe(false);
      expect(result.deleted).toBe(true);
    });
  });
});
