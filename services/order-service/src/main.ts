import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReflectionService } from '@grpc/reflection';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || '50053';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const protoPath = join(__dirname, '../../../packages/proto/order/order.proto');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'order',
      protoPath,
      url: `0.0.0.0:${grpcPort}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      onLoadPackageDefinition: isDevelopment
        ? (pkg, server) => {
            new ReflectionService(pkg).addToServer(server);
          }
        : undefined,
    },
  });

  await app.listen();

  console.log(`📦 Order Service is running on gRPC port ${grpcPort}`);
  if (isDevelopment) {
    console.log('📡 gRPC Reflection enabled (development mode)');
  }
}

bootstrap();
