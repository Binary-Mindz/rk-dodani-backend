import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { BillingInterval } from "@prisma/client";

export class UpdateSubscriptionDto{
    @ApiProperty({
        example:"6913b56c-1455-4e3f-821f-89234b051c59"
    })
    @IsString()
    @IsNotEmpty()
    planId: string;

    @ApiProperty({
        enum: BillingInterval,
        example: BillingInterval.MONTHLY
    })
    @IsEnum(BillingInterval)
    billingInterval: BillingInterval;
}