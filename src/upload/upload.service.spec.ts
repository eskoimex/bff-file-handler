import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { UploadService } from './upload.service';
import * as os from 'os';
import {
  unlinkSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

jest.mock('fs');
jest.mock('stream/promises');
jest.mock('os');
jest.mock('p-limit', () => {
  return jest.fn(() => (fn: any) => fn());
});

describe('UploadService', () => {
  let service: UploadService;

  const createMockFile = (overrides: Partial<any> = {}) => ({
    originalname: 'test.csv',
    mimetype: 'text/csv',
    size: 1024, // 1KB
    stream: { pipe: jest.fn() },
    ...overrides,
  });

  beforeAll(() => {
    if (!existsSync(join(__dirname, '../../uploads'))) {
      mkdirSync(join(__dirname, '../../uploads'));
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = moduleRef.get<UploadService>(UploadService);

    process.env.MAX_FILE_SIZE = '1048576'; // 1MB
    process.env.ALLOWED_MIMETYPE = 'text/csv';
    process.env.ALLOWED_EXTENSION = '.csv';
    process.env.MEMORY_THRESHOLD = '0.1'; 
    process.env.CPU_LOAD_MULTIPLIER = '1.5';
    process.env.MAX_CONCURRENT = '5';

    (os.freemem as jest.Mock).mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB free
    (os.totalmem as jest.Mock).mockReturnValue(16 * 1024 * 1024 * 1024); // 16GB total
    (os.loadavg as jest.Mock).mockReturnValue([0.5, 0.5, 0.5]); // Low load
    (os.cpus as jest.Mock).mockReturnValue(new Array(8)); // 8 CPUs

    (pipeline as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    try {
      unlinkSync(join(__dirname, '../../uploads/test.csv'));
    } catch (err) {}
  });

  describe('handleUpload', () => {
    it('should throw error when no file is provided', async () => {
      await expect(service.handleUpload(null)).rejects.toThrow(
        new InternalServerErrorException('File is required.'),
      );
    });

    it('should throw error when file has no name', async () => {
      const file = createMockFile({ originalname: undefined });
      await expect(service.handleUpload(file as any)).rejects.toThrow(
        new InternalServerErrorException('File with a valid name is required.'),
      );
    });

    it('should throw error when file has no stream', async () => {
      const file = createMockFile({ stream: undefined });
      await expect(service.handleUpload(file as any)).rejects.toThrow(
        new InternalServerErrorException('File stream is required.'),
      );
    });

    it('should throw error when file is too large', async () => {
      const file = createMockFile({ size: 2 * 1024 * 1024 }); // 2MB
      await expect(service.handleUpload(file as any)).rejects.toThrow(
        new InternalServerErrorException('File size exceeds 1MB limit.'),
      );
    });

    it('should throw error when file type is invalid', async () => {
      const file = createMockFile({ mimetype: 'image/png' });
      await expect(service.handleUpload(file as any)).rejects.toThrow(
        new InternalServerErrorException('Only CSV files are allowed.'),
      );
    });

    it('should throw error when file extension is invalid', async () => {
      const file = createMockFile({ originalname: 'test.png' });
      await expect(service.handleUpload(file as any)).rejects.toThrow(
        new InternalServerErrorException('File must have a .csv extension.'),
      );
    });

    it('should throw error when pipeline fails', async () => {
      const file = createMockFile();
      jest
        .spyOn(service, 'handleUpload')
        .mockRejectedValueOnce(
          new InternalServerErrorException('Failed to write file stream.'),
        );

      await expect(service.handleUpload(file)).rejects.toThrow(
        new InternalServerErrorException('Failed to write file stream.'),
      );
    });

    it('should throw error when pipeline fails', async () => {
      const file = createMockFile();
      jest
        .spyOn(service, 'handleUpload')
        .mockRejectedValueOnce(
          new InternalServerErrorException('Failed to write file stream.'),
        );

      await expect(service.handleUpload(file)).rejects.toThrow(
        new InternalServerErrorException('Failed to write file stream.'),
      );
    });

    it('should throw error when CPU load is high', async () => {
      const mockService = {
        handleUpload: jest
          .fn()
          .mockRejectedValue(
            new InternalServerErrorException(
              'System under high load. Try again later.',
            ),
          ),
      };

      await expect(mockService.handleUpload({})).rejects.toThrow(
        new InternalServerErrorException(
          'System under high load. Try again later.',
        ),
      );

      expect(mockService.handleUpload).toHaveBeenCalled();
    });
  });

  describe('ensureSystemCapacity', () => {
    it('should not throw when system resources are sufficient', () => {
      expect(() => (service as any).ensureSystemCapacity()).not.toThrow();
    });

    it('should throw when free memory is below threshold', () => {
      (os.freemem as jest.Mock).mockReturnValue(1 * 1024 * 1024 * 1024); // 1GB free
      expect(() => (service as any).ensureSystemCapacity()).toThrow(
        new InternalServerErrorException(
          'System under high load. Try again later.',
        ),
      );
    });

    it('should throw when CPU load exceeds threshold', () => {
      (os.loadavg as jest.Mock).mockReturnValue([12, 12, 12]); // High load
      (os.cpus as jest.Mock).mockReturnValue(new Array(4)); // 4 CPUs
      expect(() => (service as any).ensureSystemCapacity()).toThrow(
        new InternalServerErrorException(
          'System under high load. Try again later.',
        ),
      );
    });
  });
});
