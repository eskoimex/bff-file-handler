import { Injectable, NestMiddleware } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class DynamicRateLimiterMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const freeMemRatio = os.freemem() / os.totalmem();
    const loadAvg = os.loadavg()[0]; 
    const cpuCount = os.cpus().length;

    // Custom thresholds
    const isMemoryLow = freeMemRatio < 0.2;
    const isCpuBusy = loadAvg > cpuCount * 0.8;

    if (isMemoryLow || isCpuBusy) {
      return res.status(429).json({
        message: 'Too many requests – server is under high load. Please try again shortly.',
      });
    }

    next();
  }
}
