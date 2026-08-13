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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import { OptionalJwtAuthGuard } from 'common/guards/optional-jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { TrackProgressDto } from './dto/track-progress.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { QueryBookmarksDto } from './dto/query-bookmarks.dto';

@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
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
  @Roles(UserRoleCode.SUPER_ADMIN)
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
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/content/stats')
  @ApiOperation({ summary: 'Get content statistics for dashboard cards' })
  async getStats() {
    const data = await this.service.getContentStats();

    return {
      statusCode: 200,
      message: 'Content statistics retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
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
  @Roles(UserRoleCode.SUPER_ADMIN)
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
  @Roles(UserRoleCode.SUPER_ADMIN)
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
  @Roles(UserRoleCode.SUPER_ADMIN)
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
  @ApiOperation({
    summary: 'Get public content list with multiple content type filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Public content list fetched successfully.',
  })
  async findPublicAll(@Query() query: QueryPublicContentDto) {
    const data = await this.service.findPublicAll(query);

    return {
      statusCode: 200,
      message: 'Public content list fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('content/bookmarks')
  @ApiOperation({ summary: 'Get current user bookmarked content' })
  async getBookmarks(
    @CurrentUser('id') userId: string,
    @Query() query: QueryBookmarksDto,
  ) {
    const data = await this.service.getBookmarks(userId, query);

    return {
      statusCode: 200,
      message: 'Bookmarked content fetched successfully',
      data,
    };
  }

  @Get('content/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get public content details by slug' })
  async findPublicBySlug(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string | null,
  ) {
    const data = await this.service.findPublicBySlug(slug, userId ?? null);

    return {
      statusCode: 200,
      message: 'Content fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('content/:id/bookmark')
  @ApiOperation({ summary: 'Bookmark or unmark a content item' })
  async toggleBookmark(
    @CurrentUser('id') userId: string,
    @Param('id') contentItemId: string,
  ) {
    const data = await this.service.toggleBookmark(userId, contentItemId);

    return {
      statusCode: 200,
      message: data.isBookmarked
        ? 'Content bookmarked successfully'
        : 'Content unmarked successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('content/:id/track-progress')
  @ApiOperation({ summary: 'Track user progress and time spent on content' })
  async trackProgress(
    @CurrentUser('id') userId: string,
    @Param('id') contentItemId: string,
    @Body() dto: TrackProgressDto,
  ) {
    const data = await this.service.trackProgress(userId, contentItemId, dto);
    return {
      statusCode: 200,
      message: 'Progress tracked successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('content/:id/rate')
  @ApiOperation({
    summary: 'Submit or update user rating for a content item (1-5 stars)',
  })
  async rateContent(
    @CurrentUser('id') userId: string,
    @Param('id') contentItemId: string,
    @Body() dto: CreateRatingDto,
  ) {
    const data = await this.service.rateContent(userId, contentItemId, dto);
    return {
      statusCode: 200,
      message: 'Content rated successfully',
      data,
    };
  }

  @Get('content/:id/ratings')
  @ApiOperation({
    summary:
      'Get all ratings & reviews for a content item (average, distribution, list)',
  })
  async getRatings(@Param('id') contentItemId: string) {
    const data = await this.service.getRatings(contentItemId);
    return {
      statusCode: 200,
      message: 'Content ratings fetched successfully',
      data,
    };
  }
}
