import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as grpc from '@grpc/grpc-js';

// Commands
import { SendEmailCommand } from '@application/commands/send-email.command';
import { SendSmsCommand } from '@application/commands/send-sms.command';
import { SendPushCommand } from '@application/commands/send-push.command';
import { CreateTemplateCommand } from '@application/commands/create-template.command';
import { UpdateTemplateCommand } from '@application/commands/update-template.command';
import { DeleteTemplateCommand } from '@application/commands/delete-template.command';

// Queries
import { GetTemplateQuery } from '@application/queries/get-template.query';
import { ListTemplatesQuery } from '@application/queries/list-templates.query';
import { GetNotificationQuery } from '@application/queries/get-notification.query';
import { ListNotificationsQuery } from '@application/queries/list-notifications.query';
import { ListTemplatesResult } from '@application/queries/handlers/list-templates.handler';
import { ListNotificationsResult } from '@application/queries/handlers/list-notifications.handler';

// Domain
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '@domain/entities/notification.entity';
import { Template, TemplateType } from '@domain/entities/template.entity';
import { NotFoundError, ConflictError } from '@shopflow/shared-utils';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  // ============================================
  // Template Management
  // ============================================

  @GrpcMethod('NotificationService', 'CreateTemplate')
  async createTemplate(data: any): Promise<any> {
    try {
      this.logger.log(`Creating template: ${data.name}`);

      // Default to active (true) for new templates
      // Note: proto bool defaults to false, but we want templates to be active by default
      const command = new CreateTemplateCommand(
        data.name,
        this.mapTemplateType(data.type),
        this.mapChannel(data.channel),
        data.subject,
        data.body,
        true // Always create as active - use UpdateTemplate to deactivate
      );

      const template: Template = await this.commandBus.execute(command);
      return this.toTemplateResponse(template);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('NotificationService', 'GetTemplate')
  async getTemplate(data: { template_id: string }): Promise<any> {
    try {
      const query = new GetTemplateQuery(data.template_id);
      const template: Template = await this.queryBus.execute(query);
      return this.toTemplateResponse(template);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('NotificationService', 'UpdateTemplate')
  async updateTemplate(data: any): Promise<any> {
    try {
      this.logger.log(`Updating template: ${data.template_id}`);

      const command = new UpdateTemplateCommand(
        data.template_id,
        data.name,
        data.subject,
        data.body,
        data.is_active
      );

      const template: Template = await this.commandBus.execute(command);
      return this.toTemplateResponse(template);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('NotificationService', 'DeleteTemplate')
  async deleteTemplate(data: { template_id: string }): Promise<any> {
    try {
      this.logger.log(`Deleting template: ${data.template_id}`);

      const command = new DeleteTemplateCommand(data.template_id);
      await this.commandBus.execute(command);

      return { success: true, message: 'Template deleted successfully' };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('NotificationService', 'ListTemplates')
  async listTemplates(data: any): Promise<any> {
    try {
      const query = new ListTemplatesQuery(
        data.channel ? this.mapChannel(data.channel) : undefined,
        data.type ? this.mapTemplateType(data.type) : undefined,
        data.page || 1,
        data.limit || 10
      );

      const result: ListTemplatesResult = await this.queryBus.execute(query);

      return {
        templates: result.templates.map((t) => this.toTemplateResponse(t)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================
  // Send Notifications
  // ============================================

  @GrpcMethod('NotificationService', 'SendEmail')
  async sendEmail(data: any): Promise<any> {
    try {
      this.logger.log(`Sending email to: ${data.recipient_email}`);

      const variables: Record<string, string> = {};
      if (data.variables) {
        for (const v of data.variables) {
          variables[v.key] = v.value;
        }
      }

      const command = new SendEmailCommand(
        data.recipient_email,
        data.recipient_name || 'Customer',
        data.template_id,
        data.custom_subject,
        data.custom_body,
        variables,
        data.user_id,
        data.reference_id,
        data.reference_type
      );

      const notification: Notification = await this.commandBus.execute(command);
      return this.toNotificationResponse(notification);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('NotificationService', 'SendSms')
  async sendSms(data: any): Promise<any> {
    try {
      this.logger.log(`Sending SMS to: ${data.phone_number}`);

      const variables: Record<string, string> = {};
      if (data.variables) {
        for (const v of data.variables) {
          variables[v.key] = v.value;
        }
      }

      const command = new SendSmsCommand(
        data.phone_number,
        data.template_id,
        data.custom_message,
        variables,
        data.user_id,
        data.reference_id,
        data.reference_type
      );

      const notification: Notification = await this.commandBus.execute(command);
      return this.toNotificationResponse(notification);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('NotificationService', 'SendPush')
  async sendPush(data: any): Promise<any> {
    try {
      this.logger.log(`Sending push to user: ${data.user_id}`);

      // Convert repeated PushDataEntry to Record<string, string>
      const pushData: Record<string, string> = {};
      if (data.data && Array.isArray(data.data)) {
        for (const entry of data.data) {
          pushData[entry.key] = entry.value;
        }
      }

      const command = new SendPushCommand(
        data.user_id,
        data.device_token,
        data.title,
        data.body,
        data.image_url,
        pushData,
        data.reference_id,
        data.reference_type
      );

      const notification: Notification = await this.commandBus.execute(command);
      return this.toNotificationResponse(notification);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================
  // Notification History
  // ============================================

  @GrpcMethod('NotificationService', 'GetNotification')
  async getNotification(data: { notification_id: string }): Promise<any> {
    try {
      const query = new GetNotificationQuery(data.notification_id);
      const notification: Notification = await this.queryBus.execute(query);
      return this.toNotificationResponse(notification);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('NotificationService', 'ListNotifications')
  async listNotifications(data: any): Promise<any> {
    try {
      const query = new ListNotificationsQuery(
        data.user_id,
        data.channel ? this.mapChannel(data.channel) : undefined,
        data.status ? this.mapStatus(data.status) : undefined,
        data.reference_id,
        data.page || 1,
        data.limit || 10
      );

      const result: ListNotificationsResult = await this.queryBus.execute(query);

      return {
        notifications: result.notifications.map((n) => this.toNotificationResponse(n)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================
  // Mappers
  // ============================================

  private toTemplateResponse(template: Template): any {
    return {
      id: template.id,
      name: template.name,
      type: this.toProtoTemplateType(template.type),
      channel: this.toProtoChannel(template.channel),
      subject: template.subject || '',
      body: template.body,
      is_active: template.isActive,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    };
  }

  private toNotificationResponse(notification: Notification): any {
    return {
      id: notification.id,
      user_id: notification.userId || '',
      channel: this.toProtoChannel(notification.channel),
      status: this.toProtoStatus(notification.status),
      recipient: notification.recipient,
      subject: notification.subject || '',
      body: notification.body,
      template_id: notification.templateId || '',
      reference_id: notification.referenceId || '',
      reference_type: notification.referenceType || '',
      error_message: notification.errorMessage || '',
      created_at: notification.createdAt.toISOString(),
      sent_at: notification.sentAt?.toISOString() || '',
    };
  }

  private mapChannel(protoChannel: string): NotificationChannel {
    const map: Record<string, NotificationChannel> = {
      NOTIFICATION_CHANNEL_EMAIL: NotificationChannel.EMAIL,
      NOTIFICATION_CHANNEL_SMS: NotificationChannel.SMS,
      NOTIFICATION_CHANNEL_PUSH: NotificationChannel.PUSH,
    };
    return map[protoChannel] || NotificationChannel.EMAIL;
  }

  private toProtoChannel(channel: NotificationChannel): string {
    const map: Record<NotificationChannel, string> = {
      [NotificationChannel.EMAIL]: 'NOTIFICATION_CHANNEL_EMAIL',
      [NotificationChannel.SMS]: 'NOTIFICATION_CHANNEL_SMS',
      [NotificationChannel.PUSH]: 'NOTIFICATION_CHANNEL_PUSH',
    };
    return map[channel];
  }

  private mapStatus(protoStatus: string): NotificationStatus {
    const map: Record<string, NotificationStatus> = {
      NOTIFICATION_STATUS_PENDING: NotificationStatus.PENDING,
      NOTIFICATION_STATUS_SENT: NotificationStatus.SENT,
      NOTIFICATION_STATUS_DELIVERED: NotificationStatus.DELIVERED,
      NOTIFICATION_STATUS_FAILED: NotificationStatus.FAILED,
    };
    return map[protoStatus] || NotificationStatus.PENDING;
  }

  private toProtoStatus(status: NotificationStatus): string {
    const map: Record<NotificationStatus, string> = {
      [NotificationStatus.PENDING]: 'NOTIFICATION_STATUS_PENDING',
      [NotificationStatus.SENT]: 'NOTIFICATION_STATUS_SENT',
      [NotificationStatus.DELIVERED]: 'NOTIFICATION_STATUS_DELIVERED',
      [NotificationStatus.FAILED]: 'NOTIFICATION_STATUS_FAILED',
    };
    return map[status];
  }

  private mapTemplateType(protoType: string): TemplateType {
    const map: Record<string, TemplateType> = {
      TEMPLATE_TYPE_ORDER_CREATED: TemplateType.ORDER_CREATED,
      TEMPLATE_TYPE_ORDER_CONFIRMED: TemplateType.ORDER_CONFIRMED,
      TEMPLATE_TYPE_ORDER_SHIPPED: TemplateType.ORDER_SHIPPED,
      TEMPLATE_TYPE_ORDER_DELIVERED: TemplateType.ORDER_DELIVERED,
      TEMPLATE_TYPE_ORDER_CANCELLED: TemplateType.ORDER_CANCELLED,
      TEMPLATE_TYPE_PAYMENT_SUCCESS: TemplateType.PAYMENT_SUCCESS,
      TEMPLATE_TYPE_PAYMENT_FAILED: TemplateType.PAYMENT_FAILED,
      TEMPLATE_TYPE_WELCOME: TemplateType.WELCOME,
      TEMPLATE_TYPE_PASSWORD_RESET: TemplateType.PASSWORD_RESET,
      TEMPLATE_TYPE_CUSTOM: TemplateType.CUSTOM,
    };
    return map[protoType] || TemplateType.CUSTOM;
  }

  private toProtoTemplateType(type: TemplateType): string {
    const map: Record<TemplateType, string> = {
      [TemplateType.ORDER_CREATED]: 'TEMPLATE_TYPE_ORDER_CREATED',
      [TemplateType.ORDER_CONFIRMED]: 'TEMPLATE_TYPE_ORDER_CONFIRMED',
      [TemplateType.ORDER_SHIPPED]: 'TEMPLATE_TYPE_ORDER_SHIPPED',
      [TemplateType.ORDER_DELIVERED]: 'TEMPLATE_TYPE_ORDER_DELIVERED',
      [TemplateType.ORDER_CANCELLED]: 'TEMPLATE_TYPE_ORDER_CANCELLED',
      [TemplateType.PAYMENT_SUCCESS]: 'TEMPLATE_TYPE_PAYMENT_SUCCESS',
      [TemplateType.PAYMENT_FAILED]: 'TEMPLATE_TYPE_PAYMENT_FAILED',
      [TemplateType.WELCOME]: 'TEMPLATE_TYPE_WELCOME',
      [TemplateType.PASSWORD_RESET]: 'TEMPLATE_TYPE_PASSWORD_RESET',
      [TemplateType.CUSTOM]: 'TEMPLATE_TYPE_CUSTOM',
    };
    return map[type];
  }

  private handleError(error: unknown): never {
    this.logger.error('Error occurred:', error);

    if (error instanceof NotFoundError) {
      throw new RpcException({
        code: grpc.status.NOT_FOUND,
        message: error.message,
      });
    }
    if (error instanceof ConflictError) {
      throw new RpcException({
        code: grpc.status.ALREADY_EXISTS,
        message: error.message,
      });
    }
    if (error instanceof Error) {
      this.logger.error(`Internal error: ${error.message}`, error.stack);
      throw new RpcException({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
    throw new RpcException({
      code: grpc.status.INTERNAL,
      message: 'Unknown error',
    });
  }
}
