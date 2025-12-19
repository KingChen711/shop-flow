import { NotificationChannel } from '@domain/entities/notification.entity';
import { TemplateType } from '@domain/entities/template.entity';

export class ListTemplatesQuery {
  constructor(
    public readonly channel?: NotificationChannel,
    public readonly type?: TemplateType,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {}
}
