import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReflectionService } from '@grpc/reflection';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || 50056;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'notification',
      protoPath: join(__dirname, '../../../packages/proto/notification/notification.proto'),
      url: `0.0.0.0:${grpcPort}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      onLoadPackageDefinition: (pkg, server) => {
        if (process.env.NODE_ENV === 'development') {
          new ReflectionService(pkg).addToServer(server);
        }
      },
    },
  });

  await app.listen();

  const emailProvider = (process.env.EMAIL_PROVIDER || 'simulate').toUpperCase();
  const smsProvider = process.env.SMS_SIMULATE === 'false' ? 'Twilio' : 'Simulation';
  const pushProvider = process.env.PUSH_SIMULATE === 'false' ? 'Firebase' : 'Simulation';

  console.log(`
  🔔 Notification Service is running on gRPC port ${grpcPort}
  📡 gRPC Reflection ${process.env.NODE_ENV === 'development' ? 'enabled' : 'disabled'}
  📧 Email Provider: ${emailProvider === 'SES' ? 'AWS SES' : emailProvider === 'SMTP' ? 'SMTP' : 'Simulation'}
  📱 SMS Provider: ${smsProvider}
  🔔 Push Provider: ${pushProvider}
  `);
}

bootstrap();
