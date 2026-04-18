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
import { ContentAssetService } from './content-asset.service';
import { CreateContentAssetDto } from './dto/create-content-asset.dto';
import { UpdateContentAssetDto } from './dto/update-content-asset.dto';
import { QueryContentAssetDto } from './dto/query-content-asset.dto';
import { ReorderContentAssetDto } from './dto/reorder-content-asset.dto';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';


@ApiTags('Content Assets')
@Controller()
export class ContentAssetController {
  constructor(private readonly service: ContentAssetService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Post('admin/content-assets')
  @ApiOperation({ summary: 'Create content asset' })
  async create(@Body() dto: CreateContentAssetDto) {
    const data = await this.service.create(dto);

    return {
      statusCode: 201,
      message: 'Content asset created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Get('admin/content-assets')
  @ApiOperation({ summary: 'Get admin content assets' })
  async findAdminAll(@Query() query: QueryContentAssetDto) {
    const data = await this.service.findAdminAll(query);

    return {
      statusCode: 200,
      message: 'Content assets fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Get('admin/content-assets/:id')
  @ApiOperation({ summary: 'Get content asset details' })
  async findAdminOne(@Param('id') id: string) {
    const data = await this.service.findAdminOne(id);

    return {
      statusCode: 200,
      message: 'Content asset fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/content-assets/:id')
  @ApiOperation({ summary: 'Update content asset' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentAssetDto,
  ) {
    const data = await this.service.update(id, dto);

    return {
      statusCode: 200,
      message: 'Content asset updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Delete('admin/content-assets/:id')
  @ApiOperation({ summary: 'Delete content asset' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Content asset deleted successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/content/:contentItemId/assets/reorder')
  @ApiOperation({ summary: 'Reorder content assets' })
  async reorder(
    @Param('contentItemId') contentItemId: string,
    @Body() dto: ReorderContentAssetDto,
  ) {
    const data = await this.service.reorder(contentItemId, dto.assetIds);

    return {
      statusCode: 200,
      message: 'Content assets reordered successfully',
      data,
    };
  }

  @Get('content/:slug/assets')
  @ApiOperation({ summary: 'Get public content assets by content slug' })
  async findPublicByContentSlug(@Param('slug') slug: string) {
    const data = await this.service.findPublicByContentSlug(slug);

    return {
      statusCode: 200,
      message: 'Content assets fetched successfully',
      data,
    };
  }

  @Get('content/:slug/assets/preview')
  @ApiOperation({ summary: 'Get preview assets by content slug' })
  async findPublicPreviewAssets(@Param('slug') slug: string) {
    const data = await this.service.findPublicPreviewAssetsByContentSlug(slug);

    return {
      statusCode: 200,
      message: 'Preview assets fetched successfully',
      data,
    };
  }
}