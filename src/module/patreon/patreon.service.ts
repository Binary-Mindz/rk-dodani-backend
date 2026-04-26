import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PatreonOAuthService } from './patreon-oauth.service';
import { PatreonSyncService } from './patreon-sync.service';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PatreonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oauth: PatreonOAuthService,
    private readonly sync: PatreonSyncService,
  ) {}

  getConnectUrl(userId: string) {
    return {
      url: this.oauth.getConnectUrl(userId),
    };
  }

  async handleCallback(query: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }) {
    if (query.error) {
      throw new BadRequestException(
        query.error_description ?? query.error,
      );
    }

    if (!query.code) {
      throw new BadRequestException('Missing Patreon code');
    }

    if (!query.state) {
      throw new BadRequestException('Missing OAuth state');
    }

    const userId = query.state;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokenPayload = await this.oauth.exchangeCodeForToken(query.code);

    const identityPayload = await this.oauth.fetchIdentity(
      tokenPayload.access_token,
    );

    const connection = await this.sync.syncConnection({
      userId,
      tokenPayload,
      identityPayload,
    });

    return {
      connected: true,
      connection,
      redirectUrl:
        process.env.PATREON_SUCCESS_REDIRECT ??
        'http://localhost:5173/account/patreon/success',
    };
  }

  async getMyStatus(userId: string) {
    const connection = await this.prisma.patreonConnection.findUnique({
      where: { userId },
    });

    const entitlements = await this.prisma.entitlement.findMany({
      where: {
        userId,
        sourceType: 'PATREON',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      isConnected: Boolean(connection),
      isActive: connection?.isActive ?? false,
      connection,
      entitlements,
    };
  }

  async refreshMyStatus(userId: string) {
    const connection = await this.prisma.patreonConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new NotFoundException('Patreon connection not found');
    }

    if (!connection.refreshTokenEncrypted) {
      throw new BadRequestException('Refresh token missing');
    }

    const tokenPayload = await this.oauth.refreshToken(
      connection.refreshTokenEncrypted,
    );

    const identityPayload = await this.oauth.fetchIdentity(
      tokenPayload.access_token,
    );

    const synced = await this.sync.syncConnection({
      userId,
      tokenPayload,
      identityPayload,
    });

    return {
      refreshed: true,
      connection: synced,
    };
  }

  async disconnect(userId: string) {
    return this.sync.disconnect(userId);
  }
}