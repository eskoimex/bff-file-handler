import { Controller, Get } from '@nestjs/common';
import * as osu from 'node-os-utils';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import { promises as fs } from 'fs';
import { join } from 'path';

@Controller('health')
export class HealthController {
  constructor(private readonly cbService: CircuitBreakerService) {}

  @Get()
  async checkHealth() {
    try {
      const cpuUsage = await osu.cpu.usage();
      const mem = await osu.mem.info();

      const uploadPath = join(__dirname, '..', '..', 'uploads');
      let fsWritable = false;
      try {
        await fs.access(uploadPath, fs.constants.W_OK);
        fsWritable = true;
      } catch {
        fsWritable = false;
      }

      let circuitHealthy = false;
      try {
        await this.cbService.fire(async () => 'ok');
        circuitHealthy = true;
      } catch {
        circuitHealthy = false;
      }

      return {
        status: 'ok',
        cpu: `${cpuUsage}%`,
        freeMemory: `${mem.freeMemMb}MB`,
        dependencies: {
          fileSystemWritable: fsWritable,
          circuitBreaker: circuitHealthy ? 'healthy' : 'unhealthy',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to retrieve health information',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

