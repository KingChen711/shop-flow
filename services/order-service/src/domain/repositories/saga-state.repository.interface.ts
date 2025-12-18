import { SagaState } from '../entities/saga-state.entity';

export interface ISagaStateRepository {
  findById(id: string): Promise<SagaState | null>;
  findByOrderId(orderId: string): Promise<SagaState | null>;
  save(sagaState: SagaState): Promise<SagaState>;
  update(sagaState: SagaState): Promise<SagaState>;
}
