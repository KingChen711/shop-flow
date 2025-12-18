import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'varchar', length: 100 })
  @Index()
  orderId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 100 })
  @Index()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 30 })
  @Index()
  status: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod: string;

  @Column({ name: 'transaction_id', type: 'varchar', length: 100, nullable: true })
  transactionId?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'refunded_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 100, unique: true })
  @Index()
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
