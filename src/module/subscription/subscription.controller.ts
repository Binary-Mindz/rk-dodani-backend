import { Body, Controller, Post, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Create a Stripe Checkout Session to buy a plan' })
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    const session = await this.subscriptionService.createCheckoutSession(userId, dto.planId);
    
    return {
      statusCode: 200,
      message: 'Checkout session created successfully',
      data: {
        sessionId: session.id,
        url: session.url,
      },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Stripe payment session manually and assign security roles' })
  @ApiQuery({ name: 'session_id', description: 'The Stripe Checkout Session ID (cs_test_...)', required: true })
  async verifyPayment(@Query('session_id') sessionId: string) {
    
    await this.subscriptionService.verifySessionAndAssignRole(sessionId);
    
    return {
      statusCode: 200,
      message: 'Payment verified and your subscription security role assigned successfully.',
      data: {
        verified: true,
      }
    };
  }
}