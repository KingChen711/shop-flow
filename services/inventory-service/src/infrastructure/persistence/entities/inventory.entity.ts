import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  Index,
} from 'typeorm';

@Entity('inventories')
export class InventoryEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'varchar', length: 100, unique: true })
  @Index()
  productId: string;

  @Column({ name: 'total_stock', type: 'integer', default: 0 })
  totalStock: number;

  @Column({ name: 'reserved_stock', type: 'integer', default: 0 })
  reservedStock: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
