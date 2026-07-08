import { Body, Controller, Post, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Create Checkout or Direct Free Activation' })
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    const result = await this.subscriptionService.createCheckoutSession(userId, dto.planId, dto.seats);
    
    if (result.isFreeActivation) {
      return {
        statusCode: 201,
        message: 'Free plan activated successfully without payment',
        data: { isFree: true, url: null, sessionId: null },
      };
    }

    return {
      statusCode: 200,
      message: 'Checkout session created successfully',
      data: { sessionId: result.id, url: result.url },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Stripe session and update role' })
  async verifyPayment(@Query('session_id') sessionId: string) {
    await this.subscriptionService.verifySessionAndAssignRole(sessionId);
    return {
      statusCode: 200,
      message: 'Payment verified and security role updated.',
      data: { verified: true }
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN)
  @Post('assign')
  @ApiOperation({ summary: 'Manually assign a subscription plan to a user (Super Admin only, bypassing Stripe)' })
  async assignSubscription(
    @Body() dto: AssignPlanDto,
  ) {
    const data = await this.subscriptionService.assignPlanManually(dto.userId, dto.planId, dto.seats || 1);
    return {
      statusCode: 200,
      message: 'Subscription plan manually assigned successfully',
      data,
    };
  }
}