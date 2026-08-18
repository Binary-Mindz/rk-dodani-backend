import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReorderProductItemDto {
  @ApiProperty({ example: 'b3378906-e789-49fa-9db6-b25867ffcfc2' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order!: number;
}

export class ReorderProductsDto {
  @ApiProperty({ type: [ReorderProductItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderProductItemDto)
  items!: ReorderProductItemDto[];
}
