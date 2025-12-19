export interface TemplateVariables {
  [key: string]: string;
}

export class SendEmailCommand {
  constructor(
    public readonly recipientEmail: string,
    public readonly recipientName: string,
    public readonly templateId?: string,
    public readonly customSubject?: string,
    public readonly customBody?: string,
    public readonly variables?: TemplateVariables,
    public readonly userId?: string,
    public readonly referenceId?: string,
    public readonly referenceType?: string
  ) {}
}
