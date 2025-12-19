import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { UpdateTemplateCommand } from '../update-template.command';
import { Template } from '@domain/entities/template.entity';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

@CommandHandler(UpdateTemplateCommand)
export class UpdateTemplateHandler implements ICommandHandler<UpdateTemplateCommand> {
  private readonly logger = new Logger(UpdateTemplateHandler.name);

  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(command: UpdateTemplateCommand): Promise<Template> {
    const { templateId, name, subject, body, isActive } = command;

    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundError(`Template not found: ${templateId}`);
    }

    template.update({ name, subject, body, isActive });

    await this.templateRepository.update(template);

    this.logger.log(`Template updated: ${templateId}`);

    return template;
  }
}
