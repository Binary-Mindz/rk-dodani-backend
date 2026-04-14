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
import { PageService } from './page.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { QueryAdminPageDto } from './dto/query-admin-page.dto';
import { QueryPublicPageDto } from './dto/query-public-page.dto';
import { UpdatePageStatusDto } from './dto/update-page-status.dto';

// import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
// import { Roles } from 'src/shared/decorators/roles.decorator';
// import { UserRoleCode } from '@prisma/client';

@ApiTags('Pages')
@Controller()
export class PageController {
  constructor(private readonly service: PageService) {}

  @Post('admin/pages')
  @ApiOperation({ summary: 'Create page' })
  async create(
    // @CurrentUser() user: any,
    @Body() dto: CreatePageDto,
  ) {
    const data = await this.service.create(null, dto);

    return {
      statusCode: 201,
      message: 'Page created successfully',
      data,
    };
  }

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

  @Patch('admin/pages/:id')
  @ApiOperation({ summary: 'Update page' })
  async update(
    // @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
  ) {
    const data = await this.service.update(null, id, dto);

    return {
      statusCode: 200,
      message: 'Page updated successfully',
      data,
    };
  }

  @Patch('admin/pages/:id/status')
  @ApiOperation({ summary: 'Update page status' })
  async updateStatus(
    // @CurrentUser() user: any,
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