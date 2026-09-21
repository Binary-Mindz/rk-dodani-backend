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
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      userSession: {
        deleteMany: jest.fn(),
      },
      userRole: {
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      subscription: {
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      entitlement: {
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      customSubscriptionAssignment: {
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
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
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      deletedAt: new Date(),
    });

    const result = await service.deleteUser('user-1', 'admin-1');

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { parentUserId: 'user-1' },
      data: { parentUserId: null, teamRole: null },
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
    expect(prisma.userSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('hard deletes a user and purges records when requested', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    const result = await service.deleteUser('user-1', 'admin-1', true);

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          newValues: expect.objectContaining({ hardDeleted: true }),
        }),
      }),
    );
    expect(result.hardDeleted).toBe(true);
  });
});
