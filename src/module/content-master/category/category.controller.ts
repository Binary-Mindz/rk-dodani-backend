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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';

@ApiTags('Categories')
@Controller()
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Post('admin/categories')
  @ApiOperation({ summary: 'Create category' })
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.service.create(dto);

    return {
      statusCode: 201,
      message: 'Category created successfully',
      data,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async findAll(@Query() query: QueryCategoryDto) {
    const data = await this.service.findAll(query);

    return {
      statusCode: 200,
      message: 'Categories fetched successfully',
      data,
    };
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category details' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);

    return {
      statusCode: 200,
      message: 'Category fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/categories/:id')
  @ApiOperation({ summary: 'Update category' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const data = await this.service.update(id, dto);

    return {
      statusCode: 200,
      message: 'Category updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Delete('admin/categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Category deleted successfully',
      data,
    };
  }
}