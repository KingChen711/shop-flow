export class ReleaseReservationCommand {
  constructor(
    public readonly reservationId: string,
    public readonly reason: string = 'Released by request'
  ) {}
}
