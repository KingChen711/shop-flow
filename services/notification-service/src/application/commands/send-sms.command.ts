import { TemplateVariables } from './send-email.command';

export class SendSmsCommand {
  constructor(
    public readonly phoneNumber: string,
    public readonly templateId?: string,
    public readonly customMessage?: string,
    public readonly variables?: TemplateVariables,
    public readonly userId?: string,
    public readonly referenceId?: string,
    public readonly referenceType?: string
  ) {}
}
