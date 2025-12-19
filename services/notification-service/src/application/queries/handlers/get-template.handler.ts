import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTemplateQuery } from '../get-template.query';
import { Template } from '@domain/entities/template.entity';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<GetTemplateQuery> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(query: GetTemplateQuery): Promise<Template> {
    const template = await this.templateRepository.findById(query.templateId);
    if (!template) {
      throw new NotFoundError(`Template not found: ${query.templateId}`);
    }
    return template;
  }
}
