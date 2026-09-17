import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { ServiceGroupService } from './service-group.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ServiceGroupService - Draft System Specs', () => {
  let service: ServiceGroupService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      serviceGroup: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(prisma);
        }
        return Promise.all(callback);
      }),
    };

    auditService = {
      logCustom: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceGroupService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ServiceGroupService>(ServiceGroupService);
  });

  describe('create with draft status', () => {
    it('creates service group with DRAFT status by default', async () => {
      prisma.serviceGroup.findFirst.mockResolvedValue({ order: 2 });
      prisma.serviceGroup.create.mockResolvedValue({
        id: 'grp-1',
        name: 'AI Transformations',
        description: 'AI strategy group',
        icon: 'ai-icon',
        order: 3,
        status: PublishStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('admin-1', {
        name: 'AI Transformations',
        description: 'AI strategy group',
        icon: 'ai-icon',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.DRAFT);
      expect(prisma.serviceGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PublishStatus.DRAFT,
          }),
        }),
      );
    });

    it('creates service group with PUBLISHED status when explicitly requested', async () => {
      prisma.serviceGroup.findFirst.mockResolvedValue({ order: 1 });
      prisma.serviceGroup.create.mockResolvedValue({
        id: 'grp-2',
        name: 'Published Group',
        order: 2,
        status: PublishStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('admin-1', {
        name: 'Published Group',
        status: PublishStatus.PUBLISHED,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.serviceGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });
  });

  describe('findAll - Public vs Admin filtering', () => {
    it('public findAll returns only PUBLISHED service groups', async () => {
      prisma.serviceGroup.findMany.mockResolvedValue([
        {
          id: 'grp-pub-1',
          name: 'Published Group',
          order: 1,
          status: PublishStatus.PUBLISHED,
          createdAt: new Date(),
        },
      ]);
      prisma.serviceGroup.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 }, true);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.serviceGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('admin findAll returns draft service groups when status=DRAFT is queried', async () => {
      prisma.serviceGroup.findMany.mockResolvedValue([
        {
          id: 'grp-draft-1',
          name: 'Draft Group',
          order: 1,
          status: PublishStatus.DRAFT,
          createdAt: new Date(),
        },
      ]);
      prisma.serviceGroup.count.mockResolvedValue(1);

      const result = await service.findAll(
        { status: PublishStatus.DRAFT, page: 1, limit: 10 },
        false,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe(PublishStatus.DRAFT);
      expect(prisma.serviceGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PublishStatus.DRAFT,
          }),
        }),
      );
    });

    it('admin findAll returns all service groups when status is omitted', async () => {
      prisma.serviceGroup.findMany.mockResolvedValue([
        { id: 'grp-1', status: PublishStatus.DRAFT },
        { id: 'grp-2', status: PublishStatus.PUBLISHED },
      ]);
      prisma.serviceGroup.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 }, false);

      expect(result.items).toHaveLength(2);
      expect(prisma.serviceGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('findOne - Public vs Admin draft accessibility', () => {
    it('public findOne throws NotFoundException if group is DRAFT', async () => {
      prisma.serviceGroup.findFirst.mockResolvedValue(null);

      await expect(service.findOne('grp-draft-id', true)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.serviceGroup.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'grp-draft-id',
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('admin findOne returns service group even if DRAFT', async () => {
      prisma.serviceGroup.findFirst.mockResolvedValue({
        id: 'grp-draft-id',
        name: 'Draft Group',
        status: PublishStatus.DRAFT,
        createdAt: new Date(),
      });

      const result = await service.findOne('grp-draft-id', false);

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.DRAFT);
      expect(prisma.serviceGroup.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'grp-draft-id' },
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates service group status from DRAFT to PUBLISHED', async () => {
      prisma.serviceGroup.findFirst.mockResolvedValue({
        id: 'grp-1',
        status: PublishStatus.DRAFT,
      });

      prisma.serviceGroup.update.mockResolvedValue({
        id: 'grp-1',
        name: 'Active Group',
        status: PublishStatus.PUBLISHED,
        createdAt: new Date(),
      });

      const result = await service.updateStatus('admin-1', 'grp-1', PublishStatus.PUBLISHED);

      expect(result.status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.serviceGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'grp-1' },
          data: { status: PublishStatus.PUBLISHED },
        }),
      );
    });
  });
});
