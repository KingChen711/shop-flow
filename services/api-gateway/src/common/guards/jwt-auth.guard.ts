import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USER_SERVICE } from '@grpc/grpc-clients.module';

interface UserServiceClient {
  ValidateToken(data: { token: string }): any;
}

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private userService: UserServiceClient;

  constructor(
    private reflector: Reflector,
    @Inject(USER_SERVICE) private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const response = (await firstValueFrom(this.userService.ValidateToken({ token }))) as {
        valid: boolean;
        user_id: string;
        email: string;
        roles: string[];
      };

      if (!response.valid) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user info to request
      request.user = {
        userId: response.user_id,
        email: response.email,
        roles: response.roles || [],
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
