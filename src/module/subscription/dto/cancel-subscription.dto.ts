import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: 'Optional subscription id to cancel. If omitted, the current user\'s active subscription will be canceled.', example: 'sub_123' })
  @IsOptional()
  @IsString()
  @IsUUID()
  subscriptionId?: string;
}
