import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { IReservationRepository } from '@domain/repositories/reservation.repository.interface';
import { Reservation, ReservationStatus } from '@domain/entities/reservation.entity';
import { ReservationEntity } from '../entities/reservation.entity';

@Injectable()
export class ReservationRepositoryImpl implements IReservationRepository {
  private readonly logger = new Logger(ReservationRepositoryImpl.name);

  constructor(
    @InjectRepository(ReservationEntity)
    private readonly repository: Repository<ReservationEntity>
  ) {}

  async findById(id: string): Promise<Reservation | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<Reservation[]> {
    const entities = await this.repository.find({ where: { orderId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByProductId(productId: string): Promise<Reservation[]> {
    const entities = await this.repository.find({ where: { productId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findExpiredReservations(): Promise<Reservation[]> {
    const entities = await this.repository.find({
      where: {
        status: ReservationStatus.RESERVED,
        expiresAt: LessThan(new Date()),
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    const entities = await this.repository.find({ where: { status } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const entity = this.toEntity(reservation);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async saveMany(reservations: Reservation[]): Promise<Reservation[]> {
    const entities = reservations.map((r) => this.toEntity(r));
    const saved = await this.repository.save(entities);
    return saved.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toDomain(entity: ReservationEntity): Reservation {
    return Reservation.fromPersistence({
      id: entity.id,
      orderId: entity.orderId,
      productId: entity.productId,
      quantity: entity.quantity,
      status: entity.status as ReservationStatus,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(reservation: Reservation): ReservationEntity {
    const entity = new ReservationEntity();
    entity.id = reservation.id;
    entity.orderId = reservation.orderId;
    entity.productId = reservation.productId;
    entity.quantity = reservation.quantity;
    entity.status = reservation.status;
    entity.expiresAt = reservation.expiresAt;
    entity.createdAt = reservation.createdAt;
    entity.updatedAt = reservation.updatedAt;
    return entity;
  }
}
