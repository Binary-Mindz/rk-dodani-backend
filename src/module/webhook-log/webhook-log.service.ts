import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WebhookProcessingStatus, WebhookProvider } from '@prisma/client';
import { QueryWebhookLogDto } from './dto/query-webhook-log.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class WebhookLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryWebhookLogDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.WebhookLogWhereInput = {
      ...(query.provider ? { provider: query.provider } : {}),
      ...(query.processingStatus
        ? { processingStatus: query.processingStatus }
        : {}),
      ...(query.eventId ? { eventId: query.eventId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.webhookLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException('Webhook log not found');
    }

    return log;
  }
}