import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccessRuleOperator,
  AccessRuleType,
  ContentAccessModel,
  EntitlementStatus,
  EntitlementType,
  Prisma,
  PublishStatus,
} from '@prisma/client';
import { CreateContentAccessRuleDto } from './dto/create-content-access-rule.dto';
import { UpdateContentAccessRuleDto } from './dto/update-content-access-rule.dto';
import { QueryContentAccessRuleDto } from './dto/query-content-access-rule.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ContentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureContentExists(contentItemId: string) {
    const content = await this.prisma.contentItem.findFirst({
      where: {
        id: contentItemId,
        deletedAt: null,
      },
    });

    if (!content) {
      throw new BadRequestException('Content item not found');
    }

    return content;
  }

  async createRule(dto: CreateContentAccessRuleDto) {
    await this.ensureContentExists(dto.contentItemId);

    return this.prisma.contentAccessRule.create({
      data: {
        contentItemId: dto.contentItemId,
        ruleType: dto.ruleType,
        operator: dto.operator,
        ruleValue: dto.ruleValue,
        priority: dto.priority ?? 0,
        allowAccess: dto.allowAccess ?? true,
        message: dto.message ?? null,
        isActive: dto.isActive ?? true,
      },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            accessModel: true,
          },
        },
      },
    });
  }

  async findRules(query: QueryContentAccessRuleDto) {
    return this.prisma.contentAccessRule.findMany({
      where: {
        ...(query.contentItemId ? { contentItemId: query.contentItemId } : {}),
        ...(query.ruleType ? { ruleType: query.ruleType } : {}),
        ...(typeof query.isActive === 'boolean'
          ? { isActive: query.isActive }
          : {}),
      },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            accessModel: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findRuleById(id: string) {
    const rule = await this.prisma.contentAccessRule.findUnique({
      where: { id },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            accessModel: true,
          },
        },
      },
    });

    if (!rule) {
      throw new NotFoundException('Content access rule not found');
    }

    return rule;
  }

  async updateRule(id: string, dto: UpdateContentAccessRuleDto) {
    const existing = await this.prisma.contentAccessRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Content access rule not found');
    }

    if (dto.contentItemId) {
      await this.ensureContentExists(dto.contentItemId);
    }

    return this.prisma.contentAccessRule.update({
      where: { id },
      data: {
        ...(dto.contentItemId !== undefined && {
          contentItemId: dto.contentItemId,
        }),
        ...(dto.ruleType !== undefined && {
          ruleType: dto.ruleType,
        }),
        ...(dto.operator !== undefined && {
          operator: dto.operator,
        }),
        ...(dto.ruleValue !== undefined && {
          ruleValue: dto.ruleValue as Prisma.InputJsonValue,
        }),
        ...(dto.priority !== undefined && {
          priority: dto.priority,
        }),
        ...(dto.allowAccess !== undefined && {
          allowAccess: dto.allowAccess,
        }),
        ...(dto.message !== undefined && {
          message: dto.message,
        }),
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
        }),
      },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            accessModel: true,
          },
        },
      },
    });
  }

  async removeRule(id: string) {
    const existing = await this.prisma.contentAccessRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Content access rule not found');
    }

    await this.prisma.contentAccessRule.delete({
      where: { id },
    });

    return { deleted: true };
  }

  private async getActiveEntitlements(userId: string) {
    const now = new Date();

    return this.prisma.entitlement.findMany({
      where: {
        userId,
        status: EntitlementStatus.ACTIVE,
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
    });
  }

  private evaluateOperator(
    operator: AccessRuleOperator,
    actualValue: string | null,
    expectedValue: any,
  ): boolean {
    if (operator === AccessRuleOperator.EXISTS) {
      return actualValue !== null && actualValue !== undefined;
    }

    if (operator === AccessRuleOperator.EQUALS) {
      return actualValue === String(expectedValue);
    }

    if (operator === AccessRuleOperator.NOT_EQUALS) {
      return actualValue !== String(expectedValue);
    }

    if (operator === AccessRuleOperator.IN) {
      return Array.isArray(expectedValue)
        ? expectedValue.map(String).includes(String(actualValue))
        : false;
    }

    if (operator === AccessRuleOperator.NOT_IN) {
      return Array.isArray(expectedValue)
        ? !expectedValue.map(String).includes(String(actualValue))
        : true;
    }

    return false;
  }

  private async evaluateRules(
    userId: string | null,
    contentId: string,
  ): Promise<{
    allowed: boolean;
    reason: string;
    matchedRule: any | null;
  }> {
    const rules = await this.prisma.contentAccessRule.findMany({
      where: {
        contentItemId: contentId,
        isActive: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    if (!rules.length) {
      return {
        allowed: true,
        reason: 'No active custom rules found',
        matchedRule: null,
      };
    }

    if (!userId) {
      const denyRule = rules.find((rule) => !rule.allowAccess);
      return {
        allowed: !denyRule,
        reason:
          denyRule?.message ?? 'You must be logged in to evaluate access rules',
        matchedRule: denyRule ?? null,
      };
    }

    const entitlements = await this.getActiveEntitlements(userId);

    for (const rule of rules) {
      let matched = false;

      if (rule.ruleType === AccessRuleType.SUBSCRIPTION_STATUS) {
        const expected =
          typeof rule.ruleValue === 'object' &&
          rule.ruleValue &&
          'value' in (rule.ruleValue as Record<string, any>)
            ? (rule.ruleValue as Record<string, any>).value
            : rule.ruleValue;

        const hasSubscriptionEntitlement = entitlements.some(
          (item) =>
            item.entitlementType === EntitlementType.PLAN_ACCESS ||
            item.entitlementType === EntitlementType.PREMIUM_ACCESS,
        );

        matched = this.evaluateOperator(
          rule.operator,
          hasSubscriptionEntitlement ? 'ACTIVE' : 'INACTIVE',
          expected,
        );
      }

      if (rule.ruleType === AccessRuleType.PLAN) {
        const expected =
          typeof rule.ruleValue === 'object' &&
          rule.ruleValue &&
          'value' in (rule.ruleValue as Record<string, any>)
            ? (rule.ruleValue as Record<string, any>).value
            : rule.ruleValue;

        const userPlanCodes = await this.prisma.plan.findMany({
          where: {
            id: {
              in: entitlements
                .filter((item) => item.planId)
                .map((item) => item.planId!)
            },
          },
          select: { code: true },
        });

        const codes = userPlanCodes.map((p) => p.code);

        matched = this.evaluateOperator(
          rule.operator,
          codes[0] ?? null,
          Array.isArray(expected) ? expected : expected,
        );

        if (
          rule.operator === AccessRuleOperator.IN ||
          rule.operator === AccessRuleOperator.NOT_IN
        ) {
          matched = Array.isArray(expected)
            ? codes.some((code) => expected.map(String).includes(String(code)))
            : false;

          if (rule.operator === AccessRuleOperator.NOT_IN) {
            matched = !matched;
          }
        }
      }

      if (rule.ruleType === AccessRuleType.PATREON_TIER) {
        const expected =
          typeof rule.ruleValue === 'object' &&
          rule.ruleValue &&
          'value' in (rule.ruleValue as Record<string, any>)
            ? (rule.ruleValue as Record<string, any>).value
            : rule.ruleValue;

        const connection = await this.prisma.patreonConnection.findUnique({
          where: { userId },
          select: {
            isActive: true,
            patreonTierTitle: true,
            membershipStatus: true,
          },
        });

        const activeTier =
          connection?.isActive && connection?.membershipStatus
            ? connection.patreonTierTitle
            : null;

        matched = this.evaluateOperator(rule.operator, activeTier, expected);
      }

      if (rule.ruleType === AccessRuleType.ROLE) {
        const expected =
          typeof rule.ruleValue === 'object' &&
          rule.ruleValue &&
          'value' in (rule.ruleValue as Record<string, any>)
            ? (rule.ruleValue as Record<string, any>).value
            : rule.ruleValue;

        const roles = await this.prisma.userRole.findMany({
          where: {
            userId,
            isActive: true,
          },
          include: {
            role: true,
          },
        });

        const roleCodes = roles.map((r) => r.role.code);

        if (
          rule.operator === AccessRuleOperator.IN ||
          rule.operator === AccessRuleOperator.NOT_IN
        ) {
          matched = Array.isArray(expected)
            ? roleCodes.some((code) =>
                expected.map(String).includes(String(code)),
              )
            : false;

          if (rule.operator === AccessRuleOperator.NOT_IN) {
            matched = !matched;
          }
        } else {
          matched = this.evaluateOperator(
            rule.operator,
            roleCodes[0] ?? null,
            expected,
          );
        }
      }

      if (rule.ruleType === AccessRuleType.CUSTOM) {
        matched = true;
      }

      if (matched) {
        return {
          allowed: rule.allowAccess,
          reason:
            rule.message ??
            (rule.allowAccess
              ? 'Access granted by custom rule'
              : 'Access denied by custom rule'),
          matchedRule: rule,
        };
      }
    }

    const denyRule = rules.find((rule) => !rule.allowAccess);

    return {
      allowed: !denyRule,
      reason:
        denyRule?.message ?? 'No matching rule granted access to this content',
      matchedRule: denyRule ?? null,
    };
  }

  async checkAccess(contentSlug: string, userId: string | null) {
    const content = await this.prisma.contentItem.findFirst({
      where: {
        slug: contentSlug,
        deletedAt: null,
        status: PublishStatus.PUBLISHED,
        publishedAt: {
          lte: new Date(),
        },
      },
      include: {
        contentType: true,
        accessRules: {
          where: { isActive: true },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.accessModel === ContentAccessModel.PUBLIC) {
      return {
        allowed: true,
        reason: 'This content is public',
        content: {
          id: content.id,
          slug: content.slug,
          title: content.title,
          accessModel: content.accessModel,
          visibility: content.visibility,
          contentType: content.contentType,
        },
      };
    }

    if (content.accessModel === ContentAccessModel.AUTHENTICATED) {
      if (!userId) {
        return {
          allowed: false,
          reason: 'Login required to access this content',
          content: {
            id: content.id,
            slug: content.slug,
            title: content.title,
            accessModel: content.accessModel,
          },
        };
      }

      return {
        allowed: true,
        reason: 'Authenticated user access granted',
        content: {
          id: content.id,
          slug: content.slug,
          title: content.title,
          accessModel: content.accessModel,
        },
      };
    }

    if (
      content.accessModel === ContentAccessModel.PREMIUM ||
      content.accessModel === ContentAccessModel.TIER_BASED
    ) {
      if (!userId) {
        return {
          allowed: false,
          reason: 'Subscription required to access this content',
          content: {
            id: content.id,
            slug: content.slug,
            title: content.title,
            accessModel: content.accessModel,
          },
        };
      }

      const entitlements = await this.getActiveEntitlements(userId);

      const hasPremiumAccess = entitlements.some(
        (item) =>
          item.entitlementType === EntitlementType.PREMIUM_ACCESS ||
          item.entitlementType === EntitlementType.PLAN_ACCESS ||
          (item.entitlementType === EntitlementType.CONTENT_ACCESS &&
            item.contentItemId === content.id),
      );

      if (!hasPremiumAccess) {
        return {
          allowed: false,
          reason: 'Active premium entitlement required',
          content: {
            id: content.id,
            slug: content.slug,
            title: content.title,
            accessModel: content.accessModel,
          },
        };
      }

      if (content.accessModel === ContentAccessModel.TIER_BASED) {
        const ruleResult = await this.evaluateRules(userId, content.id);
        return {
          allowed: ruleResult.allowed,
          reason: ruleResult.reason,
          matchedRule: ruleResult.matchedRule,
          content: {
            id: content.id,
            slug: content.slug,
            title: content.title,
            accessModel: content.accessModel,
          },
        };
      }

      return {
        allowed: true,
        reason: 'Premium access granted',
        content: {
          id: content.id,
          slug: content.slug,
          title: content.title,
          accessModel: content.accessModel,
        },
      };
    }

    if (content.accessModel === ContentAccessModel.PATREON) {
      if (!userId) {
        return {
          allowed: false,
          reason: 'Patreon membership required',
          content: {
            id: content.id,
            slug: content.slug,
            title: content.title,
            accessModel: content.accessModel,
          },
        };
      }

      const patreonConnection = await this.prisma.patreonConnection.findUnique({
        where: { userId },
      });

      if (
        !patreonConnection ||
        !patreonConnection.isActive ||
        !patreonConnection.membershipStatus
      ) {
        return {
          allowed: false,
          reason: 'Active Patreon membership required',
          content: {
            id: content.id,
            slug: content.slug,
            title: content.title,
            accessModel: content.accessModel,
          },
        };
      }

      const ruleResult = await this.evaluateRules(userId, content.id);

      if (content.accessRules.length) {
        return {
          allowed: ruleResult.allowed,
          reason: ruleResult.reason,
          matchedRule: ruleResult.matchedRule,
          content: {
            id: content.id,
            slug: content.slug,
            title: content.title,
            accessModel: content.accessModel,
          },
        };
      }

      return {
        allowed: true,
        reason: 'Patreon access granted',
        content: {
          id: content.id,
          slug: content.slug,
          title: content.title,
          accessModel: content.accessModel,
        },
      };
    }

    if (content.accessModel === ContentAccessModel.CUSTOM) {
      const ruleResult = await this.evaluateRules(userId, content.id);

      return {
        allowed: ruleResult.allowed,
        reason: ruleResult.reason,
        matchedRule: ruleResult.matchedRule,
        content: {
          id: content.id,
          slug: content.slug,
          title: content.title,
          accessModel: content.accessModel,
        },
      };
    }

    return {
      allowed: false,
      reason: 'Access denied',
      content: {
        id: content.id,
        slug: content.slug,
        title: content.title,
        accessModel: content.accessModel,
      },
    };
  }

  async getAccessibleContentBySlug(contentSlug: string, userId: string | null) {
    const access = await this.checkAccess(contentSlug, userId);

    if (!access.allowed) {
      return access;
    }

    const content = await this.prisma.contentItem.findFirst({
      where: {
        slug: contentSlug,
        deletedAt: null,
        status: PublishStatus.PUBLISHED,
        publishedAt: {
          lte: new Date(),
        },
      },
      include: {
        contentType: true,
        primaryAuthor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        contentCategories: {
          include: {
            category: true,
          },
        },
        contentTags: {
          include: {
            tag: true,
          },
        },
        accessRules: {
          where: { isActive: true },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.contentItem.update({
      where: { id: content.id },
      data: {
        viewCount: {
          increment: BigInt(1),
        },
      },
    });

    return {
      allowed: true,
      reason: access.reason,
      content,
    };
  }
}