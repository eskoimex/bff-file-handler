import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { CircuitBreakerService } from '../common/circuit-breaker.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, CircuitBreakerService],
})
export class HealthModule {}
