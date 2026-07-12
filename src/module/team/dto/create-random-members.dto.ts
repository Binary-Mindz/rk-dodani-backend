import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateRandomMembersDto {
  @IsNotEmpty()
  @IsString()
  parentUserId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number = 5;
}
