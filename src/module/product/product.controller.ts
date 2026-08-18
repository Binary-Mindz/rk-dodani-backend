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
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller()
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get('products')
  @ApiOperation({ summary: 'Get all products (Public)' })
  async findAllPublic(@Query() query: QueryProductDto) {
    const data = await this.service.findAll(query, true);
    return {
      statusCode: 200,
      message: 'Products fetched successfully',
      data,
    };
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details by ID (Public)' })
  async findOnePublic(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: 200,
      message: 'Product fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Post('admin/products')
  @ApiOperation({ summary: 'Create a new product' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    const data = await this.service.create(userId, dto);
    return {
      statusCode: 201,
      message: 'Product created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/products')
  @ApiOperation({ summary: 'Get all products for admin' })
  async findAllAdmin(@Query() query: QueryProductDto) {
    const data = await this.service.findAll(query);
    return {
      statusCode: 200,
      message: 'Products fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/products/:id')
  @ApiOperation({ summary: 'Get product details for admin' })
  async findOneAdmin(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: 200,
      message: 'Product fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch('admin/products/:id')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const data = await this.service.update(userId, id, dto);
    return {
      statusCode: 200,
      message: 'Product updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Delete('admin/products/:id')
  @ApiOperation({ summary: 'Delete a product' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.service.remove(userId, id);
    return {
      statusCode: 200,
      message: 'Product deleted successfully',
      data,
    };
  }
}
