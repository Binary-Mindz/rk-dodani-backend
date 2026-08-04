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
import { ProductSubmissionService } from './product-submission.service';
import { CreateProductSubmissionDto } from './dto/create-product-submission.dto';
import { UpdateProductSubmissionDto } from './dto/update-product-submission.dto';
import { QueryProductSubmissionDto } from './dto/query-product-submission.dto';

@ApiTags('Product Submissions')
@Controller()
export class ProductSubmissionController {
  constructor(private readonly productSubmissionService: ProductSubmissionService) {}

  @Post('product-submissions')
  @ApiOperation({ summary: 'Submit a new product request' })
  async create(@Body() dto: CreateProductSubmissionDto) {
    const data = await this.productSubmissionService.create(dto);
    return {
      statusCode: 201,
      message: 'Product submission created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/product-submissions')
  @ApiOperation({ summary: 'Get all product submissions (Admin)' })
  async findAll(@Query() query: QueryProductSubmissionDto) {
    const data = await this.productSubmissionService.findAll(query);
    return {
      statusCode: 200,
      message: 'Product submissions fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/product-submissions/:id')
  @ApiOperation({ summary: 'Get product submission details by ID (Admin)' })
  async findOne(@Param('id') id: string) {
    const data = await this.productSubmissionService.findOne(id);
    return {
      statusCode: 200,
      message: 'Product submission fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch('admin/product-submissions/:id')
  @ApiOperation({ summary: 'Update a product submission (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductSubmissionDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.productSubmissionService.update(userId, id, dto);
    return {
      statusCode: 200,
      message: 'Product submission updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Delete('admin/product-submissions/:id')
  @ApiOperation({ summary: 'Delete a product submission (Admin)' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const data = await this.productSubmissionService.remove(userId, id);
    return {
      statusCode: 200,
      message: 'Product submission deleted successfully',
      data,
    };
  }
}
