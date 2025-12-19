import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListTemplatesQuery } from '../list-templates.query';
import { Template } from '@domain/entities/template.entity';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';

export interface ListTemplatesResult {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@QueryHandler(ListTemplatesQuery)
export class ListTemplatesHandler implements IQueryHandler<ListTemplatesQuery> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(query: ListTemplatesQuery): Promise<ListTemplatesResult> {
    const { channel, type, page, limit } = query;

    const { templates, total } = await this.templateRepository.findMany({
      channel,
      type,
      page,
      limit,
    });

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
