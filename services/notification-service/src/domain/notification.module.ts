import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Persistence Entities
import { NotificationEntity } from '@infrastructure/persistence/entities/notification.entity';
import { TemplateEntity } from '@infrastructure/persistence/entities/template.entity';

// Repositories
import { NotificationRepository } from '@infrastructure/persistence/repositories/notification.repository';
import { TemplateRepository } from '@infrastructure/persistence/repositories/template.repository';

// Providers
import { EmailProvider } from '@infrastructure/providers/email.provider';
import { SmsProvider } from '@infrastructure/providers/sms.provider';
import { PushProvider } from '@infrastructure/providers/push.provider';

// Command Handlers
import { SendEmailHandler } from '@application/commands/handlers/send-email.handler';
import { SendSmsHandler } from '@application/commands/handlers/send-sms.handler';
import { SendPushHandler } from '@application/commands/handlers/send-push.handler';
import { CreateTemplateHandler } from '@application/commands/handlers/create-template.handler';
import { UpdateTemplateHandler } from '@application/commands/handlers/update-template.handler';
import { DeleteTemplateHandler } from '@application/commands/handlers/delete-template.handler';

// Query Handlers
import { GetTemplateHandler } from '@application/queries/handlers/get-template.handler';
import { ListTemplatesHandler } from '@application/queries/handlers/list-templates.handler';
import { GetNotificationHandler } from '@application/queries/handlers/get-notification.handler';
import { ListNotificationsHandler } from '@application/queries/handlers/list-notifications.handler';

// Kafka Consumer
import { NotificationEventsConsumer } from '@infrastructure/kafka/notification-events.consumer';

// Presentation
import { NotificationController } from '@presentation/grpc/notification.controller';

const CommandHandlers = [
  SendEmailHandler,
  SendSmsHandler,
  SendPushHandler,
  CreateTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
];

const QueryHandlers = [
  GetTemplateHandler,
  ListTemplatesHandler,
  GetNotificationHandler,
  ListNotificationsHandler,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([NotificationEntity, TemplateEntity])],
  controllers: [NotificationController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    // Repositories
    {
      provide: 'NotificationRepository',
      useClass: NotificationRepository,
    },
    {
      provide: 'TemplateRepository',
      useClass: TemplateRepository,
    },
    // Providers
    EmailProvider,
    SmsProvider,
    PushProvider,
    // Kafka Consumer
    NotificationEventsConsumer,
  ],
  exports: ['NotificationRepository', 'TemplateRepository'],
})
export class NotificationModule {}
