import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { UpdateUserCommand } from '../update-user.command';
import { User } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserUpdatedEvent } from '@domain/events/user-created.event';
import { KafkaProducerService } from '@infrastructure/kafka/kafka-producer.service';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { userId, firstName, lastName, phone } = command;

    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Track changes for event
    const changes: Record<string, unknown> = {};
    if (firstName && firstName !== user.firstName) {
      changes.firstName = { from: user.firstName, to: firstName };
    }
    if (lastName && lastName !== user.lastName) {
      changes.lastName = { from: user.lastName, to: lastName };
    }
    if (phone !== undefined && phone !== user.phone) {
      changes.phone = { from: user.phone, to: phone };
    }

    // Update user
    user.updateProfile({ firstName, lastName, phone });

    // Save changes
    const updatedUser = await this.userRepository.update(user);

    // Publish event if there were changes
    if (Object.keys(changes).length > 0) {
      const event = new UserUpdatedEvent(userId, { userId, changes });
      this.eventBus.publish(event);

      await this.kafkaProducer.publishUserUpdated(userId, changes);
    }

    return updatedUser;
  }
}
