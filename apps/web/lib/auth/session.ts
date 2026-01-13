import 'server-only';

import { cookies } from 'next/headers';
import type { AuthSession, User } from './types';

const SESSION_COOKIE = 'shopflow-session';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Encrypt session data (in production, use proper encryption)
function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

// Decrypt session data
function decodeSession(encoded: string): AuthSession | null {
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Get session from cookies (server-only)
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  const session = decodeSession(sessionCookie.value);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    // Try to refresh the token
    const refreshed = await refreshSession(session.refreshToken);
    if (refreshed) {
      return refreshed;
    }
    return null;
  }

  return session;
}

// Get current user from session (server-only)
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

// Get access token (server-only)
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken ?? null;
}

// Check if user is authenticated (server-only)
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

// Create session cookie (server-only)
export async function createSession(
  user: User,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const cookieStore = await cookies();
  const session: AuthSession = {
    user,
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Delete session cookie (server-only)
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Refresh session using refresh token (server-only)
async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const session: AuthSession = {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    };

    // Update the cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, encodeSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return session;
  } catch {
    return null;
  }
}

// Server-only fetch with auth
export async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
