export class UpdateTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly name?: string,
    public readonly subject?: string,
    public readonly body?: string,
    public readonly isActive?: boolean
  ) {}
}
