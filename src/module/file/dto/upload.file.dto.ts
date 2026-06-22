// dto/upload.file.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class UploadFilesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsArray()
  files: Express.Multer.File[];
}