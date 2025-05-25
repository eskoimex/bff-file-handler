import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { DynamicRateLimiterMiddleware } from './common/middleware/dynamic-rate-limiter.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CommonModule } from './common/common.module';


@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: Number(process.env.THROTTLE_TTL), 
        limit: Number(process.env.THROTTLE_LIMIT),
      }]
    }),
    UploadModule,
    AuthModule,
    HealthModule,
    CommonModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DynamicRateLimiterMiddleware)
      .forRoutes('upload'); 

    consumer.apply(RequestIdMiddleware).forRoutes('*');
  
  }
}


