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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { CreatePageDto } from './dto/create-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { CurrentUser } from 'common/decorators/current-user.decorator';

@ApiTags('Pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('public')
  @ApiOperation({ summary: 'List published pages' })
  async findPublic(@Query() query: PageQueryDto) {
    return {
      message: 'Published pages retrieved successfully',
      data: await this.pagesService.findAll(query, true),
    };
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get published page by slug' })
  async findPublicBySlug(@Param('slug') slug: string) {
    return {
      message: 'Published page retrieved successfully',
      data: await this.pagesService.findBySlug(slug, true),
    };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN, UserRoleCode.EDITOR)
  @ApiOperation({ summary: 'List all pages for admin/editor' })
  async findAll(@Query() query: PageQueryDto) {
    return {
      message: 'Pages retrieved successfully',
      data: await this.pagesService.findAll(query, false),
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN, UserRoleCode.EDITOR)
  @ApiOperation({ summary: 'Create page' })
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreatePageDto,
  ) {
    return {
      message: 'Page created successfully',
      data: await this.pagesService.create(user.userId, dto),
    };
  }

  @Patch(':pageId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN, UserRoleCode.EDITOR)
  @ApiOperation({ summary: 'Update page' })
  async update(
    @Param('pageId') pageId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdatePageDto,
  ) {
    return {
      message: 'Page updated successfully',
      data: await this.pagesService.update(pageId, user.userId, dto),
    };
  }

  @Delete(':pageId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete page' })
  async remove(@Param('pageId') pageId: string) {
    return {
      message: 'Page deleted successfully',
      data: await this.pagesService.remove(pageId),
    };
  }
}