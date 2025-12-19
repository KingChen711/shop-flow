import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateTemplateCommand } from '../create-template.command';
import { Template } from '@domain/entities/template.entity';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';
import { ConflictError } from '@shopflow/shared-utils';

@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler implements ICommandHandler<CreateTemplateCommand> {
  private readonly logger = new Logger(CreateTemplateHandler.name);

  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(command: CreateTemplateCommand): Promise<Template> {
    const { name, type, channel, subject, body, isActive } = command;

    // Check for existing template with same type and channel
    const existing = await this.templateRepository.findByTypeAndChannel(type, channel);
    if (existing) {
      throw new ConflictError(`Template already exists for type ${type} and channel ${channel}`);
    }

    const template = Template.create({
      name,
      type,
      channel,
      subject,
      body,
      isActive,
    });

    await this.templateRepository.save(template);

    this.logger.log(`Template created: ${template.id} - ${name}`);

    return template;
  }
}
