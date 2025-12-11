import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Outbox table for the Transactional Outbox Pattern
 * Events are written to this table within the same transaction as domain changes
 * A separate process (OutboxProcessor) reads from this table and publishes to Kafka
 */
@Entity('outbox_events')
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aggregate_type' })
  @Index()
  aggregateType: string;

  @Column({ name: 'aggregate_id' })
  @Index()
  aggregateId: string;

  @Column({ name: 'event_type' })
  @Index()
  eventType: string;

  @Column('jsonb')
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ name: 'is_processed', default: false })
  @Index()
  isProcessed: boolean;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}
