import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FileType } from '@prisma/client';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn().mockReturnValue({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    }),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let prisma: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      fileInstance: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'file-1', ...data })),
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({ id: 'file-1' }),
      },
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'test-key';
        if (key === 'CLOUDINARY_API_SECRET') return 'test-secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('uploads an image and returns a valid secure HTTPS link', async () => {
    const mockUploadResponse = {
      public_id: 'images/1726912345-avatar',
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/images/1726912345-avatar.jpg',
      format: 'jpg',
    };

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
      callback(null, mockUploadResponse);
      return {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };
    });

    const buffer = Buffer.from('fake-image-bytes');
    const result = await service.uploadFileBuffer(buffer, 'User Avatar (1).jpg', 'image/jpeg');

    expect(result.url).toBe(mockUploadResponse.secure_url);
    expect(result.fileType).toBe(FileType.IMAGE);
    expect(prisma.fileInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          url: mockUploadResponse.secure_url,
          fileType: FileType.IMAGE,
        }),
      }),
    );
  });

  it('uploads a raw PDF document and preserves .pdf in public_id for valid links', async () => {
    let capturedOptions: any;

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
      capturedOptions = options;
      callback(null, {
        public_id: `docs/${options.public_id}`,
        secure_url: `https://res.cloudinary.com/test-cloud/raw/upload/v1/docs/${options.public_id}`,
      });
      return { write: jest.fn(), end: jest.fn(), on: jest.fn(), once: jest.fn(), emit: jest.fn() };
    });

    const buffer = Buffer.from('fake-pdf-bytes');
    const result = await service.uploadFileBuffer(buffer, 'Quarterly Report (Q3).pdf', 'application/pdf');

    expect(capturedOptions.resource_type).toBe('raw');
    expect(capturedOptions.public_id).toMatch(/\.pdf$/);
    expect(result.url).toMatch(/\.pdf$/);
    expect(result.fileType).toBe(FileType.DOCS);
  });

  it('uploads an audio file with resource_type: video and FileType.AUDIO', async () => {
    let capturedOptions: any;

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
      capturedOptions = options;
      callback(null, {
        public_id: `audio/${options.public_id}`,
        secure_url: `https://res.cloudinary.com/test-cloud/video/upload/v1/audio/${options.public_id}.mp3`,
        format: 'mp3',
      });
      return { write: jest.fn(), end: jest.fn(), on: jest.fn(), once: jest.fn(), emit: jest.fn() };
    });

    const buffer = Buffer.from('fake-audio-bytes');
    const result = await service.uploadFileBuffer(buffer, 'meditation-session.mp3', 'audio/mpeg');

    expect(capturedOptions.resource_type).toBe('video');
    expect(capturedOptions.folder).toBe('audio');
    expect(result.fileType).toBe(FileType.AUDIO);
  });
});
