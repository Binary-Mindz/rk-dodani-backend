import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AlertResponseDto } from './dto/response-alert.dto';

@ApiTags('alert')
@Controller('alert')
export class AlertController {
    // make constructor
    constructor(private readonly alertService: AlertService) { }

    // create new alert
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRoleCode.SUPER_ADMIN)
    @Post()
    @ApiResponse({ status: 201, type: AlertResponseDto })
    @ApiOperation({ description: "alertType : INFO | SUCCESS | WARNING | ERROR |SYSTEM | MAINTENANCE  || alertMethod : PUSH | EMAIL | SMS", summary: "Create New Alert -- Only for admin" })
    async create_new_alert(@Body() dto: CreateAlertDto) {
        const result = await this.alertService.create_new_alert_into_db(dto)
        return {
            statusCode: 200,
            message: 'Alert Create successful',
            data: result,
        }
    }
}
