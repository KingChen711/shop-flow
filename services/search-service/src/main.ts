import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReflectionService } from '@grpc/reflection';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || 50057;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'search',
      protoPath: join(__dirname, '../../../packages/proto/search/search.proto'),
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

  const esNode = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
  const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';

  console.log(`
  🔍 Search Service is running on gRPC port ${grpcPort}
  📡 gRPC Reflection ${process.env.NODE_ENV === 'development' ? 'enabled' : 'disabled'}
  🔎 Elasticsearch: ${esNode}
  📨 Kafka CDC: ${kafkaBroker}
  `);
}

bootstrap();
