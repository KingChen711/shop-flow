import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginDto) => apiClient.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterDto) => apiClient.post<AuthResponse>('/api/auth/register', data),

  logout: () => apiClient.post<void>('/api/auth/logout'),

  me: () => apiClient.get<User>('/api/auth/me'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/api/auth/refresh', { refreshToken }),
};
