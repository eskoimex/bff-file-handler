import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadService } from './upload.service';
import type { File as MulterFile } from 'multer';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({ destination: './uploads' }),
    limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
  }))
  async uploadFile(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    await this.uploadService.handleUpload(file);
    return { message: 'Upload successful', filename: file.filename };
  }
}
