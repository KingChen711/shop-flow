import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationChannel } from '@domain/entities/notification.entity';
import { Template, TemplateType } from '@domain/entities/template.entity';
import {
  ITemplateRepository,
  FindTemplatesOptions,
} from '@domain/repositories/template.repository.interface';
import { TemplateEntity } from '../entities/template.entity';

@Injectable()
export class TemplateRepository implements ITemplateRepository {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly repository: Repository<TemplateEntity>
  ) {}

  async save(template: Template): Promise<Template> {
    const entity = this.toEntity(template);
    await this.repository.save(entity);
    return template;
  }

  async findById(id: string): Promise<Template | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTypeAndChannel(
    type: TemplateType,
    channel: NotificationChannel
  ): Promise<Template | null> {
    const entity = await this.repository.findOne({
      where: { type, channel, isActive: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findMany(options: FindTemplatesOptions): Promise<{ templates: Template[]; total: number }> {
    const { channel, type, isActive, page = 1, limit = 10 } = options;

    const queryBuilder = this.repository.createQueryBuilder('template');

    if (channel) {
      queryBuilder.andWhere('template.channel = :channel', { channel });
    }
    if (type) {
      queryBuilder.andWhere('template.type = :type', { type });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('template.isActive = :isActive', { isActive });
    }

    queryBuilder.orderBy('template.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      templates: entities.map((e) => this.toDomain(e)),
      total,
    };
  }

  async update(template: Template): Promise<Template> {
    const entity = this.toEntity(template);
    await this.repository.save(entity);
    return template;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toEntity(template: Template): TemplateEntity {
    const entity = new TemplateEntity();
    entity.id = template.id;
    entity.name = template.name;
    entity.type = template.type;
    entity.channel = template.channel;
    entity.subject = template.subject;
    entity.body = template.body;
    entity.isActive = template.isActive;
    entity.createdAt = template.createdAt;
    entity.updatedAt = template.updatedAt;
    return entity;
  }

  private toDomain(entity: TemplateEntity): Template {
    return Template.fromPersistence({
      id: entity.id,
      name: entity.name,
      type: entity.type as TemplateType,
      channel: entity.channel as NotificationChannel,
      subject: entity.subject,
      body: entity.body,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
