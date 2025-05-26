import { Injectable } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  private breaker;

  constructor() {
    this.breaker = new CircuitBreaker(
      async (fn: () => Promise<any>) => await fn(),
      {
        timeout: Number(process.env.CIRCUIT_BREAKER_TIMEOUT),
        errorThresholdPercentage: Number(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE),
        resetTimeout: Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT),
      },
    );
  }

  async fire(fn: () => Promise<any>) {
    return this.breaker.fire(fn);
  }
}
