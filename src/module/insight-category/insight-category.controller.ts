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
import { UserRoleCode } from '@prisma/client';
import { Roles } from 'common/decorators/roles.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { CreateInsightCategoryDto } from './dto/create-insight-category.dto';
import { QueryInsightCategoryDto } from './dto/query-insight-category.dto';
import { UpdateInsightCategoryDto } from './dto/update-insight-category.dto';
import { InsightCategoryService } from './insight-category.service';

@ApiTags('Insight Categories')
@Controller()
export class InsightCategoryController {
  constructor(private readonly service: InsightCategoryService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Post('admin/insight-categories')
  @ApiOperation({ summary: 'Create insight category' })
  async create(@Body() dto: CreateInsightCategoryDto) {
    const data = await this.service.create(dto);

    return {
      statusCode: 201,
      message: 'Insight category created successfully',
      data,
    };
  }

  @Get('insight-categories')
  @ApiOperation({ summary: 'Get all insight categories' })
  async findAll(@Query() query: QueryInsightCategoryDto) {
    const data = await this.service.findAll(query);

    return {
      statusCode: 200,
      message: 'Insight categories fetched successfully',
      data,
    };
  }

  @Get('insight-categories/:id')
  @ApiOperation({ summary: 'Get insight category details' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);

    return {
      statusCode: 200,
      message: 'Insight category fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/insight-categories')
  @ApiOperation({ summary: 'Get admin insight category list' })
  async findAdminAll(@Query() query: QueryInsightCategoryDto) {
    const data = await this.service.findAll(query);

    return {
      statusCode: 200,
      message: 'Insight categories fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/insight-categories/:id')
  @ApiOperation({ summary: 'Get admin insight category details' })
  async findAdminOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);

    return {
      statusCode: 200,
      message: 'Insight category fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch('admin/insight-categories/:id')
  @ApiOperation({ summary: 'Update insight category' })
  async update(@Param('id') id: string, @Body() dto: UpdateInsightCategoryDto) {
    const data = await this.service.update(id, dto);

    return {
      statusCode: 200,
      message: 'Insight category updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Delete('admin/insight-categories/:id')
  @ApiOperation({ summary: 'Delete insight category' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Insight category deleted successfully',
      data,
    };
  }
}
