export class SendPushCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceToken: string,
    public readonly title: string,
    public readonly body: string,
    public readonly imageUrl?: string,
    public readonly data?: Record<string, string>,
    public readonly referenceId?: string,
    public readonly referenceType?: string
  ) {}
}
