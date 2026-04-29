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
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { QueryPlanDto } from './dto/query-plan.dto';
import { UpdatePlanStatusDto } from './dto/update-plan-status.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { UserRoleCode } from '@prisma/client';
import { Roles } from 'common/decorators/roles.decorator';
@ApiTags('Plans')
@Controller()
export class PlanController {
  constructor(private readonly service: PlanService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Post('admin/plans')
  @ApiOperation({ summary: 'Create plan' })
  async create(@Body() dto: CreatePlanDto) {
    const data = await this.service.create(dto);

    return {
      statusCode: 201,
      message: 'Plan created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Get('admin/plans')
  @ApiOperation({ summary: 'Get admin plan list' })
  async findAdminAll(@Query() query: QueryPlanDto) {
    const data = await this.service.findAdminAll(query);

    return {
      statusCode: 200,
      message: 'Plans fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Get('admin/plans/:id')
  @ApiOperation({ summary: 'Get admin plan details' })
  async findAdminOne(@Param('id') id: string) {
    const data = await this.service.findAdminOne(id);

    return {
      statusCode: 200,
      message: 'Plan fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Patch('admin/plans/:id')
  @ApiOperation({ summary: 'Update plan' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const data = await this.service.update(id, dto);

    return {
      statusCode: 200,
      message: 'Plan updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Patch('admin/plans/:id/status')
  @ApiOperation({ summary: 'Activate or deactivate a plan' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePlanStatusDto,
  ) {
    const data = await this.service.updateStatus(id, dto);

    return {
      statusCode: 200,
      message: 'Plan status updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  @Delete('admin/plans/:id')
  @ApiOperation({ summary: 'Delete plan' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Plan deleted successfully',
      data,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get public pricing plans' })
  async findPublicAll(@Query() query: QueryPlanDto) {
    const data = await this.service.findPublicAll(query);

    return {
      statusCode: 200,
      message: 'Public plans fetched successfully',
      data,
    };
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get public plan details' })
  async findPublicOne(@Param('id') id: string) {
    const data = await this.service.findPublicOne(id);

    return {
      statusCode: 200,
      message: 'Plan fetched successfully',
      data,
    };
  }
}