import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from '../persistence/entities/outbox.entity';
import { OutboxService } from './outbox.service';
import { OutboxProcessor } from './outbox.processor';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity]), KafkaModule],
  providers: [OutboxService, OutboxProcessor],
  exports: [OutboxService],
})
export class OutboxModule {}
