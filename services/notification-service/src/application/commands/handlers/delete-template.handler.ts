import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DeleteTemplateCommand } from '../delete-template.command';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

@CommandHandler(DeleteTemplateCommand)
export class DeleteTemplateHandler implements ICommandHandler<DeleteTemplateCommand> {
  private readonly logger = new Logger(DeleteTemplateHandler.name);

  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(command: DeleteTemplateCommand): Promise<void> {
    const { templateId } = command;

    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundError(`Template not found: ${templateId}`);
    }

    await this.templateRepository.delete(templateId);

    this.logger.log(`Template deleted: ${templateId}`);
  }
}
