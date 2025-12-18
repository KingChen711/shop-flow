import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 100 })
  @Index()
  userId: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  status: string;

  @Column({ name: 'shipping_address', type: 'text' })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items: OrderItemEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
