import { Injectable } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  private breaker;

  constructor() {
    this.breaker = new CircuitBreaker(
      async (fn: () => Promise<any>) => await fn(),
      {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      },
    );
  }

  async fire(fn: () => Promise<any>) {
    return this.breaker.fire(fn);
  }
}
