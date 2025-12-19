import { Controller, Post, Body, Inject, OnModuleInit, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { USER_SERVICE } from '@grpc/grpc-clients.module';
import { Public } from '@common/decorators/public.decorator';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from './dto/auth.dto';

interface UserServiceClient {
  CreateUser(data: any): any;
  Login(data: any): any;
  RefreshToken(data: any): any;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject(USER_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const response = await firstValueFrom(
      this.userService.CreateUser({
        email: dto.email,
        password: dto.password,
        first_name: dto.firstName,
        last_name: dto.lastName,
        phone: dto.phone,
      })
    );

    // After registration, auto-login
    const loginResponse = await firstValueFrom(
      this.userService.Login({
        email: dto.email,
        password: dto.password,
      })
    );

    return this.mapAuthResponse(loginResponse);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const response = await firstValueFrom(
      this.userService.Login({
        email: dto.email,
        password: dto.password,
      })
    );

    return this.mapAuthResponse(response);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const response = await firstValueFrom(
      this.userService.RefreshToken({
        refresh_token: dto.refreshToken,
      })
    );

    return this.mapAuthResponse(response);
  }

  private mapAuthResponse(response: any): AuthResponseDto {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: Number(response.expires_in),
      user: {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        phone: response.user.phone,
        isActive: response.user.is_active,
        roles: response.user.roles || [],
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at,
      },
    };
  }
}
