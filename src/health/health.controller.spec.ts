import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import * as osu from 'node-os-utils';
import { promises as fs } from 'fs';

jest.mock('node-os-utils', () => ({
  cpu: { usage: jest.fn() },
  mem: { info: jest.fn() },
}));

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      ...actualFs.promises,
      access: jest.fn(),
    },
  };
});

describe('HealthController', () => {
  let controller: HealthController;
  let cbService: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: CircuitBreakerService,
          useValue: {
            fire: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    cbService = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // it('should return healthy status when everything works', async () => {
  //   (osu.cpu.usage as jest.Mock).mockResolvedValue(35.5);
  //   (fs.access as jest.Mock).mockResolvedValue(undefined); // simulate success
  //   (fs.access as jest.Mock).mockResolvedValue(undefined); // simulate success
  //   (fs.access as jest.Mock).mockResolvedValue(undefined); // simulate success
  //   (cbService.fire as jest.Mock).mockResolvedValue('ok');

  //   const result = await controller.checkHealth();

  //   expect(result).toEqual({
  //     status: 'ok',
  //     cpu: '35.5%',
  //     freeMemory: '4096MB',
  //     dependencies: {
  //       fileSystemWritable: true,
  //       circuitBreaker: 'healthy',
  //     },
  //   });
  // });

  it('should return healthy status when everything works', async () => {
  (osu.cpu.usage as jest.Mock).mockResolvedValue(35.5);
  (osu.mem.info as jest.Mock).mockResolvedValue({ freeMemMb: 4096 }); // <-- ADD THIS
  (fs.access as jest.Mock).mockResolvedValue(undefined);
  (cbService.fire as jest.Mock).mockResolvedValue('ok');

  const result = await controller.checkHealth();

  expect(result).toEqual({
    status: 'ok',
    cpu: '35.5%',
    freeMemory: '4096MB',
    dependencies: {
      fileSystemWritable: true,
      circuitBreaker: 'healthy',
    },
  });
});

  it('should mark file system as not writable if fs.access fails', async () => {
    (osu.cpu.usage as jest.Mock).mockResolvedValue(45);
    (osu.mem.info as jest.Mock).mockResolvedValue({ freeMemMb: 2048 });
    (fs.access as jest.Mock).mockRejectedValue(new Error('No access')); // simulate failure
    (cbService.fire as jest.Mock).mockResolvedValue('ok');

    const result = await controller.checkHealth();

    expect(result.status).toBe('ok');
    expect(result.dependencies.fileSystemWritable).toBe(false);
    expect(result.dependencies.circuitBreaker).toBe('healthy');
  });

  it('should mark circuit breaker as unhealthy if fire fails', async () => {
    (osu.cpu.usage as jest.Mock).mockResolvedValue(55);
    (osu.mem.info as jest.Mock).mockResolvedValue({ freeMemMb: 1024 });
    (fs.access as jest.Mock).mockResolvedValue(undefined); // simulate success
    (cbService.fire as jest.Mock).mockRejectedValue(new Error('Breaker down')); // simulate failure

    const result = await controller.checkHealth();

    expect(result.status).toBe('ok');
    expect(result.dependencies.fileSystemWritable).toBe(true);
    expect(result.dependencies.circuitBreaker).toBe('unhealthy');
  });

  it('should return error status on unexpected failure', async () => {
    (osu.cpu.usage as jest.Mock).mockRejectedValue(new Error('CPU error'));

    const result = await controller.checkHealth();

    expect(result.status).toBe('error');
    expect(result.message).toBe('Failed to retrieve health information');
    expect(result.error).toBe('CPU error');
  });
});
