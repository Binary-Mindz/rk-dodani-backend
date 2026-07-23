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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { CreateDeepPointDto } from './dto/create-deep-point.dto';
import { UpdateDeepPointDto } from './dto/update-deep-point.dto';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';

@ApiTags('Services')
@Controller()
export class ServiceController {
  constructor(private readonly service: ServiceService) {}

  @Get('services')
  @ApiOperation({ summary: 'Get all services with deep points (Public)' })
  async findAllPublic(@Query() query: QueryServiceDto) {
    const data = await this.service.findAll(query);
    return {
      statusCode: 200,
      message: 'Services fetched successfully',
      data,
    };
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Get service details by ID (Public)' })
  async findOnePublic(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: 200,
      message: 'Service fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Post('admin/services')
  @ApiOperation({ summary: 'Create a new service with optional deep points' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateServiceDto,
  ) {
    const data = await this.service.create(userId, dto);
    return {
      statusCode: 201,
      message: 'Service created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/services')
  @ApiOperation({ summary: 'Get all services for admin' })
  async findAllAdmin(@Query() query: QueryServiceDto) {
    const data = await this.service.findAll(query);
    return {
      statusCode: 200,
      message: 'Services fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Get('admin/services/:id')
  @ApiOperation({ summary: 'Get service details for admin' })
  async findOneAdmin(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      statusCode: 200,
      message: 'Service fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch('admin/services/:id')
  @ApiOperation({ summary: 'Update service and its deep points' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const data = await this.service.update(userId, id, dto);
    return {
      statusCode: 200,
      message: 'Service updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Delete('admin/services/:id')
  @ApiOperation({ summary: 'Delete a service' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const data = await this.service.remove(userId, id);
    return {
      statusCode: 200,
      message: 'Service deleted successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Post('admin/services/:serviceId/deep-points')
  @ApiOperation({ summary: 'Add a deep point to a service' })
  async addDeepPoint(
    @CurrentUser('id') userId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateDeepPointDto,
  ) {
    const data = await this.service.addDeepPoint(userId, serviceId, dto);
    return {
      statusCode: 201,
      message: 'Deep point added successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Patch('admin/services/deep-points/:id')
  @ApiOperation({ summary: 'Update a deep point by ID' })
  async updateDeepPoint(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDeepPointDto,
  ) {
    const data = await this.service.updateDeepPoint(userId, id, dto);
    return {
      statusCode: 200,
      message: 'Deep point updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Delete('admin/services/deep-points/:id')
  @ApiOperation({ summary: 'Delete a deep point by ID' })
  async removeDeepPoint(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const data = await this.service.removeDeepPoint(userId, id);
    return {
      statusCode: 200,
      message: 'Deep point deleted successfully',
      data,
    };
  }
}
