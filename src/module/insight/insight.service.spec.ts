import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InsightService } from './insight.service';
import { InsightStatus, InsightVisibility } from '@prisma/client';

describe('InsightService', () => {
  let service: InsightService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      insight: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      insightCategory: {
        count: jest.fn(),
      },
      insightCategoryMap: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (arg: any) => {
        if (typeof arg === 'function') {
          return arg(prisma);
        }
        return Promise.all(arg);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditService,
          useValue: {
            logCustom: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<InsightService>(InsightService);
  });

  describe('create', () => {
    it('should create insight with dynamic custom contentType', async () => {
      prisma.insight.findUnique.mockResolvedValue(null);
      const mockCreated = {
        id: 'ins-123',
        slug: 'emerging-tech-webinar',
        title: 'Emerging Tech Webinar',
        contentType: 'WEBINAR',
        status: InsightStatus.DRAFT,
        visibility: InsightVisibility.PUBLIC,
      };
      prisma.insight.create.mockResolvedValue(mockCreated);
      prisma.insight.findFirst.mockResolvedValue(mockCreated);

      const result = await service.create('admin-uuid', {
        title: 'Emerging Tech Webinar',
        contentType: 'webinar',
      });

      expect(prisma.insight.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Emerging Tech Webinar',
            contentType: 'WEBINAR',
          }),
        }),
      );
      expect(result.contentType).toBe('WEBINAR');
    });

    it('should default contentType to ARTICLE if not provided', async () => {
      prisma.insight.findUnique.mockResolvedValue(null);
      const mockCreated = {
        id: 'ins-456',
        slug: 'standard-article',
        title: 'Standard Article',
        contentType: 'ARTICLE',
        status: InsightStatus.DRAFT,
        visibility: InsightVisibility.PUBLIC,
      };
      prisma.insight.create.mockResolvedValue(mockCreated);
      prisma.insight.findFirst.mockResolvedValue(mockCreated);

      const result = await service.create('admin-uuid', {
        title: 'Standard Article',
      });

      expect(prisma.insight.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentType: 'ARTICLE',
          }),
        }),
      );
      expect(result.contentType).toBe('ARTICLE');
    });
  });

  describe('findAll', () => {
    it('should filter by uppercased dynamic contentType', async () => {
      prisma.insight.findMany.mockResolvedValue([]);
      prisma.insight.count.mockResolvedValue(0);

      await service.findAll({ contentType: 'infographic' } as any);

      expect(prisma.insight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: 'INFOGRAPHIC',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update insight with dynamic contentType', async () => {
      const existing = {
        id: 'ins-123',
        title: 'Original Title',
        slug: 'original-title',
        contentType: 'ARTICLE',
      };
      prisma.insight.findFirst.mockResolvedValue(existing);
      prisma.insight.update.mockResolvedValue({
        ...existing,
        contentType: 'INTERVIEW',
      });

      await service.update('admin-uuid', 'ins-123', {
        contentType: 'interview',
      });

      expect(prisma.insight.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ins-123' },
          data: expect.objectContaining({
            contentType: 'INTERVIEW',
          }),
        }),
      );
    });
  });
});
