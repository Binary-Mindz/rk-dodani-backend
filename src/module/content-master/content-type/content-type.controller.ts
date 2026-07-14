import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ContentTypeService } from './content-type.service';
import { CreateContentTypeDto, UpdateContentTypeDto } from './dto/content-type.dto';

@ApiTags('Content Types')
@Controller('content-types')
export class ContentTypeController {
  constructor(private readonly service: ContentTypeService) { }

  // create new content type
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Post()
  @ApiOperation({ description: "Code are : ARTICLE | WHITE_PAPER | CASE_STUDY | REPORT | PODCAST | VIDEO | RESEARCH_NOTE | MEDIA_POST", summary: "Create new Content Type -- Only for admin" })
  async createNewContentType(@Body() dto: CreateContentTypeDto) {
    const result = await this.service.createContentTypeIntoDb(dto)
    return {
      statusCode: 201,
      message: 'Content Type Create successful',
      data: result,
    }
  }


  // get all content type
  @Get()
  @ApiOperation({ summary: 'Get all content types --- public' })
  async getAll() {
    const data = await this.service.getAll();

    return {
      statusCode: 200,
      message: 'Content types fetched successfully',
      data,
    };
  }

  // update content type
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch(":id")
  @ApiOperation({ description: "Code are : ARTICLE | WHITE_PAPER | CASE_STUDY | REPORT | PODCAST | VIDEO | RESEARCH_NOTE | MEDIA_POST", summary: "Update Content Type -- Only for admin" })
  async updateContentType(@Param('id') id: string, @Body() dto: UpdateContentTypeDto) {
    const result = await this.service.updateContentTypeIntoDb(id, dto)
    return {
      statusCode: 201,
      message: 'Content Type update successful',
      data: result,
    }
  }

  // delete content type
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Delete(":id")
  @ApiOperation({ summary: "Delete Content Type -- Only for admin" })
  async deleteContentType(@Param('id') id: string) {
    const result = await this.service.deleteContentTypeFromDb(id)
    return {
      statusCode: 201,
      message: 'Content Type delete successful',
      data: result,
    }
  }
}