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

@Controller('files')
export class FileController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  // ---------------------- CLOUDINARY UPLOAD ----------------------
  @Post('/upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFilesDto })
  async uploadToCloudinary(@UploadedFiles() files: Express.Multer.File[]) {
    return Promise.all(
      files.map((file) =>
        this.cloudinaryService.uploadFileBuffer(
          file.buffer,
          file.originalname,
          file.mimetype,
        ),
      ),
    );
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
    return this.cloudinaryService.deleteResource(id);
  }
}