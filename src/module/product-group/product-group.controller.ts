import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { QueryProductGroupDto } from './dto/query-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { ProductGroupService } from './product-group.service';

@ApiTags('Product Groups')

@Controller('admin/product-groups')
export class ProductGroupController {
  constructor(private readonly service: ProductGroupService) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create product group' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateProductGroupDto) {
    const data = await this.service.create(userId, dto);
    return { statusCode: 201, message: 'Product group created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get product groups' })
  async findAll(@Query() query: QueryProductGroupDto) {
    const data = await this.service.findAll(query);
    return { statusCode: 200, message: 'Product groups fetched successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product group by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { statusCode: 200, message: 'Product group fetched successfully', data };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update product group' })
  async update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateProductGroupDto) {
    const data = await this.service.update(userId, id, dto);
    return { statusCode: 200, message: 'Product group updated successfully', data };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete product group' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.service.remove(userId, id);
    return { statusCode: 200, message: 'Product group deleted successfully', data };
  }
}
