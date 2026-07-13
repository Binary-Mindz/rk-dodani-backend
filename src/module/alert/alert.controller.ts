import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AlertService } from './alert.service';
import { AlertResponseDto } from './dto/alert-response.dto';
import { CreateAlertDto, UpdateAlertDto } from './dto/alert-validation.dto';

@ApiTags('alert')
@Controller('alert')
export class AlertController {
    constructor(private readonly alertService: AlertService) { }

    // create new alert
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRoleCode.SUPER_ADMIN)
    @Post()
    @ApiResponse({ status: 201, type: AlertResponseDto })
    @ApiOperation({ description: "alertType : INFO | SUCCESS | WARNING | ERROR | SYSTEM | MAINTENANCE  || alertMethod : PUSH | EMAIL | SMS", summary: "Create New Alert -- Only for admin" })
    async create_new_alert(@Body() dto: CreateAlertDto) {
        const result = await this.alertService.create_new_alert_into_db(dto)
        return {
            statusCode: 201,
            message: 'Alert Create successful',
            data: result,
        }
    }

    // get all alert with pagination - public
    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
    @ApiOperation({ summary: "Get all alerts with pagination (Last created first) - Public" })
    async get_all_alerts(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        // convert string query params to numbers
        const pageNumber = Math.max(1, parseInt(page, 10));
        const limitNumber = Math.max(1, parseInt(limit, 10));

        const result = await this.alertService.get_all_alerts_from_db(pageNumber, limitNumber);

        return {
            statusCode: 200,
            message: 'Alerts retrieved successfully',
            data: result.data,
            meta: result.meta,
        }
    }

    // update alert by id
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRoleCode.SUPER_ADMIN)
    @Patch(':id')
    @ApiResponse({ status: 200, type: AlertResponseDto })
    @ApiOperation({ summary: "Update alert by id -- Only for admin" })
    async update_alert(@Param('id') id: string, @Body() dto: UpdateAlertDto) {
        const result = await this.alertService.update_alert_by_id(id, dto);
        return {
            statusCode: 200,
            message: 'Alert updated successfully',
            data: result,
        }
    }

    // delete alert by id
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRoleCode.SUPER_ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: "Delete alert by id -- Only for admin" })
    async delete_alert(@Param('id') id: string) {
        const result = await this.alertService.delete_alert_by_id(id);
        return {
            statusCode: 200,
            message: 'Alert deleted successfully',
            data: result,
        }
    }
}