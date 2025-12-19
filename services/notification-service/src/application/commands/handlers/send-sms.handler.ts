import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SendSmsCommand } from '../send-sms.command';
import { Notification, NotificationChannel } from '@domain/entities/notification.entity';
import { INotificationRepository } from '@domain/repositories/notification.repository.interface';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';
import { SmsProvider } from '@infrastructure/providers/sms.provider';
import { NotFoundError } from '@shopflow/shared-utils';

@CommandHandler(SendSmsCommand)
export class SendSmsHandler implements ICommandHandler<SendSmsCommand> {
  private readonly logger = new Logger(SendSmsHandler.name);

  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository,
    private readonly smsProvider: SmsProvider
  ) {}

  async execute(command: SendSmsCommand): Promise<Notification> {
    const {
      phoneNumber,
      templateId,
      customMessage,
      variables,
      userId,
      referenceId,
      referenceType,
    } = command;

    let message: string;

    // Use template or custom content
    if (templateId) {
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new NotFoundError(`Template not found: ${templateId}`);
      }
      if (!template.isActive) {
        throw new Error(`Template is not active: ${templateId}`);
      }

      const rendered = template.render(variables || {});
      message = rendered.body;
    } else if (customMessage) {
      message = customMessage;
    } else {
      throw new Error('Either templateId or customMessage must be provided');
    }

    // Create notification record
    const notification = Notification.create({
      userId,
      channel: NotificationChannel.SMS,
      recipient: phoneNumber,
      body: message,
      templateId,
      referenceId,
      referenceType,
    });

    // Save pending notification
    await this.notificationRepository.save(notification);

    // Send SMS
    const result = await this.smsProvider.sendSms({
      to: phoneNumber,
      message,
    });

    // Update notification status
    if (result.success) {
      notification.markSent();
      this.logger.log(`SMS sent successfully to ${phoneNumber}`);
    } else {
      notification.markFailed(result.error || 'Unknown error');
      this.logger.error(`Failed to send SMS to ${phoneNumber}: ${result.error}`);
    }

    await this.notificationRepository.update(notification);

    return notification;
  }
}
