import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '@domain/entities/notification.entity';
import {
  INotificationRepository,
  FindNotificationsOptions,
} from '@domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const entity = this.toEntity(notification);
    await this.repository.save(entity);
    return notification;
  }

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByReferenceId(referenceId: string): Promise<Notification[]> {
    const entities = await this.repository.find({
      where: { referenceId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findMany(
    options: FindNotificationsOptions
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { userId, channel, status, referenceId, page = 1, limit = 10 } = options;

    const queryBuilder = this.repository.createQueryBuilder('notification');

    if (userId) {
      queryBuilder.andWhere('notification.userId = :userId', { userId });
    }
    if (channel) {
      queryBuilder.andWhere('notification.channel = :channel', { channel });
    }
    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }
    if (referenceId) {
      queryBuilder.andWhere('notification.referenceId = :referenceId', { referenceId });
    }

    queryBuilder.orderBy('notification.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      notifications: entities.map((e) => this.toDomain(e)),
      total,
    };
  }

  async update(notification: Notification): Promise<Notification> {
    const entity = this.toEntity(notification);
    await this.repository.save(entity);
    return notification;
  }

  private toEntity(notification: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = notification.id;
    entity.userId = notification.userId;
    entity.channel = notification.channel;
    entity.status = notification.status;
    entity.recipient = notification.recipient;
    entity.subject = notification.subject;
    entity.body = notification.body;
    entity.templateId = notification.templateId;
    entity.referenceId = notification.referenceId;
    entity.referenceType = notification.referenceType;
    entity.errorMessage = notification.errorMessage;
    entity.createdAt = notification.createdAt;
    entity.sentAt = notification.sentAt;
    return entity;
  }

  private toDomain(entity: NotificationEntity): Notification {
    return Notification.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      channel: entity.channel as NotificationChannel,
      status: entity.status as NotificationStatus,
      recipient: entity.recipient,
      subject: entity.subject,
      body: entity.body,
      templateId: entity.templateId,
      referenceId: entity.referenceId,
      referenceType: entity.referenceType,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      sentAt: entity.sentAt,
    });
  }
}
