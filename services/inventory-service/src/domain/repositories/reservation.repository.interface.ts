import { Reservation, ReservationStatus } from '../entities/reservation.entity';

export interface IReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  findByOrderId(orderId: string): Promise<Reservation[]>;
  findByProductId(productId: string): Promise<Reservation[]>;
  findExpiredReservations(): Promise<Reservation[]>;
  findByStatus(status: ReservationStatus): Promise<Reservation[]>;
  save(reservation: Reservation): Promise<Reservation>;
  saveMany(reservations: Reservation[]): Promise<Reservation[]>;
  delete(id: string): Promise<void>;
}
