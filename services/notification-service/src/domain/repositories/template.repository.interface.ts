import { NotificationChannel } from '../entities/notification.entity';
import { Template, TemplateType } from '../entities/template.entity';

export interface FindTemplatesOptions {
  channel?: NotificationChannel;
  type?: TemplateType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ITemplateRepository {
  save(template: Template): Promise<Template>;
  findById(id: string): Promise<Template | null>;
  findByTypeAndChannel(type: TemplateType, channel: NotificationChannel): Promise<Template | null>;
  findMany(options: FindTemplatesOptions): Promise<{ templates: Template[]; total: number }>;
  update(template: Template): Promise<Template>;
  delete(id: string): Promise<void>;
}
