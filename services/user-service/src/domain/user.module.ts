import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { UserEntity } from '@infrastructure/persistence/entities/user.entity';
import { UserRepositoryImpl } from '@infrastructure/persistence/repositories/user.repository';

// Application - Command Handlers
import { CreateUserHandler } from '@application/commands/handlers/create-user.handler';
import { UpdateUserHandler } from '@application/commands/handlers/update-user.handler';
import { DeleteUserHandler } from '@application/commands/handlers/delete-user.handler';

// Application - Query Handlers
import { GetUserHandler } from '@application/queries/handlers/get-user.handler';
import { GetUserByEmailHandler } from '@application/queries/handlers/get-user-by-email.handler';
import { ListUsersHandler } from '@application/queries/handlers/list-users.handler';

// Application - Services
import { AuthService } from '@application/services/auth.service';
import { PasswordService } from '@application/services/password.service';

// Presentation
import { UserGrpcController } from '@presentation/grpc/user.controller';

// Kafka
import { KafkaModule } from '@infrastructure/kafka/kafka.module';

const CommandHandlers = [CreateUserHandler, UpdateUserHandler, DeleteUserHandler];
const QueryHandlers = [GetUserHandler, GetUserByEmailHandler, ListUsersHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserEntity]), KafkaModule],
  controllers: [UserGrpcController],
  providers: [
    // Repository
    {
      provide: 'UserRepository',
      useClass: UserRepositoryImpl,
    },
    // Services
    AuthService,
    PasswordService,
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: ['UserRepository', AuthService],
})
export class UserModule {}
