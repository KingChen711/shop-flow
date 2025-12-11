import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@shopflow/shared-utils';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PasswordService } from './password.service';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number;
  private readonly refreshExpiresIn: number;

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService
  ) {
    this.jwtSecret = this.configService.get(
      'JWT_SECRET',
      'your-super-secret-key-change-in-production'
    );
    this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', 3600); // 1 hour
    this.refreshExpiresIn = this.configService.get('REFRESH_EXPIRES_IN', 604800); // 7 days
  }

  async login(email: string, password: string): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await this.passwordService.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user);

    return { tokens, user };
  }

  generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.emailValue,
      roles: user.roles,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, this.jwtSecret, {
      expiresIn: this.refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtExpiresIn,
    };
  }

  validateToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<{ tokens: AuthTokens; user: User }> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtSecret) as { userId: string; type: string };

      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const user = await this.userRepository.findById(payload.userId);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      const tokens = this.generateTokens(user);

      return { tokens, user };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}
