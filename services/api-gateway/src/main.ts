import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ShopFlow API')
    .setDescription(
      `
## ShopFlow E-Commerce API

This API Gateway provides a unified REST interface to all ShopFlow microservices.

### Services
- **Auth**: User registration, login, token management
- **Products**: Product and category management
- **Orders**: Order creation and management
- **Cart**: Shopping cart operations
- **Search**: Full-text product search

### Authentication
Most endpoints require a Bearer token. Use the \`/auth/login\` endpoint to obtain tokens.
    `
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Health check endpoints')
    .addTag('Authentication', 'User authentication and registration')
    .addTag('Products', 'Product management')
    .addTag('Categories', 'Category management')
    .addTag('Orders', 'Order management')
    .addTag('Cart', 'Shopping cart operations')
    .addTag('Search', 'Product search and suggestions')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`
  🚀 API Gateway is running
  📍 REST API: http://localhost:${port}/api/v1
  📚 Swagger: http://localhost:${port}/api/docs
  🏥 Health:  http://localhost:${port}/api/v1/health
  `);
}

bootstrap();
