import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { DeleteUserCommand } from '../delete-user.command';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserDeletedEvent } from '@domain/events/user-created.event';
import { KafkaProducerService } from '@infrastructure/kafka/kafka-producer.service';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  async execute(command: DeleteUserCommand): Promise<boolean> {
    const { userId } = command;

    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Delete user
    const deleted = await this.userRepository.delete(userId);

    if (deleted) {
      // Publish domain event
      const event = new UserDeletedEvent(userId, {
        userId,
        email: user.emailValue,
      });
      this.eventBus.publish(event);

      // Publish to Kafka
      await this.kafkaProducer.publishUserDeleted(userId, user.emailValue);
    }

    return deleted;
  }
}
