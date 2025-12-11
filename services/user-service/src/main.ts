import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReflectionService } from '@grpc/reflection';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const protoPath = join(__dirname, '../../../packages/proto/user/user.proto');
  const grpcPort = process.env.GRPC_PORT || 50051;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Create gRPC microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath,
      url: `0.0.0.0:${grpcPort}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      // Enable gRPC reflection in development for easier testing
      onLoadPackageDefinition: isDevelopment
        ? (pkg, server) => {
            new ReflectionService(pkg).addToServer(server);
          }
        : undefined,
    },
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  await app.listen();

  console.log(`🚀 User Service is running on gRPC port ${grpcPort}`);
  if (isDevelopment) {
    console.log(`📡 gRPC Reflection enabled (development mode)`);
  }
}

bootstrap();
