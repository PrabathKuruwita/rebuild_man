'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export function useAdminGuard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'ADMIN' && user.role !== 'ORG_ADMIN') {
      router.push('/needs');
    }
  }, [loading, isAuthenticated, user, router]);

  const authorized = user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN';

  return {
    authorized,
    isLoading: loading,
    user,
  };
}

export function useOrgAdminGuard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'ORG_ADMIN') {
      router.push('/needs');
    }
  }, [loading, isAuthenticated, user, router]);

  const authorized = user?.role === 'ORG_ADMIN';

  return {
    authorized,
    isLoading: loading,
    user,
  };
}

export function useAuthGuard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  return {
    authorized: isAuthenticated,
    isLoading: loading,
    user,
  };
}

