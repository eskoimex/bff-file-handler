import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CircuitBreakerService } from '../common/circuit-breaker.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, CircuitBreakerService],
})
export class UploadModule {}
