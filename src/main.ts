import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logging.interceptor';
import { v4 as uuidv4 } from 'uuid';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req, res, next) => {
    req['requestId'] = uuidv4();
    next();
  });

  app.useGlobalInterceptors(new LoggingInterceptor());

 await app.listen(process.env.PORT ?? 3000);
}
bootstrap();