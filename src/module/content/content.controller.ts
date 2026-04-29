import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryAdminContentDto } from './dto/query-admin-content.dto';
import { QueryPublicContentDto } from './dto/query-public-content.dto';
import { UpdateContentStatusDto } from './dto/update-content-status.dto';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';

@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Post('admin/content')
  @ApiOperation({ summary: 'Create content' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContentDto,
  ) {
    const data = await this.service.create(userId, dto);

    return {
      statusCode: 201,
      message: 'Content created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/content/:id')
  @ApiOperation({ summary: 'Update content' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    const data = await this.service.update(userId, id, dto);

    return {
      statusCode: 200,
      message: 'Content updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/content/:id/status')
  @ApiOperation({ summary: 'Update content status' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentStatusDto,
  ) {
    const data = await this.service.updateStatus(userId, id, dto);

    return {
      statusCode: 200,
      message: 'Content status updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
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
