'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession, getSession } from './session';
import type { LoginCredentials, RegisterData, AuthResult, User } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Login action (Server Action - write operation)
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      return { success: false, error: error.message || 'Invalid credentials' };
    }

    const data = await response.json();

    await createSession(data.user, data.accessToken, data.refreshToken, data.expiresIn || 3600);

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// Register action (Server Action - write operation)
export async function register(data: RegisterData): Promise<AuthResult> {
  console.log('Register action', API_BASE_URL, data);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      return { success: false, error: error.message || 'Registration failed' };
    }

    const result = await response.json();

    await createSession(
      result.user,
      result.accessToken,
      result.refreshToken,
      result.expiresIn || 3600
    );

    return { success: true, user: result.user };
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// Logout action (Server Action - write operation)
export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/');
}

// Get current user action (for client components to call)
export async function getAuthUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}
