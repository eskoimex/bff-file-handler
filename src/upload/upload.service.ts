import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import type { File as MulterFile } from 'multer';
import * as os from 'os';


@Injectable()
export class UploadService {
  async handleUpload(file: MulterFile): Promise<void> {
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(5);
    const filePath = join(__dirname, '..', '..', 'uploads', file.originalname);

    const writeFn = async () => {
      // Dynamic System Check
      const freeMem = os.freemem() / os.totalmem();
      const loadAvg = os.loadavg()[0];
      const cpuCount = os.cpus().length;

      if (freeMem < 0.2 || loadAvg > cpuCount * 0.8) {
        throw new InternalServerErrorException('System under high load. Try again later.');
      }

      const writeStream = createWriteStream(filePath);
      try {
        await pipeline(file.stream, writeStream);
      } catch (error) {
        throw new InternalServerErrorException('File stream failed.');
      }
    };

    try {
      await limit(() => writeFn());
    } catch (err) {
      throw new InternalServerErrorException(err.message || 'File upload failed.');
    }
  }
}
