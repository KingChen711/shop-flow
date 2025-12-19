import { NotificationChannel } from '@domain/entities/notification.entity';
import { TemplateType } from '@domain/entities/template.entity';

export class CreateTemplateCommand {
  constructor(
    public readonly name: string,
    public readonly type: TemplateType,
    public readonly channel: NotificationChannel,
    public readonly subject: string | undefined,
    public readonly body: string,
    public readonly isActive: boolean = true
  ) {}
}
