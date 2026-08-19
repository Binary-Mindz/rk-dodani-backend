import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: { product: any; $transaction: any };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '1',
            title: 'Test Product',
            subTitle: 'Test Subtitle',
            module: 'Test Module',
            description: 'Test Description',
            order: 1,
            isActive: true,
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue({
          id: '1',
          title: 'Test Product',
          order: 1,
        }),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { logCustom: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all public products', async () => {
    const result = await service.findAll({ page: 1, limit: 10 }, true);
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      skip: 0,
      take: 10,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('should find one product by ID', async () => {
    const result = await service.findOne('1');
    expect(result.id).toBe('1');
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
