import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConflictError } from '@shopflow/shared-utils';
import { CreateUserCommand } from '../create-user.command';
import { User } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { Password } from '@domain/value-objects/password.vo';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { PasswordService } from '../../services/password.service';
import { UserCreatedEvent } from '@domain/events/user-created.event';
import { KafkaProducerService } from '@infrastructure/kafka/kafka-producer.service';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly eventBus: EventBus,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const { email, password, firstName, lastName, phone } = command;

    // Validate email format
    const emailVO = Email.create(email);

    // Validate password strength
    Password.create(password);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(emailVO.value);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(password);

    // Create user entity
    const user = User.create({
      email: emailVO,
      passwordHash,
      firstName,
      lastName,
      phone,
    });

    // Save to database
    const savedUser = await this.userRepository.save(user);

    // Publish domain event internally
    const event = new UserCreatedEvent(savedUser.id, {
      userId: savedUser.id,
      email: savedUser.emailValue,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
    });
    this.eventBus.publish(event);

    // Publish to Kafka for other services
    await this.kafkaProducer.publishUserCreated(
      savedUser.id,
      savedUser.emailValue,
      savedUser.firstName,
      savedUser.lastName
    );

    return savedUser;
  }
}
