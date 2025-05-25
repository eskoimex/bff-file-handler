import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import type { File as MulterFile } from 'multer';

@Injectable()
export class UploadService {
  constructor(private readonly cbService: CircuitBreakerService) {}

  async handleUpload(file: MulterFile): Promise<void> {
    const filePath = join(__dirname, '..', '..', 'uploads', file.originalname);

    const writeFn = async () => {
      const writeStream = createWriteStream(filePath);
      try {
        await pipeline(file.stream, writeStream);
      } catch (error) {
        throw new Error('Stream write failed');
      }
    };

    try {
      await this.cbService.fire(writeFn);
    } catch (err) {
      throw new InternalServerErrorException('Failed to process file upload');
    }
  }
}
