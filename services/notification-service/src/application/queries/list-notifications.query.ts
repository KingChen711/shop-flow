import { NotificationChannel, NotificationStatus } from '@domain/entities/notification.entity';

export class ListNotificationsQuery {
  constructor(
    public readonly userId?: string,
    public readonly channel?: NotificationChannel,
    public readonly status?: NotificationStatus,
    public readonly referenceId?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {}
}
