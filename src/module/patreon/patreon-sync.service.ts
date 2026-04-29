import { Injectable } from '@nestjs/common';
import {
  EntitlementSourceType,
  EntitlementStatus,
  EntitlementType,
  Prisma,
  PatreonConnection,
} from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';


@Injectable()
export class PatreonSyncService {
  constructor(private readonly prisma: PrismaService) {}

  private extractMembership(identity: any) {
    const included = Array.isArray(identity?.included) ? identity.included : [];

    const member = included.find((item: any) => item.type === 'member');

    const tiers = included.filter((item: any) => item.type === 'tier');

    const topTier = tiers.sort(
      (a: any, b: any) =>
        (b?.attributes?.amount_cents ?? 0) -
        (a?.attributes?.amount_cents ?? 0),
    )[0];

    return { member, topTier };
  }

  private isActivePatron(status?: string | null, tierId?: string | null) {
    const normalized = String(status ?? '').toLowerCase();

    return (
      normalized === 'active_patron' ||
      normalized === 'paid_patron' ||
      Boolean(tierId)
    );
  }

  async syncConnection(params: {
    userId: string;
    tokenPayload: any;
    identityPayload: any;
  }) {
    const { userId, tokenPayload, identityPayload } = params;

    const userData = identityPayload?.data;
    const attrs = userData?.attributes ?? {};
    const { member, topTier } = this.extractMembership(identityPayload);

    const patreonUserId = String(userData?.id);
    const patreonEmail = attrs?.email ?? null;

    const membershipStatus =
      member?.attributes?.patron_status ??
      member?.attributes?.last_charge_status ??
      null;

    const tierId = topTier?.id ?? null;
    const tierTitle = topTier?.attributes?.title ?? null;

    const pledgeAmountCents =
      topTier?.attributes?.amount_cents ??
      member?.attributes?.currently_entitled_amount_cents ??
      null;

    const tokenExpiresAt = tokenPayload?.expires_in
      ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000)
      : null;

    const isActive = this.isActivePatron(membershipStatus, tierId);

    const connection = await this.prisma.patreonConnection.upsert({
      where: { userId },
      update: {
        patreonUserId,
        patreonEmail,
        accessTokenEncrypted: tokenPayload.access_token,
        refreshTokenEncrypted: tokenPayload.refresh_token ?? null,
        tokenExpiresAt,
        membershipStatus,
        patreonTierId: tierId,
        patreonTierTitle: tierTitle,
        pledgeAmountCents,
        lastVerifiedAt: new Date(),
        lastSyncStatus: 'SUCCESS',
        lastSyncError: null,
        rawProfile: identityPayload as Prisma.InputJsonValue,
        isActive,
      },
      create: {
        userId,
        patreonUserId,
        patreonEmail,
        accessTokenEncrypted: tokenPayload.access_token,
        refreshTokenEncrypted: tokenPayload.refresh_token ?? null,
        tokenExpiresAt,
        membershipStatus,
        patreonTierId: tierId,
        patreonTierTitle: tierTitle,
        pledgeAmountCents,
        lastVerifiedAt: new Date(),
        lastSyncStatus: 'SUCCESS',
        lastSyncError: null,
        rawProfile: identityPayload as Prisma.InputJsonValue,
        isActive,
      },
    });

    await this.syncEntitlement(connection);

    return connection;
  }

  async syncEntitlement(connection: PatreonConnection) {
    const existing = await this.prisma.entitlement.findFirst({
      where: {
        userId: connection.userId,
        sourceType: EntitlementSourceType.PATREON,
        sourceId: connection.id,
        entitlementType: EntitlementType.PREMIUM_ACCESS,
      },
    });

    if (!existing) {
      return this.prisma.entitlement.create({
        data: {
          userId: connection.userId,
          sourceType: EntitlementSourceType.PATREON,
          sourceId: connection.id,
          entitlementType: EntitlementType.PREMIUM_ACCESS,
          status: connection.isActive
            ? EntitlementStatus.ACTIVE
            : EntitlementStatus.PENDING,
          startsAt: connection.isActive ? new Date() : null,
          reason: connection.patreonTierTitle
            ? `Patreon tier: ${connection.patreonTierTitle}`
            : 'Patreon membership entitlement',
          metadata: {
            tierId: connection.patreonTierId,
            tierTitle: connection.patreonTierTitle,
            pledgeAmountCents: connection.pledgeAmountCents,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return this.prisma.entitlement.update({
      where: { id: existing.id },
      data: {
        status: connection.isActive
          ? EntitlementStatus.ACTIVE
          : EntitlementStatus.REVOKED,
        startsAt: connection.isActive
          ? existing.startsAt ?? new Date()
          : existing.startsAt,
        revokedAt: connection.isActive ? null : new Date(),
        reason: connection.patreonTierTitle
          ? `Patreon tier: ${connection.patreonTierTitle}`
          : 'Patreon membership entitlement',
        metadata: {
          tierId: connection.patreonTierId,
          tierTitle: connection.patreonTierTitle,
          pledgeAmountCents: connection.pledgeAmountCents,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async disconnect(userId: string) {
    const connection = await this.prisma.patreonConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return { disconnected: true };
    }

    await this.prisma.patreonConnection.update({
      where: { userId },
      data: {
        isActive: false,
        lastSyncStatus: 'DISCONNECTED',
      },
    });

    await this.prisma.entitlement.updateMany({
      where: {
        userId,
        sourceType: EntitlementSourceType.PATREON,
      },
      data: {
        status: EntitlementStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    return { disconnected: true };
  }
}