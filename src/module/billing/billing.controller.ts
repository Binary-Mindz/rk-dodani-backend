import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

// import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
// import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
// import { UseGuards } from '@nestjs/common';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post('checkout-session')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  async createCheckoutSession(
    // @CurrentUser() user: any,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    const data = await this.service.createCheckoutSession('USER_ID_HERE', dto);

    return {
      statusCode: 201,
      message: 'Checkout session created successfully',
      data,
    };
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get current user subscriptions' })
  async getMySubscriptions(
    // @CurrentUser() user: any,
  ) {
    const data = await this.service.getMySubscription('USER_ID_HERE');

    return {
      statusCode: 200,
      message: 'Subscriptions fetched successfully',
      data,
    };
  }

  @Patch('my-subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel current user subscription at period end' })
  async cancelMySubscription(
    // @CurrentUser() user: any,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    const data = await this.service.cancelMySubscription(
      'USER_ID_HERE',
      subscriptionId,
    );

    return {
      statusCode: 200,
      message: 'Subscription cancel scheduled successfully',
      data,
    };
  }
}