import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logging.interceptor';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from './common/request-context.service';
import { JsonLoggerService } from './common/logger/json-logger.service';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req, res, next) => {
    req['requestId'] = uuidv4();
    next();
  });

  const contextService = app.get(RequestContextService);
  app.useGlobalInterceptors(new LoggingInterceptor(), new RequestIdInterceptor(contextService));

  const jsonLogger = new JsonLoggerService(contextService);
  app.useLogger(jsonLogger);

  
  app.useGlobalInterceptors();


 await app.listen(process.env.PORT ?? 3000);
}
bootstrap();