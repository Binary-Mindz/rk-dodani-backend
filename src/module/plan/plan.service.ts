import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BillingProvider, PlanAudience } from '@prisma/client';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { QueryPlanDto } from './dto/query-plan.dto';
import { UpdatePlanStatusDto } from './dto/update-plan-status.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCurrency(currency: string) {
    return currency.trim().toUpperCase();
  }

  async create(dto: CreatePlanDto) {
    const existingCode = await this.prisma.plan.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existingCode) {
      throw new BadRequestException(`A plan with unique code "${dto.code}" already exists in the system`);
    }

    const plan = await this.prisma.plan.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        description: dto.description ?? null,
        targetAudience: dto.targetAudience ?? PlanAudience.B2C,
        billingProvider: dto.billingProvider ?? BillingProvider.STRIPE,
        billingInterval: dto.billingInterval,
        currency: this.normalizeCurrency(dto.currency),
        priceAmount: new Prisma.Decimal(dto.priceAmount),
        isPerUser: dto.isPerUser ?? false,
        trialDays: dto.trialDays ?? 0,
        isPublic: dto.isPublic ?? true,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        features: dto.features ? (dto.features as any) : null,
        metadata: dto.metadata ?? null,
      },
    });

    return plan;
  }

  async findAdminAll(query: QueryPlanDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PlanWhereInput = {
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.targetAudience && { targetAudience: query.targetAudience }),
      ...(query.billingProvider && { billingProvider: query.billingProvider }),
      ...(query.billingInterval && { billingInterval: query.billingInterval }),
      ...(typeof query.isPublic === 'boolean' && { isPublic: query.isPublic }),
      ...(typeof query.isActive === 'boolean' && { isActive: query.isActive }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plan.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { priceAmount: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.plan.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  
  async getPlanStats() {
    const [totalPlans, activePlans, inactivePlans] = await this.prisma.$transaction([
      this.prisma.plan.count(),
      this.prisma.plan.count({ where: { isActive: true } }),
      this.prisma.plan.count({ where: { isActive: false } }),
    ]);

    return {
      totalPlans,
      activePlans,
      inactivePlans,
    };
  }

  async findAdminOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
            entitlements: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async update(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const codeExists = await this.prisma.plan.findUnique({
        where: { code: dto.code.trim().toUpperCase() },
      });

      if (codeExists) {
        throw new BadRequestException(`Cannot update! Unique code "${dto.code}" is already taken by another tier`);
      }
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetAudience !== undefined && { targetAudience: dto.targetAudience }),
        ...(dto.billingProvider !== undefined && { billingProvider: dto.billingProvider }),
        ...(dto.billingInterval !== undefined && { billingInterval: dto.billingInterval }),
        ...(dto.currency !== undefined && { currency: this.normalizeCurrency(dto.currency) }),
        ...(dto.priceAmount !== undefined && { priceAmount: new Prisma.Decimal(dto.priceAmount) }),
        ...(dto.isPerUser !== undefined && { isPerUser: dto.isPerUser }),
        ...(dto.trialDays !== undefined && { trialDays: dto.trialDays }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.features !== undefined && { features: dto.features as any }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdatePlanStatusDto) {
    const existing = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    return this.prisma.plan.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
            entitlements: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    if (existing._count.subscriptions > 0 || existing._count.entitlements > 0) {
      throw new BadRequestException(
        'Cannot delete plan that is already linked to active consumer subscriptions or entitlements',
      );
    }

    await this.prisma.plan.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async findPublicAll(query: QueryPlanDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PlanWhereInput = {
      isPublic: true,
      isActive: true,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.targetAudience && { targetAudience: query.targetAudience }),
      ...(query.billingProvider && { billingProvider: query.billingProvider }),
      ...(query.billingInterval && { billingInterval: query.billingInterval }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plan.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          targetAudience: true,
          billingProvider: true,
          billingInterval: true,
          currency: true,
          priceAmount: true,
          isPerUser: true,
          trialDays: true,
          isFeatured: true,
          sortOrder: true,
          features: true,
          metadata: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { priceAmount: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.plan.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findPublicOne(id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: {
        id,
        isPublic: true,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        targetAudience: true,
        billingProvider: true,
        billingInterval: true,
        currency: true,
        priceAmount: true,
        isPerUser: true,
        trialDays: true,
        isFeatured: true,
        sortOrder: true,
        features: true,
        metadata: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }
}