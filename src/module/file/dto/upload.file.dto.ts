import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFilesDto {
  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Files to upload (supports array under field name "files")',
  })
  files?: Express.Multer.File[];

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Single file to upload (supports field name "file")',
  })
  file?: Express.Multer.File;
}
