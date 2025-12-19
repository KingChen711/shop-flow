import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SendPushCommand } from '../send-push.command';
import { Notification, NotificationChannel } from '@domain/entities/notification.entity';
import { INotificationRepository } from '@domain/repositories/notification.repository.interface';
import { PushProvider } from '@infrastructure/providers/push.provider';

@CommandHandler(SendPushCommand)
export class SendPushHandler implements ICommandHandler<SendPushCommand> {
  private readonly logger = new Logger(SendPushHandler.name);

  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    private readonly pushProvider: PushProvider
  ) {}

  async execute(command: SendPushCommand): Promise<Notification> {
    const { userId, deviceToken, title, body, imageUrl, data, referenceId, referenceType } =
      command;

    // Create notification record
    const notification = Notification.create({
      userId,
      channel: NotificationChannel.PUSH,
      recipient: deviceToken,
      subject: title,
      body,
      referenceId,
      referenceType,
    });

    // Save pending notification
    await this.notificationRepository.save(notification);

    // Send push notification
    const result = await this.pushProvider.sendPush({
      deviceToken,
      title,
      body,
      imageUrl,
      data,
    });

    // Update notification status
    if (result.success) {
      notification.markSent();
      this.logger.log(`Push notification sent successfully to user ${userId}`);
    } else {
      notification.markFailed(result.error || 'Unknown error');
      this.logger.error(`Failed to send push notification to user ${userId}: ${result.error}`);
    }

    await this.notificationRepository.update(notification);

    return notification;
  }
}
