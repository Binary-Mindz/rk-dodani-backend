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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryAdminServiceDto } from './dto/query-admin-service.dto';
import { QueryPublicServiceDto } from './dto/query-public-service.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';

// import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
// import { Roles } from 'src/shared/decorators/roles.decorator';
// import { UserRoleCode } from '@prisma/client';

@ApiTags('Services')
@Controller()
export class ServiceController {
  constructor(private readonly service: ServiceService) {}

  @Post('admin/services')
  @ApiOperation({ summary: 'Create service' })
  async create(
    // @CurrentUser() user: any,
    @Body() dto: CreateServiceDto,
  ) {
    const data = await this.service.create(null, dto);

    return {
      statusCode: 201,
      message: 'Service created successfully',
      data,
    };
  }

  @Get('admin/services')
  @ApiOperation({ summary: 'Get admin services' })
  async findAdminAll(@Query() query: QueryAdminServiceDto) {
    const data = await this.service.findAdminAll(query);

    return {
      statusCode: 200,
      message: 'Services fetched successfully',
      data,
    };
  }

  @Get('admin/services/:id')
  @ApiOperation({ summary: 'Get admin service details' })
  async findAdminOne(@Param('id') id: string) {
    const data = await this.service.findAdminOne(id);

    return {
      statusCode: 200,
      message: 'Service fetched successfully',
      data,
    };
  }

  @Patch('admin/services/:id')
  @ApiOperation({ summary: 'Update service' })
  async update(
    // @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const data = await this.service.update(null, id, dto);

    return {
      statusCode: 200,
      message: 'Service updated successfully',
      data,
    };
  }

  @Patch('admin/services/:id/status')
  @ApiOperation({ summary: 'Update service status' })
  async updateStatus(
    // @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceStatusDto,
  ) {
    const data = await this.service.updateStatus(null, id, dto);

    return {
      statusCode: 200,
      message: 'Service status updated successfully',
      data,
    };
  }

  @Delete('admin/services/:id')
  @ApiOperation({ summary: 'Delete service' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Service deleted successfully',
      data,
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'Get public service list' })
  async findPublicAll(@Query() query: QueryPublicServiceDto) {
    const data = await this.service.findPublicAll(query);

    return {
      statusCode: 200,
      message: 'Services fetched successfully',
      data,
    };
  }

  @Get('services/:slug')
  @ApiOperation({ summary: 'Get public service by slug' })
  async findPublicBySlug(@Param('slug') slug: string) {
    const data = await this.service.findPublicBySlug(slug);

    return {
      statusCode: 200,
      message: 'Service fetched successfully',
      data,
    };
  }
}