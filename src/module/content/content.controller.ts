import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryAdminContentDto } from './dto/query-admin-content.dto';
import { QueryPublicContentDto } from './dto/query-public-content.dto';
import { UpdateContentStatusDto } from './dto/update-content-status.dto';

// import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
// import { Roles } from 'src/shared/decorators/roles.decorator';
// import { UserRoleCode } from '@prisma/client';

@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Post('admin/content')
  @ApiOperation({ summary: 'Create content' })
  // @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  async create(
    // @CurrentUser() user: any,
    @Body() dto: CreateContentDto,
  ) {
    const data = await this.service.create(null, dto);

    return {
      statusCode: 201,
      message: 'Content created successfully',
      data,
    };
  }

  @Get('admin/content')
  @ApiOperation({ summary: 'Get admin content list' })
  async findAdminAll(@Query() query: QueryAdminContentDto) {
    const data = await this.service.findAdminAll(query);

    return {
      statusCode: 200,
      message: 'Admin content list fetched successfully',
      data,
    };
  }

  @Get('admin/content/:id')
  @ApiOperation({ summary: 'Get admin content details' })
  async findAdminOne(@Param('id') id: string) {
    const data = await this.service.findAdminOne(id);

    return {
      statusCode: 200,
      message: 'Content fetched successfully',
      data,
    };
  }

  @Patch('admin/content/:id')
  @ApiOperation({ summary: 'Update content' })
  async update(
    // @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    const data = await this.service.update(null, id, dto);

    return {
      statusCode: 200,
      message: 'Content updated successfully',
      data,
    };
  }

  @Patch('admin/content/:id/status')
  @ApiOperation({ summary: 'Update content status' })
  async updateStatus(
    // @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateContentStatusDto,
  ) {
    const data = await this.service.updateStatus(null, id, dto);

    return {
      statusCode: 200,
      message: 'Content status updated successfully',
      data,
    };
  }

  @Delete('admin/content/:id')
  @ApiOperation({ summary: 'Delete content (soft delete)' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Content deleted successfully',
      data,
    };
  }

  @Get('content')
  @ApiOperation({ summary: 'Get public content list' })
  async findPublicAll(@Query() query: QueryPublicContentDto) {
    const data = await this.service.findPublicAll(query);

    return {
      statusCode: 200,
      message: 'Public content list fetched successfully',
      data,
    };
  }

  @Get('content/:slug')
  @ApiOperation({ summary: 'Get public content details by slug' })
  async findPublicBySlug(@Param('slug') slug: string) {
    const data = await this.service.findPublicBySlug(slug);

    return {
      statusCode: 200,
      message: 'Content fetched successfully',
      data,
    };
  }
}