import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      userRole: {
        updateMany: jest.fn(),
      },
      subscription: {
        updateMany: jest.fn(),
      },
      entitlement: {
        updateMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
  });

  it('soft deletes a user and logs the action', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    prisma.user.update.mockResolvedValue({ id: 'user-1', deletedAt: new Date() });

    const result = await service.deleteUser('user-1', 'admin-1');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
