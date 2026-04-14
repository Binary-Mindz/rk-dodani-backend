import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class AddInquiryNoteDto {
  @ApiProperty({ example: 'Customer asked for pricing deck follow-up next week.' })
  @IsString()
  @MaxLength(2000)
  note!: string;
}