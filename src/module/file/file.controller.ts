import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadFilesDto } from './dto/upload.file.dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { FileService } from './file.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly fileService: FileService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------- CLOUDINARY UPLOAD ----------------------
  @Post('/upload')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFilesDto })
  @ApiOperation({
    summary: 'Upload file(s) to Cloudinary and store file records in database',
    description:
      'Accepts single or multiple files under field name "file" or "files". Returns accessible, secure HTTPS URLs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Files uploaded successfully with accessible URLs',
  })
  async uploadToCloudinary(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'No file provided for upload. Please send a file under field name "file" or "files" in multipart/form-data.',
      );
    }

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
          entityId: file?.id ?? file?.path ?? null,
          newValues: file,
        })
        .catch(() => {});
    });

    const isSingle = uploaded.length === 1;

    return {
      statusCode: 200,
      message: isSingle
        ? 'File uploaded successfully'
        : 'Files uploaded successfully',
      data: isSingle ? uploaded[0] : uploaded,
    };
  }

  // ---------------------- GET FILE LIST ----------------------
  @Get()
  @ApiOperation({ summary: 'Get list of uploaded files with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getFiles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const data = await this.fileService.getFiles(skip, limitNum);
    return {
      statusCode: 200,
      message: 'Files fetched successfully',
      data: {
        items: data.files,
        meta: {
          page: pageNum,
          limit: limitNum,
          total: data.total,
          totalPages: Math.ceil(data.total / limitNum),
        },
      },
    };
  }

  // ---------------------- GET SINGLE FILE ----------------------
  @Get('/:id')
  @ApiOperation({ summary: 'Get single uploaded file details by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    example: '21805e86-b8f1-40db-9a9f-5d7eb20af97d',
  })
  async getFile(@Param('id') id: string) {
    const data = await this.fileService.getFile(id);
    return {
      statusCode: 200,
      message: 'File retrieved successfully',
      data,
    };
  }

  // ---------------------- CLOUDINARY DELETE ----------------------
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete file from Cloudinary and database' })
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
    return {
      statusCode: 200,
      message: 'File deleted successfully',
      data: result,
    };
  }
}
