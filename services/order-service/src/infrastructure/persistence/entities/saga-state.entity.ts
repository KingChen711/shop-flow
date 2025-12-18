import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('saga_states')
export class SagaStateEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  @Index()
  orderId: string;

  @Column({ type: 'varchar', length: 30 })
  @Index()
  status: string;

  @Column({ name: 'current_step', type: 'varchar', length: 30 })
  currentStep: string;

  @Column({ name: 'completed_steps', type: 'simple-array' })
  completedSteps: string[];

  @Column({ name: 'reservation_ids', type: 'simple-array', nullable: true })
  reservationIds: string[];

  @Column({ name: 'payment_id', type: 'varchar', length: 100, nullable: true })
  paymentId?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
