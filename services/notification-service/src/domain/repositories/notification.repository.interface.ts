import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '../entities/notification.entity';

export interface FindNotificationsOptions {
  userId?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  referenceId?: string;
  page?: number;
  limit?: number;
}

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByReferenceId(referenceId: string): Promise<Notification[]>;
  findMany(
    options: FindNotificationsOptions
  ): Promise<{ notifications: Notification[]; total: number }>;
  update(notification: Notification): Promise<Notification>;
}
