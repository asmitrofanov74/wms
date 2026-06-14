import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './api/common/filters/http-exception.filter';
import { TransformInterceptor } from './api/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './api/common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const fieldErrors: Record<string, string[]> = {};
        for (const err of errors) {
          if (err.constraints) {
            fieldErrors[err.property] = Object.values(err.constraints);
          }
          if (err.children?.length) {
            for (const child of err.children) {
              if (child.constraints) {
                const key = `${err.property}.${child.property}`;
                fieldErrors[key] = Object.values(child.constraints);
              }
            }
          }
        }
        return new BadRequestException({
          message: 'Validation failed',
          errors: fieldErrors,
        });
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('WMS API')
    .setDescription('Warehouse Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`WMS API running on port ${port}`);
}

bootstrap();
