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
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { CurrentUser } from 'common/decorators/current-user.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('public')
  @ApiOperation({ summary: 'List published services' })
  async findPublic(@Query() query: ServiceQueryDto) {
    return {
      message: 'Published services retrieved successfully',
      data: await this.servicesService.findAll(query, true),
    };
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get published service by slug' })
  async findPublicBySlug(@Param('slug') slug: string) {
    return {
      message: 'Published service retrieved successfully',
      data: await this.servicesService.findBySlug(slug, true),
    };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN, UserRoleCode.EDITOR)
  @ApiOperation({ summary: 'List all services for admin/editor' })
  async findAll(@Query() query: ServiceQueryDto) {
    return {
      message: 'Services retrieved successfully',
      data: await this.servicesService.findAll(query, false),
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN, UserRoleCode.EDITOR)
  @ApiOperation({ summary: 'Create service' })
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateServiceDto,
  ) {
    return {
      message: 'Service created successfully',
      data: await this.servicesService.create(user.userId, dto),
    };
  }

  @Patch(':serviceId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN, UserRoleCode.EDITOR)
  @ApiOperation({ summary: 'Update service' })
  async update(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateServiceDto,
  ) {
    return {
      message: 'Service updated successfully',
      data: await this.servicesService.update(serviceId, user.userId, dto),
    };
  }

  @Delete(':serviceId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete service' })
  async remove(@Param('serviceId') serviceId: string) {
    return {
      message: 'Service deleted successfully',
      data: await this.servicesService.remove(serviceId),
    };
  }
}