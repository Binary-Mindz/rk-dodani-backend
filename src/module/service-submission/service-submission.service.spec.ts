import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductSubmissionService } from '../product-submission/product-submission.service';
import { ServiceSubmissionService } from './service-submission.service';

describe('submission admin updates', () => {
  let serviceSubmissionService: ServiceSubmissionService;
  let productSubmissionService: ProductSubmissionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      serviceSubmission: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productSubmission: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      services: {
        findUnique: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceSubmissionService,
        ProductSubmissionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditService,
          useValue: {
            logCustom: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    serviceSubmissionService = module.get<ServiceSubmissionService>(ServiceSubmissionService);
    productSubmissionService = module.get<ProductSubmissionService>(ProductSubmissionService);
  });

  it('only updates status and adminNotes for service submissions', async () => {
    prisma.serviceSubmission.findUnique.mockResolvedValue({
      id: 'svc-1',
      fullName: 'Old Name',
      corporateEmail: 'old@example.com',
      primaryFocusArea: 'AI',
      message: 'Old message',
      status: 'NEW',
      adminNotes: 'Old note',
      serviceId: 'service-1',
    });
    prisma.serviceSubmission.update.mockResolvedValue({
      id: 'svc-1',
      fullName: 'Old Name',
      corporateEmail: 'old@example.com',
      primaryFocusArea: 'AI',
      message: 'Old message',
      status: 'REVIEWED',
      adminNotes: 'Updated note',
      serviceId: 'service-1',
    });

    await serviceSubmissionService.update('admin-1', 'svc-1', {
      status: 'REVIEWED',
      adminNotes: 'Updated note',
    } as any);

    const updatePayload = prisma.serviceSubmission.update.mock.calls[0][0].data;
    expect(updatePayload).toEqual(
      expect.objectContaining({
        status: 'REVIEWED',
        adminNotes: 'Updated note',
      }),
    );
    expect(updatePayload).not.toHaveProperty('fullName');
    expect(updatePayload).not.toHaveProperty('corporateEmail');
    expect(updatePayload).not.toHaveProperty('primaryFocusArea');
    expect(updatePayload).not.toHaveProperty('message');
    expect(updatePayload).not.toHaveProperty('serviceId');
  });

  it('only updates status and adminNotes for product submissions', async () => {
    prisma.productSubmission.findUnique.mockResolvedValue({
      id: 'prod-1',
      fullName: 'Old Name',
      corporateEmail: 'old@example.com',
      company: 'Example Ltd',
      targetDeployTimeline: 'IMMEDIATELY',
      useCase: 'Old use case',
      status: 'NEW',
      adminNotes: 'Old note',
      productId: 'product-1',
    });
    prisma.productSubmission.update.mockResolvedValue({
      id: 'prod-1',
      fullName: 'Old Name',
      corporateEmail: 'old@example.com',
      company: 'Example Ltd',
      targetDeployTimeline: 'IMMEDIATELY',
      useCase: 'Old use case',
      status: 'REVIEWED',
      adminNotes: 'Updated note',
      productId: 'product-1',
    });

    await productSubmissionService.update('admin-1', 'prod-1', {
      status: 'REVIEWED',
      adminNotes: 'Updated note',
    } as any);

    const updatePayload = prisma.productSubmission.update.mock.calls[0][0].data;
    expect(updatePayload).toEqual(
      expect.objectContaining({
        status: 'REVIEWED',
        adminNotes: 'Updated note',
      }),
    );
    expect(updatePayload).not.toHaveProperty('fullName');
    expect(updatePayload).not.toHaveProperty('corporateEmail');
    expect(updatePayload).not.toHaveProperty('company');
    expect(updatePayload).not.toHaveProperty('targetDeployTimeline');
    expect(updatePayload).not.toHaveProperty('useCase');
    expect(updatePayload).not.toHaveProperty('productId');
  });
});
