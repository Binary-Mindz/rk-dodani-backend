import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { ProductService } from './product.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ProductService - Draft System Specs', () => {
  let service: ProductService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
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
        ProductService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create with draft status', () => {
    it('creates product with DRAFT status by default when status is omitted', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'prod-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await service.create('admin-1', {
        title: 'Enterprise AI Suite',
        subTitle: 'Modern Decision Intelligence',
        module: 'Intelligence',
        description: 'Comprehensive transformation platform',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.DRAFT);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Enterprise AI Suite',
          status: PublishStatus.DRAFT,
          order: 1,
        }),
      });
      expect(auditService.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entityType: 'PRODUCT',
        }),
      );
    });

    it('creates product with PUBLISHED status when explicitly specified', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'prod-2',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await service.create('admin-1', {
        title: 'Capital Market Core',
        subTitle: 'Algorithmic Risk Assessment',
        module: 'Capital Markets',
        description: 'Fintech algorithmic engine',
        status: PublishStatus.PUBLISHED,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Capital Market Core',
          status: PublishStatus.PUBLISHED,
        }),
      });
    });
  });

  describe('findAll with draft filtering', () => {
    it('filters by status: PUBLISHED and isActive: true when publicOnly = true', async () => {
      const publishedProducts = [
        {
          id: 'prod-pub-1',
          title: 'Published Product',
          status: PublishStatus.PUBLISHED,
          isActive: true,
          order: 1,
        },
      ];
      prisma.product.findMany.mockResolvedValue(publishedProducts);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 }, true);

      expect(result.items).toHaveLength(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('returns all products including DRAFT for admin when no status filter is provided', async () => {
      const allProducts = [
        { id: 'prod-1', title: 'Draft Product', status: PublishStatus.DRAFT, isActive: true },
        { id: 'prod-2', title: 'Published Product', status: PublishStatus.PUBLISHED, isActive: true },
      ];
      prisma.product.findMany.mockResolvedValue(allProducts);
      prisma.product.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 }, false);

      expect(result.items).toHaveLength(2);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: PublishStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('filters by specific status for admin when query.status is provided', async () => {
      const draftProducts = [
        { id: 'prod-1', title: 'Draft Product', status: PublishStatus.DRAFT, isActive: true },
      ];
      prisma.product.findMany.mockResolvedValue(draftProducts);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ status: PublishStatus.DRAFT }, false);

      expect(result.items).toHaveLength(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PublishStatus.DRAFT,
          }),
        }),
      );
    });
  });

  describe('findOne with draft access control', () => {
    it('throws NotFoundException when public user attempts to view a DRAFT product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-draft-1',
        title: 'Hidden Draft Product',
        status: PublishStatus.DRAFT,
        isActive: true,
      });

      await expect(service.findOne('prod-draft-1', true)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when public user attempts to view an inactive product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-inactive-1',
        title: 'Inactive Product',
        status: PublishStatus.PUBLISHED,
        isActive: false,
      });

      await expect(service.findOne('prod-inactive-1', true)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns product to public user when status is PUBLISHED and active', async () => {
      const publishedProduct = {
        id: 'prod-pub-1',
        title: 'Public Product',
        status: PublishStatus.PUBLISHED,
        isActive: true,
      };
      prisma.product.findUnique.mockResolvedValue(publishedProduct);

      const result = await service.findOne('prod-pub-1', true);
      expect(result).toEqual(publishedProduct);
    });

    it('allows admin to view DRAFT products', async () => {
      const draftProduct = {
        id: 'prod-draft-1',
        title: 'Hidden Draft Product',
        status: PublishStatus.DRAFT,
        isActive: true,
      };
      prisma.product.findUnique.mockResolvedValue(draftProduct);

      const result = await service.findOne('prod-draft-1', false);
      expect(result).toEqual(draftProduct);
    });
  });

  describe('updateStatus', () => {
    it('updates product publish status and records audit log', async () => {
      const existingProduct = {
        id: 'prod-1',
        title: 'Product Title',
        status: PublishStatus.DRAFT,
      };
      const updatedProduct = {
        id: 'prod-1',
        title: 'Product Title',
        status: PublishStatus.PUBLISHED,
      };

      prisma.product.findUnique.mockResolvedValue(existingProduct);
      prisma.product.update.mockResolvedValue(updatedProduct);

      const result = await service.updateStatus('admin-1', 'prod-1', PublishStatus.PUBLISHED);

      expect(result.status).toBe(PublishStatus.PUBLISHED);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { status: PublishStatus.PUBLISHED },
      });
      expect(auditService.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'PRODUCT',
          entityId: 'prod-1',
        }),
      );
    });

    it('throws NotFoundException when updating status for non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('admin-1', 'invalid-id', PublishStatus.PUBLISHED),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates status along with other fields', async () => {
      const existing = {
        id: 'prod-1',
        title: 'Old Title',
        order: 1,
        status: PublishStatus.DRAFT,
      };
      const updated = {
        id: 'prod-1',
        title: 'New Title',
        order: 1,
        status: PublishStatus.PUBLISHED,
      };

      prisma.product.findUnique.mockResolvedValue(existing);
      prisma.product.update.mockResolvedValue(updated);

      const result = await service.update('admin-1', 'prod-1', {
        title: 'New Title',
        status: PublishStatus.PUBLISHED,
      });

      expect(result.status).toBe(PublishStatus.PUBLISHED);
      expect(result.title).toBe('New Title');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: expect.objectContaining({
          title: 'New Title',
          status: PublishStatus.PUBLISHED,
        }),
      });
    });
  });
});
