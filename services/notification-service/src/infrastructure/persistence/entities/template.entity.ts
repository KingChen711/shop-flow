import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('templates')
@Unique(['type', 'channel'])
export class TemplateEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  type: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  channel: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
