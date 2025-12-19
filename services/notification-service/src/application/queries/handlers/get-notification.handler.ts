import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetNotificationQuery } from '../get-notification.query';
import { Notification } from '@domain/entities/notification.entity';
import { INotificationRepository } from '@domain/repositories/notification.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

@QueryHandler(GetNotificationQuery)
export class GetNotificationHandler implements IQueryHandler<GetNotificationQuery> {
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(query: GetNotificationQuery): Promise<Notification> {
    const notification = await this.notificationRepository.findById(query.notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification not found: ${query.notificationId}`);
    }
    return notification;
  }
}
