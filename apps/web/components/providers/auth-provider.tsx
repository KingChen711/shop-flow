'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getAuthUser } from '@/lib/auth/actions';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Sync auth state with server session on mount
    const syncAuth = async () => {
      try {
        const user = await getAuthUser();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncAuth();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
