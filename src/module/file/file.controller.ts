import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { UploadFilesDto } from './dto/upload.file.dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { AuditService } from '../audit/audit.service';

@Controller('files')
export class FileController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------- CLOUDINARY UPLOAD ----------------------
  @Post('/upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFilesDto })
  async uploadToCloudinary(@UploadedFiles() files: Express.Multer.File[]) {
    const uploaded = await Promise.all(
      files.map((file) =>
        this.cloudinaryService.uploadFileBuffer(
          file.buffer,
          file.originalname,
          file.mimetype,
        ),
      ),
    );
    uploaded.forEach((file: any) => {
      this.auditService
        .logCreate({
          actorUserId: null,
          entityType: 'ASSET',
          entityId: file?.id ?? file?.public_id ?? null,
          newValues: file,
        })
        .catch(() => {});
    });
    return uploaded;
  }

  // ---------------------- CLOUDINARY DELETE ----------------------
  @Delete('/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the file in the database',
    example: '21805e86-b8f1-40db-9a9f-5d7eb20af97d',
  })
  async deleteFile(@Param('id') id: string) {
    const result = await this.cloudinaryService.deleteResource(id);
    this.auditService
      .logDelete({
        actorUserId: null,
        entityType: 'ASSET',
        entityId: id,
        oldValues: { id },
      })
      .catch(() => {});
    return result;
  }
}
