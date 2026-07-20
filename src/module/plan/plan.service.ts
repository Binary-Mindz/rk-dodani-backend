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
import { ConfigService } from '@nestjs/config';
import { Stripe as StripeType } from 'stripe';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PlanService {
  private stripe: StripeType;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      const StripeConstructor = require('stripe');
      this.stripe = new StripeConstructor(stripeSecretKey);
    }
  }

  private audit(
    actorUserId: string | null,
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
  ) {
    this.auditService
      .logCustom({
        actorUserId,
        entityType,
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  private normalizeCurrency(currency: string) {
    return currency.trim().toUpperCase();
  }

  private async createStripeProduct(
    name: string,
    description?: string,
    code?: string,
  ): Promise<string> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured on this server');
    }
    const product = await this.stripe.products.create({
      name,
      description: description || undefined,
      metadata: code ? { planCode: code } : undefined,
    });
    return product.id;
  }

  private async updateStripeProduct(
    productId: string,
    name: string,
    description?: string,
  ): Promise<void> {
    if (!this.stripe) return;
    await this.stripe.products.update(productId, {
      name,
      description: description || undefined,
    });
  }

  private async createStripePrice(
    productId: string,
    amount: number,
    currency: string,
    interval: 'month' | 'year',
  ): Promise<string> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured on this server');
    }
    const price = await this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      recurring: {
        interval,
      },
    });
    return price.id;
  }

  async create(dto: CreatePlanDto) {
    const existingCode = await this.prisma.plan.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existingCode) {
      throw new BadRequestException(
        `A plan with unique code "${dto.code}" already exists in the system`,
      );
    }

    let stripeProductId: string | null = null;
    let stripePriceId: string | null = null;
    let stripePriceIdMonthly: string | null = null;
    let stripePriceIdYearly: string | null = null;

    const isStripe = dto.billingProvider === BillingProvider.STRIPE;

    if (isStripe) {
      // 1. Create Product
      stripeProductId = await this.createStripeProduct(
        dto.name,
        dto.subtitle || dto.description,
        dto.code.trim().toUpperCase(),
      );

      // 2. Create base Price if priceAmount > 0
      if (dto.priceAmount > 0) {
        const interval = dto.billingInterval === 'YEARLY' ? 'year' : 'month';
        stripePriceId = await this.createStripePrice(
          stripeProductId,
          dto.priceAmount,
          dto.currency,
          interval,
        );
      }

      // 3. Create monthly price if priceAmountMonthly > 0
      if (dto.priceAmountMonthly && dto.priceAmountMonthly > 0) {
        stripePriceIdMonthly = await this.createStripePrice(
          stripeProductId,
          dto.priceAmountMonthly,
          dto.currency,
          'month',
        );
      }

      // 4. Create yearly price if priceAmountYearly > 0
      if (dto.priceAmountYearly && dto.priceAmountYearly > 0) {
        stripePriceIdYearly = await this.createStripePrice(
          stripeProductId,
          dto.priceAmountYearly,
          dto.currency,
          'year',
        );
      }
    }

    const plan = await this.prisma.plan.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        description: dto.description ?? null,
        subtitle: dto.subtitle ?? null,
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
        maxUsers: dto.maxUsers ?? 1,
        stripeProductId,
        stripePriceId,
        stripePriceIdMonthly,
        stripePriceIdYearly,
        priceAmountMonthly:
          dto.priceAmountMonthly !== undefined &&
          dto.priceAmountMonthly !== null
            ? new Prisma.Decimal(dto.priceAmountMonthly)
            : null,
        priceAmountYearly:
          dto.priceAmountYearly !== undefined && dto.priceAmountYearly !== null
            ? new Prisma.Decimal(dto.priceAmountYearly)
            : null,
        features: dto.features ? (dto.features as any) : null,
        metadata: dto.metadata ?? null,
      },
    });

    this.audit(null, 'PLAN', plan.id, 'CREATE', undefined, {
      name: dto.name,
      code: dto.code,
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

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPlanStats() {
    const [totalPlans, activePlans, inactivePlans] =
      await this.prisma.$transaction([
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
        subscriptions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const activeSubscribersCount = await this.prisma.subscription.count({
      where: {
        planId: id,
        status: 'ACTIVE',
      },
    });

    const churnedCount = await this.prisma.subscription.count({
      where: {
        planId: id,
        status: 'CANCELED',
      },
    });

    const revenueAggregation = await this.prisma.subscription.aggregate({
      where: {
        planId: id,
        lastPaymentAmount: { not: null },
      },
      _sum: {
        lastPaymentAmount: true,
      },
    });

    const totalRevenue = revenueAggregation._sum.lastPaymentAmount
      ? Number(revenueAggregation._sum.lastPaymentAmount)
      : 0;
    const rawSubscriptions = (plan as any).subscriptions || [];

    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      subtitle: plan.subtitle,
      billingInterval: plan.billingInterval,
      priceAmount: Number(plan.priceAmount),
      currency: plan.currency,
      trialDays: plan.trialDays,
      isPublic: plan.isPublic,
      isActive: plan.isActive,
      stripeProductId: plan.stripeProductId,
      stripePriceId: plan.stripePriceId,
      stripePriceIdMonthly: plan.stripePriceIdMonthly,
      stripePriceIdYearly: plan.stripePriceIdYearly,
      priceAmountMonthly: plan.priceAmountMonthly
        ? Number(plan.priceAmountMonthly)
        : null,
      priceAmountYearly: plan.priceAmountYearly
        ? Number(plan.priceAmountYearly)
        : null,
      maxUsers: plan.maxUsers,
      features: plan.features,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      stats: {
        totalSubscribers: activeSubscribersCount,
        activeSubscribers: activeSubscribersCount,
        churnedSubscribers: churnedCount,
        totalRevenue: totalRevenue,
      },
      recentSubscribers: rawSubscriptions.map((sub: any) => ({
        id: sub.id,
        name: sub.user?.email ? sub.user.email.split('@')[0] : 'Subscriber',
        email: sub.user?.email || 'No Email',
        subscribedAt: sub.createdAt,
        status: sub.status,
      })),
    };
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
        throw new BadRequestException(
          `Cannot update! Unique code "${dto.code}" is already taken by another tier`,
        );
      }
    }

    const billingProvider = dto.billingProvider ?? existing.billingProvider;
    const isStripe = billingProvider === BillingProvider.STRIPE;

    let stripeProductId = existing.stripeProductId;
    let stripePriceId = existing.stripePriceId;
    let stripePriceIdMonthly = existing.stripePriceIdMonthly;
    let stripePriceIdYearly = existing.stripePriceIdYearly;

    if (isStripe) {
      const name = dto.name ?? existing.name;
      const subtitle = dto.subtitle ?? existing.subtitle;
      const description = dto.description ?? existing.description;
      const currency = dto.currency ?? existing.currency;

      // 1. Check or Create Stripe Product
      if (!stripeProductId) {
        stripeProductId = await this.createStripeProduct(
          name,
          subtitle || description || undefined,
          dto.code ?? existing.code,
        );
      } else if (
        dto.name !== undefined ||
        dto.subtitle !== undefined ||
        dto.description !== undefined
      ) {
        await this.updateStripeProduct(
          stripeProductId,
          name,
          subtitle || description || undefined,
        );
      }

      // 2. Check priceAmount update
      const priceAmount =
        dto.priceAmount !== undefined
          ? dto.priceAmount
          : Number(existing.priceAmount);
      const billingInterval = dto.billingInterval ?? existing.billingInterval;
      const interval = billingInterval === 'YEARLY' ? 'year' : 'month';

      const priceAmountChanged =
        dto.priceAmount !== undefined &&
        dto.priceAmount !== Number(existing.priceAmount);
      const intervalChanged =
        dto.billingInterval !== undefined &&
        dto.billingInterval !== existing.billingInterval;
      const currencyChanged =
        dto.currency !== undefined && dto.currency !== existing.currency;

      if (
        priceAmount > 0 &&
        (!stripePriceId ||
          priceAmountChanged ||
          intervalChanged ||
          currencyChanged)
      ) {
        stripePriceId = await this.createStripePrice(
          stripeProductId,
          priceAmount,
          currency,
          interval,
        );
      }

      // 3. Check priceAmountMonthly update
      const priceAmountMonthly =
        dto.priceAmountMonthly !== undefined
          ? dto.priceAmountMonthly
          : existing.priceAmountMonthly
            ? Number(existing.priceAmountMonthly)
            : null;
      const monthlyPriceChanged =
        dto.priceAmountMonthly !== undefined &&
        dto.priceAmountMonthly !==
          (existing.priceAmountMonthly
            ? Number(existing.priceAmountMonthly)
            : null);

      if (
        priceAmountMonthly &&
        priceAmountMonthly > 0 &&
        (!stripePriceIdMonthly || monthlyPriceChanged || currencyChanged)
      ) {
        stripePriceIdMonthly = await this.createStripePrice(
          stripeProductId,
          priceAmountMonthly,
          currency,
          'month',
        );
      }

      // 4. Check priceAmountYearly update
      const priceAmountYearly =
        dto.priceAmountYearly !== undefined
          ? dto.priceAmountYearly
          : existing.priceAmountYearly
            ? Number(existing.priceAmountYearly)
            : null;
      const yearlyPriceChanged =
        dto.priceAmountYearly !== undefined &&
        dto.priceAmountYearly !==
          (existing.priceAmountYearly
            ? Number(existing.priceAmountYearly)
            : null);

      if (
        priceAmountYearly &&
        priceAmountYearly > 0 &&
        (!stripePriceIdYearly || yearlyPriceChanged || currencyChanged)
      ) {
        stripePriceIdYearly = await this.createStripePrice(
          stripeProductId,
          priceAmountYearly,
          currency,
          'year',
        );
      }
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.targetAudience !== undefined && {
          targetAudience: dto.targetAudience,
        }),
        ...(dto.billingProvider !== undefined && {
          billingProvider: dto.billingProvider,
        }),
        ...(dto.billingInterval !== undefined && {
          billingInterval: dto.billingInterval,
        }),
        ...(dto.currency !== undefined && {
          currency: this.normalizeCurrency(dto.currency),
        }),
        ...(dto.priceAmount !== undefined && {
          priceAmount: new Prisma.Decimal(dto.priceAmount),
        }),
        ...(dto.isPerUser !== undefined && { isPerUser: dto.isPerUser }),
        ...(dto.trialDays !== undefined && { trialDays: dto.trialDays }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
        stripeProductId,
        stripePriceId,
        stripePriceIdMonthly,
        stripePriceIdYearly,
        ...(dto.priceAmountMonthly !== undefined && {
          priceAmountMonthly:
            dto.priceAmountMonthly !== null
              ? new Prisma.Decimal(dto.priceAmountMonthly)
              : null,
        }),
        ...(dto.priceAmountYearly !== undefined && {
          priceAmountYearly:
            dto.priceAmountYearly !== null
              ? new Prisma.Decimal(dto.priceAmountYearly)
              : null,
        }),
        ...(dto.features !== undefined && { features: dto.features as any }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    });

    this.audit(
      null,
      'PLAN',
      id,
      'UPDATE',
      { name: existing.name },
      { name: updated.name },
    );
    return updated;
  }

  async updateStatus(id: string, dto: UpdatePlanStatusDto) {
    const existing = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });

    this.audit(
      null,
      'PLAN',
      id,
      'UPDATE',
      { isActive: existing.isActive },
      { isActive: updated.isActive },
    );
    return updated;
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

    this.audit(null, 'PLAN', id, 'DELETE', { name: existing.name }, undefined);
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
          subtitle: true,
          targetAudience: true,
          billingProvider: true,
          billingInterval: true,
          currency: true,
          priceAmount: true,
          isActive: true,
          isPerUser: true,
          trialDays: true,
          isFeatured: true,
          sortOrder: true,
          maxUsers: true,
          priceAmountMonthly: true,
          priceAmountYearly: true,
          stripeProductId: true,
          stripePriceId: true,
          stripePriceIdMonthly: true,
          stripePriceIdYearly: true,
          features: true,
          metadata: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { priceAmount: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.plan.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
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
        subtitle: true,
        targetAudience: true,
        billingProvider: true,
        billingInterval: true,
        currency: true,
        priceAmount: true,
        isPerUser: true,
        trialDays: true,
        isFeatured: true,
        sortOrder: true,
        maxUsers: true,
        priceAmountMonthly: true,
        priceAmountYearly: true,
        stripeProductId: true,
        stripePriceId: true,
        stripePriceIdMonthly: true,
        stripePriceIdYearly: true,
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
