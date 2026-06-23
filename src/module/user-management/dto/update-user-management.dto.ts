import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, BillingInterval } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserManagementDto {
  @ApiPropertyOptional({ 
    enum: UserStatus, 
    description: 'Update account core status (e.g., ACTIVE, BLOCKED)', 
    example: UserStatus.BLOCKED 
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ 
    description: 'Target plan ID for the user conversion action', 
    example: 'plan-uuid-12345' 
  })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ 
    enum: BillingInterval, 
    description: 'Billing cycle chosen from dropdown interface (Monthly / Yearly)', 
    example: BillingInterval.YEARLY 
  })
  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ 
    description: 'Reason stated in popup text field for subscription modification tracking', 
    example: 'Customer requested plan upgrade to Enterprise Pro tier manually.' 
  })
  @IsOptional()
  @IsString()
  changeReason?: string;
}