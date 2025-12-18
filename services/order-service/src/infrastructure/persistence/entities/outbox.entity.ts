import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('outbox_events')
export class OutboxEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  @Index()
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 100 })
  @Index()
  aggregateId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  @Index()
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  @Index()
  processed: boolean;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
