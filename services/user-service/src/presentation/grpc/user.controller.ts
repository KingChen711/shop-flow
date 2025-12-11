import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { status } from '@grpc/grpc-js';

// Commands
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { UpdateUserCommand } from '../../application/commands/update-user.command';
import { DeleteUserCommand } from '../../application/commands/delete-user.command';

// Queries
import { GetUserQuery } from '../../application/queries/get-user.query';
import { GetUserByEmailQuery } from '../../application/queries/get-user-by-email.query';
import { ListUsersQuery } from '../../application/queries/list-users.query';
import { ListUsersResult } from '../../application/queries/handlers/list-users.handler';

// Services
import { AuthService } from '../../application/services/auth.service';

// Domain
import { User } from '../../domain/entities/user.entity';

// Error handling
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
} from '@shopflow/shared-utils';

@Controller()
export class UserGrpcController {
  private readonly logger = new Logger(UserGrpcController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly authService: AuthService
  ) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) {
    try {
      this.logger.log(`Creating user with email: ${data.email}`);

      const command = new CreateUserCommand(
        data.email,
        data.password,
        data.first_name,
        data.last_name,
        data.phone
      );

      const user: User = await this.commandBus.execute(command);
      return this.toUserResponse(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('UserService', 'GetUser')
  async getUser(data: { user_id: string }) {
    try {
      const query = new GetUserQuery(data.user_id);
      const user: User = await this.queryBus.execute(query);
      return this.toUserResponse(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('UserService', 'GetUserByEmail')
  async getUserByEmail(data: { email: string }) {
    try {
      const query = new GetUserByEmailQuery(data.email);
      const user: User = await this.queryBus.execute(query);
      return this.toUserResponse(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('UserService', 'UpdateUser')
  async updateUser(data: {
    user_id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) {
    try {
      const command = new UpdateUserCommand(
        data.user_id,
        data.first_name,
        data.last_name,
        data.phone
      );

      const user: User = await this.commandBus.execute(command);
      return this.toUserResponse(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('UserService', 'DeleteUser')
  async deleteUser(data: { user_id: string }) {
    try {
      const command = new DeleteUserCommand(data.user_id);
      const success: boolean = await this.commandBus.execute(command);

      return {
        success,
        message: success ? 'User deleted successfully' : 'Failed to delete user',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('UserService', 'ListUsers')
  async listUsers(data: { page: number; limit: number; search?: string }) {
    try {
      const query = new ListUsersQuery(data.page || 1, data.limit || 20, data.search);

      const result: ListUsersResult = await this.queryBus.execute(query);

      return {
        users: result.users.map((user) => this.toUserResponse(user)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('UserService', 'Login')
  async login(data: { email: string; password: string }) {
    try {
      const { tokens, user } = await this.authService.login(data.email, data.password);

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn,
        user: this.toUserResponse(user),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('UserService', 'ValidateToken')
  async validateToken(data: { token: string }) {
    try {
      const payload = this.authService.validateToken(data.token);

      return {
        valid: true,
        user_id: payload.userId,
        email: payload.email,
        roles: payload.roles,
      };
    } catch (error) {
      return {
        valid: false,
        user_id: '',
        email: '',
        roles: [],
      };
    }
  }

  @GrpcMethod('UserService', 'RefreshToken')
  async refreshToken(data: { refresh_token: string }) {
    try {
      const { tokens, user } = await this.authService.refreshTokens(data.refresh_token);

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn,
        user: this.toUserResponse(user),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper methods
  private toUserResponse(user: User) {
    return {
      id: user.id,
      email: user.emailValue,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone || '',
      is_active: user.isActive,
      roles: user.roles,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  private handleError(error: unknown): RpcException {
    this.logger.error('Error in UserGrpcController', error);

    if (error instanceof NotFoundError) {
      return new RpcException({
        code: status.NOT_FOUND,
        message: error.message,
      });
    }

    if (error instanceof ConflictError) {
      return new RpcException({
        code: status.ALREADY_EXISTS,
        message: error.message,
      });
    }

    if (error instanceof ValidationError) {
      return new RpcException({
        code: status.INVALID_ARGUMENT,
        message: error.message,
      });
    }

    if (error instanceof UnauthorizedError) {
      return new RpcException({
        code: status.UNAUTHENTICATED,
        message: error.message,
      });
    }

    if (error instanceof Error) {
      return new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }

    return new RpcException({
      code: status.UNKNOWN,
      message: 'An unexpected error occurred',
    });
  }
}
