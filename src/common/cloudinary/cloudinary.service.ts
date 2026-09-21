import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as path from 'path';
import { Readable } from 'stream';
import { PrismaService } from '../../prisma/prisma.service';
import { FileType } from '@prisma/client';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initCloudinary();
  }

  private initCloudinary() {
    const cloudName = (
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      this.configService.get<string>('CLOUDINARY_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_NAME ||
      ''
    )
      .trim()
      .replace(/^["']|["']$/g, '');

    const apiKey = (
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY ||
      ''
    )
      .trim()
      .replace(/^["']|["']$/g, '');

    const apiSecret = (
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET ||
      ''
    )
      .trim()
      .replace(/^["']|["']$/g, '');

    const cloudinaryUrl = (
      this.configService.get<string>('CLOUDINARY_URL') ||
      process.env.CLOUDINARY_URL ||
      ''
    )
      .trim()
      .replace(/^["']|["']$/g, '');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log(`Cloudinary configured with cloud_name: ${cloudName}`);
    } else if (cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl,
        secure: true,
      });
      this.logger.log('Cloudinary configured using CLOUDINARY_URL');
    } else {
      this.logger.warn(
        'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or CLOUDINARY_URL) are not set.',
      );
    }
  }

  private ensureConfigured() {
    const config = cloudinary.config();
    if (!config.cloud_name) {
      this.initCloudinary();
      const rechecked = cloudinary.config();
      if (!rechecked.cloud_name) {
        throw new BadRequestException(
          'Cloudinary is not properly configured on this server. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) are defined.',
        );
      }
    }
  }

  async uploadFileBuffer(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
  ) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('File buffer and content are required');
    }
    if (!originalName) {
      throw new BadRequestException('Original file name is required');
    }

    this.ensureConfigured();

    const ext = path.extname(originalName).toLowerCase();
    const rawBase = path.basename(originalName, ext);

    // Sanitize file name: remove spaces, dots, parentheses, and special characters
    const sanitizedBase =
      rawBase
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_{2,}/g, '_')
        .slice(0, 80) || 'asset';

    const uniqueTimestamp = Date.now();
    const fileCategory = this.resolveFileCategory(mimetype, ext);

    let folder = 'docs';
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    let publicId = '';

    if (fileCategory === 'image') {
      folder = 'images';
      resourceType = 'image';
      publicId = `${uniqueTimestamp}-${sanitizedBase}`;
    } else if (fileCategory === 'video') {
      folder = 'videos';
      resourceType = 'video';
      publicId = `${uniqueTimestamp}-${sanitizedBase}`;
    } else if (fileCategory === 'audio') {
      folder = 'audio';
      // In Cloudinary, audio files are handled under the 'video' resource type
      resourceType = 'video';
      publicId = `${uniqueTimestamp}-${sanitizedBase}`;
    } else {
      folder = 'docs';
      resourceType = 'raw';
      // CRITICAL: Cloudinary raw resources MUST contain the file extension in public_id
      // to ensure valid URLs that can be previewed or downloaded without 404 errors.
      publicId = `${uniqueTimestamp}-${sanitizedBase}${ext}`;
    }

    try {
      const uploadResponse = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: publicId,
              resource_type: resourceType,
              use_filename: false,
              unique_filename: false,
              overwrite: false,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result!);
            },
          );

          Readable.from(fileBuffer).pipe(uploadStream);
        },
      );

      // Secure HTTPS URL returned by Cloudinary
      let validUrl = uploadResponse.secure_url || uploadResponse.url;

      // Force HTTPS if not already present
      if (validUrl.startsWith('http://')) {
        validUrl = validUrl.replace('http://', 'https://');
      }

      // If for any reason raw URL does not include the extension, append it
      if (
        resourceType === 'raw' &&
        ext &&
        !validUrl.toLowerCase().endsWith(ext)
      ) {
        validUrl = `${validUrl}${ext}`;
      }

      // Map to DB FileType
      let dbFileType: FileType = FileType.DOCS;
      if (fileCategory === 'image') dbFileType = FileType.IMAGE;
      else if (fileCategory === 'video') dbFileType = FileType.VIDEO;
      else if (fileCategory === 'audio') dbFileType = FileType.AUDIO;
      else dbFileType = FileType.DOCS;

      // Create database file instance
      const fileRecord = await this.prisma.fileInstance.create({
        data: {
          filename:
            resourceType === 'raw'
              ? uploadResponse.public_id
              : `${uploadResponse.public_id}.${uploadResponse.format || ext.replace('.', '') || 'bin'}`,
          originalFilename: originalName,
          path: uploadResponse.public_id,
          url: validUrl,
          fileType: dbFileType,
          mimeType: mimetype,
          size: fileBuffer.length,
        },
      });

      return fileRecord;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to upload file to Cloudinary: ${error?.message || error}`,
      );
    }
  }

  async deleteResource(id: string) {
    this.ensureConfigured();

    const fileOnDb = await this.prisma.fileInstance.findUnique({
      where: { id },
    });

    if (!fileOnDb) {
      throw new NotFoundException('File not available on the server');
    }

    // Determine resource type based on DB record
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (fileOnDb.fileType === FileType.IMAGE) {
      resourceType = 'image';
    } else if (
      fileOnDb.fileType === FileType.VIDEO ||
      fileOnDb.fileType === FileType.AUDIO
    ) {
      resourceType = 'video';
    }

    try {
      const result = await cloudinary.uploader.destroy(fileOnDb.path, {
        resource_type: resourceType,
      });

      if (result.result !== 'ok' && result.result !== 'not_found') {
        this.logger.warn(
          `Cloudinary destroy returned: ${result.result} for ${fileOnDb.path}`,
        );
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to destroy Cloudinary resource ${fileOnDb.path}: ${error?.message || error}`,
      );
    }

    // Remove from Database
    await this.prisma.fileInstance.delete({ where: { id } });

    return {
      success: true,
      id: fileOnDb.id,
      message: 'File deleted successfully from Cloudinary and database',
    };
  }

  private resolveFileCategory(
    mimeType: string,
    extension: string,
  ): 'image' | 'video' | 'audio' | 'raw' {
    const mime = (mimeType || '').toLowerCase();
    const ext = (extension || '').toLowerCase();

    const imageExts = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.bmp',
      '.ico',
      '.tiff',
      '.avif',
    ];
    const videoExts = [
      '.mp4',
      '.mov',
      '.avi',
      '.wmv',
      '.webm',
      '.mkv',
      '.flv',
      '.m4v',
    ];
    const audioExts = [
      '.mp3',
      '.wav',
      '.ogg',
      '.m4a',
      '.aac',
      '.flac',
      '.wma',
      '.aiff',
    ];

    if (mime.startsWith('image/') || imageExts.includes(ext)) {
      return 'image';
    }
    if (mime.startsWith('video/') || videoExts.includes(ext)) {
      return 'video';
    }
    if (mime.startsWith('audio/') || audioExts.includes(ext)) {
      return 'audio';
    }
    return 'raw';
  }
}
