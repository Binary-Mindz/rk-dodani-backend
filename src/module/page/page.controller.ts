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
import { PageService } from './page.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { QueryAdminPageDto } from './dto/query-admin-page.dto';
import { QueryPublicPageDto } from './dto/query-public-page.dto';
import { UpdatePageStatusDto } from './dto/update-page-status.dto';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';

@ApiTags('Pages')
@Controller()
export class PageController {
  constructor(private readonly service: PageService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Post('admin/pages')
  @ApiOperation({ summary: 'Create page' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreatePageDto) {
    const data = await this.service.create(userId, dto);

    return {
      statusCode: 201,
      message: 'Page created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Get('admin/pages')
  @ApiOperation({ summary: 'Get admin pages' })
  async findAdminAll(@Query() query: QueryAdminPageDto) {
    const data = await this.service.findAdminAll(query);

    return {
      statusCode: 200,
      message: 'Pages fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Get('admin/pages/:id')
  @ApiOperation({ summary: 'Get admin page details' })
  async findAdminOne(@Param('id') id: string) {
    const data = await this.service.findAdminOne(id);

    return {
      statusCode: 200,
      message: 'Page fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/pages/:id')
  @ApiOperation({ summary: 'Update page' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
  ) {
    const data = await this.service.update(userId, id, dto);

    return {
      statusCode: 200,
      message: 'Page updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/pages/:id/status')
  @ApiOperation({ summary: 'Update page status' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePageStatusDto,
  ) {
    const data = await this.service.updateStatus(null, id, dto);

    return {
      statusCode: 200,
      message: 'Page status updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Delete('admin/pages/:id')
  @ApiOperation({ summary: 'Delete page' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Page deleted successfully',
      data,
    };
  }

  @Get('pages')
  @ApiOperation({ summary: 'Get public page list' })
  async findPublicAll(@Query() query: QueryPublicPageDto) {
    const data = await this.service.findPublicAll(query);

    return {
      statusCode: 200,
      message: 'Pages fetched successfully',
      data,
    };
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get public page by slug' })
  async findPublicBySlug(@Param('slug') slug: string) {
    const data = await this.service.findPublicBySlug(slug);

    return {
      statusCode: 200,
      message: 'Page fetched successfully',
      data,
    };
  }
}
