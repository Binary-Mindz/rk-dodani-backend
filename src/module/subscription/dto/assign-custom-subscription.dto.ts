import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingInterval, EntitlementType, PlanAudience } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class NewEnterpriseUserDto {
  @ApiProperty({
    description: 'Email for the new enterprise user account',
    example: 'sarah.admin@enterprise.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: 'Sarah' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Connor' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Cyberdyne Systems' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Optional initial password. Auto-generated if omitted.',
    example: 'SecretPass123!',
  })
  @IsString()
  @IsOptional()
  password?: string;
}

export class AssignCustomSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Existing User ID to assign plan to. Required if newUser is omitted.',
    example: 'user-uuid',
  })
  @ValidateIf((o) => !o.newUser)
  @IsUUID()
  @IsNotEmpty({ message: 'Either userId or newUser must be provided' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'New enterprise user details if account does not exist on platform yet',
    type: NewEnterpriseUserDto,
  })
  @ValidateIf((o) => !o.userId)
  @ValidateNested()
  @Type(() => NewEnterpriseUserDto)
  newUser?: NewEnterpriseUserDto;

  @ApiPropertyOptional({
    description: 'Whether this enterprise assignment uses a Purchase Order (offline payment)',
    default: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPo?: boolean;

  @ApiPropertyOptional({
    description: 'Purchase Order number (required when isPo is true)',
    example: 'PO-2026-ARUM-001',
  })
  @ValidateIf((o) => o.isPo === true)
  @IsNotEmpty({ message: 'Purchase Order (PO) number is required when isPo is true' })
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional({
    description: 'Display title of the custom plan',
    example: 'Enterprise Starter',
  })
  @IsString()
  @IsOptional()
  planTitle?: string;

  @ApiPropertyOptional({
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
    description: 'Billing interval for the custom plan',
  })
  @IsEnum(BillingInterval)
  @IsOptional()
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({
    description: 'Custom price (for record only)',
    example: 49.99,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  customPrice?: number;

  @ApiPropertyOptional({ description: 'Custom currency', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Trial period in days for the custom plan',
    example: 14,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiPropertyOptional({
    description: 'Whether the custom plan should auto-renew',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({
    enum: EntitlementType,
    default: EntitlementType.PREMIUM_ACCESS,
  })
  @IsEnum(EntitlementType)
  @IsOptional()
  entitlementType?: EntitlementType;

  @ApiPropertyOptional({
    enum: PlanAudience,
    default: PlanAudience.B2C,
    description: 'B2C → STUDENT role, B2B → ENTERPRISE role',
  })
  @IsEnum(PlanAudience)
  @IsOptional()
  targetAudience?: PlanAudience;

  @ApiPropertyOptional({
    description: 'Admin note for this custom assignment',
    example: 'Special client - 3 month deal',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Number of seats',
    example: 200,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  seats?: number;
}
