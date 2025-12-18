export class RefundPaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly amount?: number,
    public readonly reason?: string
  ) {}
}
