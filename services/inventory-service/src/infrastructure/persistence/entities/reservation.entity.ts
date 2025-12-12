import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('reservations')
export class ReservationEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'varchar', length: 100 })
  @Index()
  orderId: string;

  @Column({ name: 'product_id', type: 'varchar', length: 100 })
  @Index()
  productId: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  status: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  @Index()
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
