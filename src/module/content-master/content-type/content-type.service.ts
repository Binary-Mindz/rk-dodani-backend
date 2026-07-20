import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateContentTypeDto,
  UpdateContentTypeDto,
} from './dto/content-type.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ContentTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private audit(
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
  ) {
    this.auditService
      .logCustom({
        actorUserId: null,
        entityType: 'CONTENT_TYPE',
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  // create content type
  async createContentTypeIntoDb(data: CreateContentTypeDto) {
    // check if code already exist
    const isCodeExist = await this.prisma.contentType.findFirst({
      where: { code: data.code },
    });

    if (isCodeExist) {
      throw new BadRequestException('Code already exist!');
    }
    const result = await this.prisma.contentType.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
      },
    });
    this.audit(result.id, 'CREATE', undefined, {
      name: result.name,
      code: result.code,
    });
    return result;
  }

  // get all content type
  async getAll() {
    return this.prisma.contentType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // update content type

  async updateContentTypeIntoDb(id: string, data: UpdateContentTypeDto) {
    // check content type exist or not
    const isContentTypeExist = await this.prisma.contentType.findFirst({
      where: { id },
    });

    if (!isContentTypeExist) {
      throw new BadRequestException('Content Type not found!!!');
    }

    const result = await this.prisma.contentType.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
    });
    this.audit(
      id,
      'UPDATE',
      { name: isContentTypeExist.name, code: isContentTypeExist.code },
      { name: result.name, code: result.code },
    );
    return result;
  }

  // delete content type
  async deleteContentTypeFromDb(id: string) {
    // check content type exist or not
    const isContentTypeExist = await this.prisma.contentType.findFirst({
      where: { id },
    });

    if (!isContentTypeExist) {
      throw new BadRequestException('Content Type not found!!!');
    }

    const result = await this.prisma.contentType.delete({ where: { id } });
    this.audit(
      id,
      'DELETE',
      { name: isContentTypeExist.name, code: isContentTypeExist.code },
      undefined,
    );
    return result;
  }
}
