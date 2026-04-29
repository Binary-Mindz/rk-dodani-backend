import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateContentAssetDto } from './dto/create-content-asset.dto';
import { UpdateContentAssetDto } from './dto/update-content-asset.dto';
import { QueryContentAssetDto } from './dto/query-content-asset.dto';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ContentAssetService {
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

  async create(dto: CreateContentAssetDto) {
    await this.ensureContentExists(dto.contentItemId);

    return this.prisma.contentAsset.create({
      data: {
        contentItemId: dto.contentItemId,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName ?? null,
        mimeType: dto.mimeType ?? null,
        size: dto.size ?? null,
        assetRole: dto.assetRole,
        title: dto.title ?? null,
        description: dto.description ?? null,
        displayOrder: dto.displayOrder ?? 0,
        isDownloadable: dto.isDownloadable ?? true,
        isPreviewOnly: dto.isPreviewOnly ?? false,
        accessOverride: dto.accessOverride ?? null,
      },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }

  async findAdminAll(query: QueryContentAssetDto) {
    return this.prisma.contentAsset.findMany({
      where: {
        ...(query.contentItemId ? { contentItemId: query.contentItemId } : {}),
        ...(query.assetRole ? { assetRole: query.assetRole } : {}),
        contentItem: {
          deletedAt: null,
        },
      },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findAdminOne(id: string) {
    const asset = await this.prisma.contentAsset.findUnique({
      where: { id },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Content asset not found');
    }

    if (asset.contentItem.status && asset.contentItem.id) {
      return asset;
    }

    return asset;
  }

  async update(id: string, dto: UpdateContentAssetDto) {
    const existing = await this.prisma.contentAsset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Content asset not found');
    }

    if (dto.contentItemId) {
      await this.ensureContentExists(dto.contentItemId);
    }

    return this.prisma.contentAsset.update({
      where: { id },
      data: {
        ...(dto.contentItemId !== undefined && {
          contentItemId: dto.contentItemId,
        }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        ...(dto.fileName !== undefined && { fileName: dto.fileName }),
        ...(dto.mimeType !== undefined && { mimeType: dto.mimeType }),
        ...(dto.size !== undefined && { size: dto.size }),
        ...(dto.assetRole !== undefined && { assetRole: dto.assetRole }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.displayOrder !== undefined && {
          displayOrder: dto.displayOrder,
        }),
        ...(dto.isDownloadable !== undefined && {
          isDownloadable: dto.isDownloadable,
        }),
        ...(dto.isPreviewOnly !== undefined && {
          isPreviewOnly: dto.isPreviewOnly,
        }),
        ...(dto.accessOverride !== undefined && {
          accessOverride: dto.accessOverride,
        }),
      },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contentAsset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Content asset not found');
    }

    await this.prisma.contentAsset.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async findPublicByContentSlug(slug: string) {
    const content = await this.prisma.contentItem.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: PublishStatus.PUBLISHED,
        publishedAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        accessModel: true,
        visibility: true,
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const assets = await this.prisma.contentAsset.findMany({
      where: {
        contentItemId: content.id,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      content,
      assets,
    };
  }

  async findPublicPreviewAssetsByContentSlug(slug: string) {
    const content = await this.prisma.contentItem.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: PublishStatus.PUBLISHED,
        publishedAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const assets = await this.prisma.contentAsset.findMany({
      where: {
        contentItemId: content.id,
        OR: [
          { isPreviewOnly: true },
          { assetRole: 'PREVIEW_FILE' },
        ],
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      content,
      assets,
    };
  }

  async reorder(contentItemId: string, assetIds: string[]) {
    await this.ensureContentExists(contentItemId);

    const assets = await this.prisma.contentAsset.findMany({
      where: { contentItemId },
      select: { id: true },
    });

    const existingIds = new Set(assets.map((item) => item.id));

    for (const assetId of assetIds) {
      if (!existingIds.has(assetId)) {
        throw new BadRequestException(
          `Asset ${assetId} does not belong to this content item`,
        );
      }
    }

    await this.prisma.$transaction(
      assetIds.map((assetId, index) =>
        this.prisma.contentAsset.update({
          where: { id: assetId },
          data: { displayOrder: index },
        }),
      ),
    );

    return this.prisma.contentAsset.findMany({
      where: { contentItemId },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }
}