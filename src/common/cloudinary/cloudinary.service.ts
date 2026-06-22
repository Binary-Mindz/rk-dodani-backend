import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { PrismaService } from '../../prisma/prisma.service';
import { FileType } from '@prisma/client';

@Injectable()
export class CloudinaryService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFileBuffer(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
  ) {
    if (!fileBuffer || !originalName) {
      throw new BadRequestException(
        'File buffer and original name are required',
      );
    }

    const fileCategory = this.resolveFileCategory(mimetype);
    
    // Cloudinary resource type set up (image, video, or raw for docs)
    const resourceType =
      fileCategory === 'image'
        ? 'image'
        : fileCategory === 'video'
          ? 'video'
          : 'raw';

    // Virtual folders inside Cloudinary
    const folder =
      fileCategory === 'image'
        ? 'images'
        : fileCategory === 'video'
          ? 'videos'
          : 'docs';

    const baseName = `${Date.now()}-${originalName.replace(/\.[^/.]+$/, '')}`;

    try {
      // Cloudinary expects a stream for buffers
      const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: baseName,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!);
          },
        );

        Readable.from(fileBuffer).pipe(uploadStream);
      });

      // Prisma create file record
      const fileRecord = await this.prisma.fileInstance.create({
        data: {
          filename: `${uploadResponse.public_id}.${uploadResponse.format || 'bin'}`,
          originalFilename: originalName,
          path: uploadResponse.public_id, // Storing Cloudinary public_id for deletion
          url: uploadResponse.secure_url,
          fileType:
            fileCategory === 'image'
              ? FileType.IMAGE
              : fileCategory === 'video'
                ? FileType.VIDEO
                : FileType.DOCS,
          mimeType: mimetype,
          size: fileBuffer.length,
        },
      });

      return fileRecord;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  async deleteResource(id: string) {
    const fileOnDb = await this.prisma.fileInstance.findUnique({
      where: { id },
    });

    if (!fileOnDb) {
      throw new BadRequestException('File not available on the server');
    }

    // Determine resource type based on DB record
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (fileOnDb.fileType === FileType.IMAGE) resourceType = 'image';
    if (fileOnDb.fileType === FileType.VIDEO) resourceType = 'video';

    try {
      // Delete from Cloudinary using public_id (stored in path)
      const result = await cloudinary.uploader.destroy(fileOnDb.path, {
        resource_type: resourceType,
      });

      if (result.result !== 'ok' && result.result !== 'not_found') {
        throw new Error(result.result);
      }
    } catch (error) {
      throw new BadRequestException(`Failed to delete file from Cloudinary: ${error.message}`);
    }

    // Remove from Database
    await this.prisma.fileInstance.delete({ where: { id } });

    return {
      success: true,
      id: fileOnDb.id,
      message: 'File deleted successfully from Cloudinary and database',
    };
  }

  private resolveFileCategory(mimeType: string): 'image' | 'video' | 'raw' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }
}