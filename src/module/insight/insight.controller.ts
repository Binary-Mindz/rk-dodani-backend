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
import { CreateInsightDto } from './dto/create-insight.dto';
import { QueryInsightDto } from './dto/query-insight.dto';
import { UpdateInsightDto } from './dto/update-insight.dto';
import { UpdateInsightStatusDto } from './dto/update-insight-status.dto';
import { InsightService } from './insight.service';

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleCode.SUPER_ADMIN)
@Controller('admin/insights')
export class InsightController {
  constructor(private readonly service: InsightService) {}

  @Post()
  @ApiOperation({ summary: 'Create insight' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateInsightDto) {
    const data = await this.service.create(userId, dto);
    return { statusCode: 201, message: 'Insight created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all insights' })
  async findAll(@Query() query: QueryInsightDto) {
    const data = await this.service.findAll(query);
    return { statusCode: 200, message: 'Insights fetched successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get insight by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { statusCode: 200, message: 'Insight fetched successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update insight' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInsightDto,
  ) {
    const data = await this.service.update(userId, id, dto);
    return { statusCode: 200, message: 'Insight updated successfully', data };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update insight status' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInsightStatusDto,
  ) {
    const data = await this.service.updateStatus(userId, id, dto);
    return { statusCode: 200, message: 'Insight status updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete insight (soft delete)' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.service.remove(userId, id);
    return { statusCode: 200, message: 'Insight deleted successfully', data };
  }
}
