import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 100, nullable: true })
  @Index()
  userId?: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  channel: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  status: string;

  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  @Index()
  referenceId?: string;

  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  referenceType?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;
}
