import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListNotificationsQuery } from '../list-notifications.query';
import { Notification } from '@domain/entities/notification.entity';
import { INotificationRepository } from '@domain/repositories/notification.repository.interface';

export interface ListNotificationsResult {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@QueryHandler(ListNotificationsQuery)
export class ListNotificationsHandler implements IQueryHandler<ListNotificationsQuery> {
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(query: ListNotificationsQuery): Promise<ListNotificationsResult> {
    const { userId, channel, status, referenceId, page, limit } = query;

    const { notifications, total } = await this.notificationRepository.findMany({
      userId,
      channel,
      status,
      referenceId,
      page,
      limit,
    });

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
