import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISagaStateRepository } from '@domain/repositories/saga-state.repository.interface';
import { SagaState, SagaStatus, SagaStep } from '@domain/entities/saga-state.entity';
import { SagaStateEntity } from '../entities/saga-state.entity';

@Injectable()
export class SagaStateRepositoryImpl implements ISagaStateRepository {
  constructor(
    @InjectRepository(SagaStateEntity)
    private readonly repository: Repository<SagaStateEntity>
  ) {}

  async findById(id: string): Promise<SagaState | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<SagaState | null> {
    const entity = await this.repository.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(sagaState: SagaState): Promise<SagaState> {
    const entity = this.toEntity(sagaState);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(sagaState: SagaState): Promise<SagaState> {
    const entity = this.toEntity(sagaState);
    await this.repository.save(entity);
    const result = await this.findById(sagaState.id);
    return result!;
  }

  private toDomain(entity: SagaStateEntity): SagaState {
    return SagaState.fromPersistence({
      id: entity.id,
      orderId: entity.orderId,
      status: entity.status as SagaStatus,
      currentStep: entity.currentStep as SagaStep,
      completedSteps: entity.completedSteps as SagaStep[],
      reservationIds: entity.reservationIds || [],
      paymentId: entity.paymentId,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(sagaState: SagaState): SagaStateEntity {
    const entity = new SagaStateEntity();
    entity.id = sagaState.id;
    entity.orderId = sagaState.orderId;
    entity.status = sagaState.status;
    entity.currentStep = sagaState.currentStep;
    entity.completedSteps = sagaState.completedSteps;
    entity.reservationIds = sagaState.reservationIds;
    entity.paymentId = sagaState.paymentId;
    entity.errorMessage = sagaState.errorMessage;
    entity.createdAt = sagaState.createdAt;
    entity.updatedAt = sagaState.updatedAt;
    return entity;
  }
}
