import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import { SendManualNotificationDto } from './dto/send-manual-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all unread notifications for the logged-in user' })
  async getUnread(@CurrentUser('id') userId: string) {
    const data = await this.notificationService.getUnread(userId);
    return { statusCode: 200, data };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser('id') userId: string) {
    await this.notificationService.markAllRead(userId);
    return { statusCode: 200, message: 'All notifications marked as read' };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markOneRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.notificationService.markOneRead(id, userId);
    return { statusCode: 200, message: 'Notification marked as read' };
  }

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually send a notification to a specific user (Super Admin only)' })
  async send(@Body() dto: SendManualNotificationDto) {
    const data = await this.notificationService.send(dto);
    return { statusCode: 201, message: 'Notification sent successfully', data };
  }
}
