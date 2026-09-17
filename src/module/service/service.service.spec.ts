import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { ServiceService } from './service.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ServiceService - Draft System Specs', () => {
  let service: ServiceService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      services: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      serviceGroup: {
        findUnique: jest.fn(),
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
        ServiceService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  describe('create with draft status', () => {
    it('creates service with DRAFT status by default when status is omitted', async () => {
      const createdMock = {
        id: 'srv-1',
        title: 'Draft Strategy Service',
        heading: 'Draft Strategy Service',
        description: 'Test description',
        status: PublishStatus.DRAFT,
        serviceGroupId: null,
        serviceGroup: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.services.create.mockResolvedValue(createdMock);

      const result = await service.create('admin-1', {
        name: 'Draft Strategy Service',
        description: 'Test description',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.DRAFT);
      expect(prisma.services.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PublishStatus.DRAFT,
          }),
        }),
      );
    });

    it('creates service with PUBLISHED status when explicitly specified', async () => {
      const createdMock = {
        id: 'srv-2',
        title: 'Published Strategy Service',
        heading: 'Published Strategy Service',
        status: PublishStatus.PUBLISHED,
        serviceGroupId: null,
        serviceGroup: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.services.create.mockResolvedValue(createdMock);

      const result = await service.create('admin-1', {
        name: 'Published Strategy Service',
        status: PublishStatus.PUBLISHED,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.services.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });
  });

  describe('findAll - Public vs Admin filtering', () => {
    it('public findAll strictly filters for PUBLISHED status', async () => {
      prisma.services.findMany.mockResolvedValue([
        {
          id: 'srv-pub-1',
          title: 'Public Service',
          status: PublishStatus.PUBLISHED,
          serviceGroupId: null,
          serviceGroup: null,
          createdAt: new Date(),
        },
      ]);
      prisma.services.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 }, true);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.services.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('admin findAll returns draft services when status=DRAFT is requested', async () => {
      prisma.services.findMany.mockResolvedValue([
        {
          id: 'srv-draft-1',
          title: 'Draft Service',
          status: PublishStatus.DRAFT,
          serviceGroupId: null,
          serviceGroup: null,
          createdAt: new Date(),
        },
      ]);
      prisma.services.count.mockResolvedValue(1);

      const result = await service.findAll(
        { status: PublishStatus.DRAFT, page: 1, limit: 10 },
        false,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe(PublishStatus.DRAFT);
      expect(prisma.services.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PublishStatus.DRAFT,
          }),
        }),
      );
    });

    it('admin findAll returns all services when status is omitted', async () => {
      prisma.services.findMany.mockResolvedValue([
        { id: 'srv-1', status: PublishStatus.DRAFT },
        { id: 'srv-2', status: PublishStatus.PUBLISHED },
      ]);
      prisma.services.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 }, false);

      expect(result.items).toHaveLength(2);
      expect(prisma.services.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('findOne - Public vs Admin draft accessibility', () => {
    it('public findOne throws NotFoundException if service is DRAFT', async () => {
      prisma.services.findFirst.mockResolvedValue(null);

      await expect(service.findOne('draft-id', true)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.services.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'draft-id',
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('admin findOne returns service even if DRAFT', async () => {
      prisma.services.findFirst.mockResolvedValue({
        id: 'draft-id',
        title: 'Draft Service',
        status: PublishStatus.DRAFT,
        serviceGroupId: null,
        serviceGroup: null,
        createdAt: new Date(),
      });

      const result = await service.findOne('draft-id', false);

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.DRAFT);
      expect(prisma.services.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'draft-id' },
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates service status from DRAFT to PUBLISHED', async () => {
      prisma.services.findFirst.mockResolvedValue({
        id: 'srv-1',
        status: PublishStatus.DRAFT,
      });

      prisma.services.update.mockResolvedValue({
        id: 'srv-1',
        title: 'Now Published Service',
        status: PublishStatus.PUBLISHED,
        serviceGroupId: null,
        serviceGroup: null,
        createdAt: new Date(),
      });

      const result = await service.updateStatus('admin-1', 'srv-1', PublishStatus.PUBLISHED);

      expect(result.status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.services.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'srv-1' },
          data: { status: PublishStatus.PUBLISHED },
        }),
      );
    });
  });
});
