import { Injectable, BadRequestException } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import type { File as MulterFile } from 'multer';
import * as os from 'os';

@Injectable()
export class UploadService {
  private readonly MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE);
  private readonly ALLOWED_MIMETYPE = process.env.ALLOWED_MIMETYPE;
  private readonly ALLOWED_EXTENSION = process.env.ALLOWED_EXTENSION ;
  private readonly MEMORY_THRESHOLD = parseFloat(process.env.MEMORY_THRESHOLD);
  private readonly CPU_LOAD_MULTIPLIER = parseFloat(process.env.CPU_LOAD_MULTIPLIER);
  private readonly MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT);

  async handleUpload(file: MulterFile): Promise<void> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    const { originalname, stream, size, mimetype } = file;

    if (!originalname) {
      throw new BadRequestException('File with a valid name is required.');
    }

    if (!stream) {
      throw new BadRequestException('File stream is required.');
    }

    if (size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
      );
    }

    if (mimetype !== this.ALLOWED_MIMETYPE) {
      throw new BadRequestException(`Only CSV files are allowed.`);
    }

    if (!originalname.toLowerCase().endsWith(this.ALLOWED_EXTENSION)) {
      throw new BadRequestException(`File must have a ${this.ALLOWED_EXTENSION} extension.`);
    }

    const filePath = join(__dirname, '..', '..', 'uploads', originalname);

    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(this.MAX_CONCURRENT);

    const writeFn = async () => {
      this.ensureSystemCapacity();

      const writeStream = createWriteStream(filePath);

      try {
        await pipeline(stream, writeStream);
      } catch {
        throw new BadRequestException('Failed to write file stream.');
      }
    };

    try {
      await limit(writeFn);
    } catch (err) {
      throw new BadRequestException(err.message || 'File upload failed.');
    }
  }

  private ensureSystemCapacity(): void {
    const freeMemRatio = os.freemem() / os.totalmem();
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;

    if (freeMemRatio < this.MEMORY_THRESHOLD || loadAvg > cpuCount * this.CPU_LOAD_MULTIPLIER) {
      throw new BadRequestException('System under high load. Try again later.');
    }
  }
}
