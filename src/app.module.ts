import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { DynamicRateLimiterMiddleware } from './common/middleware/dynamic-rate-limiter.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: 10000, 
        limit: 1,
      }]
    }),
    UploadModule,
    AuthModule,
    HealthModule,
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
  }
}