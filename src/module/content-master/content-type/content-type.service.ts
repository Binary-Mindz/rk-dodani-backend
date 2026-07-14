import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateContentTypeDto, UpdateContentTypeDto } from './dto/content-type.dto';

@Injectable()
export class ContentTypeService {
  constructor(private readonly prisma: PrismaService) { }

  // create content type
  async createContentTypeIntoDb(data: CreateContentTypeDto) {
    // check if code already exist
    const isCodeExist = await this.prisma.contentType.findFirst({
      where: { code: data.code }
    })

    if (isCodeExist) {
      throw new BadRequestException("Code already exist!")
    }
    const result = await this.prisma.contentType.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description
      }
    })
    return result
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
      where: { id }
    })

    if (!isContentTypeExist) {
      throw new BadRequestException("Content Type not found!!!")
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
    return result

  }


  // delete content type
  async deleteContentTypeFromDb(id: string) {
    // check content type exist or not
    const isContentTypeExist = await this.prisma.contentType.findFirst({
      where: { id }
    })

    if (!isContentTypeExist) {
      throw new BadRequestException("Content Type not found!!!")
    }

    const result = await this.prisma.contentType.delete({ where: { id } })
    return result
  }
}