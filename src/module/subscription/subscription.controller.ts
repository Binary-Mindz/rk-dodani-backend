import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}