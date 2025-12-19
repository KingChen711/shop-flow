import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SendEmailCommand } from '../send-email.command';
import { Notification, NotificationChannel } from '@domain/entities/notification.entity';
import { INotificationRepository } from '@domain/repositories/notification.repository.interface';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';
import { EmailProvider } from '@infrastructure/providers/email.provider';
import { NotFoundError } from '@shopflow/shared-utils';

@CommandHandler(SendEmailCommand)
export class SendEmailHandler implements ICommandHandler<SendEmailCommand> {
  private readonly logger = new Logger(SendEmailHandler.name);

  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository,
    private readonly emailProvider: EmailProvider
  ) {}

  async execute(command: SendEmailCommand): Promise<Notification> {
    const {
      recipientEmail,
      recipientName,
      templateId,
      customSubject,
      customBody,
      variables,
      userId,
      referenceId,
      referenceType,
    } = command;

    this.logger.log(`Executing SendEmailCommand: to=${recipientEmail}, templateId=${templateId}`);

    let subject: string;
    let body: string;

    // Use template or custom content
    if (templateId) {
      this.logger.log(`Looking up template: ${templateId}`);
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new NotFoundError(`Template not found: ${templateId}`);
      }
      this.logger.log(`Template found: ${template.name}, isActive: ${template.isActive}`);
      if (!template.isActive) {
        throw new Error(`Template is not active: ${templateId}`);
      }

      const rendered = template.render(variables || {});
      subject = rendered.subject || 'Notification';
      body = rendered.body;

      // Replace recipient name placeholder
      body = body.replace(/{{recipientName}}/g, recipientName);
      subject = subject.replace(/{{recipientName}}/g, recipientName);
    } else if (customSubject && customBody) {
      subject = customSubject;
      body = customBody;
    } else {
      throw new Error('Either templateId or customSubject/customBody must be provided');
    }

    // Create notification record
    this.logger.log(`Creating notification for ${recipientEmail}`);
    const notification = Notification.create({
      userId,
      channel: NotificationChannel.EMAIL,
      recipient: recipientEmail,
      subject,
      body,
      templateId,
      referenceId,
      referenceType,
    });

    // Save pending notification
    this.logger.log(`Saving notification: ${notification.id}`);
    await this.notificationRepository.save(notification);
    this.logger.log(`Notification saved successfully`);

    // Send email
    const result = await this.emailProvider.sendEmail({
      to: recipientEmail,
      subject,
      body,
      html: true,
    });

    // Update notification status
    if (result.success) {
      notification.markSent();
      this.logger.log(`Email sent successfully to ${recipientEmail}`);
    } else {
      notification.markFailed(result.error || 'Unknown error');
      this.logger.error(`Failed to send email to ${recipientEmail}: ${result.error}`);
    }

    await this.notificationRepository.update(notification);

    return notification;
  }
}
