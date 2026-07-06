'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser, registerOrgAdmin, getCurrentUser, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    phone_number: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  registerOrgAdmin: (data: {
    username: string;
    password: string;
    password2: string;
    email: string;
    phone_number: string;
    first_name: string;
    last_name: string;
    organization_name: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }
      } catch {
        // Token might be invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await loginUser(username, password);
      
      // Store tokens
      const tokens = response as { access?: string; refresh?: string };
      if (tokens.access) {
        localStorage.setItem('accessToken', tokens.access);
      }
      if (tokens.refresh) {
        localStorage.setItem('refreshToken', tokens.refresh);
      }

      // Fetch and set user
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Redirect based on role
      if (currentUser.role === 'ADMIN') {
        router.push('/admin');
      } else if (currentUser.role === 'ORG_ADMIN') {
        router.push('/org-admin');
      } else if (currentUser.role === 'DONOR') {
        router.push('/');
      } else {
        router.push('/needs');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    phone_number: string;
    first_name: string;
    last_name: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      const response = await registerUser(data);

      // Store tokens if provided
      const tokens = response as { access?: string; refresh?: string };
      if (tokens.access) {
        localStorage.setItem('accessToken', tokens.access);
      }
      if (tokens.refresh) {
        localStorage.setItem('refreshToken', tokens.refresh);
      }

      // Fetch and set user
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Redirect
      if (currentUser.role === 'DONOR') {
        router.push('/');
      } else {
        router.push('/needs');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerOrgAdminFunc = async (data: {
    username: string;
    password: string;
    password2: string;
    email: string;
    phone_number: string;
    first_name: string;
    last_name: string;
    organization_name: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      const response = await registerOrgAdmin(data);

      // Store tokens if provided
      const tokens = response as { access?: string; refresh?: string };
      if (tokens.access) {
        localStorage.setItem('accessToken', tokens.access);
      }
      if (tokens.refresh) {
        localStorage.setItem('refreshToken', tokens.refresh);
      }

      // Fetch and set user
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Redirect
      router.push('/organizations');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Organization Admin registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setError(null);
    router.push('/login');
  };

  const clearError = () => {
    setError(null);
  };

  const updateUser = (updatedUser: User | null) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        registerOrgAdmin: registerOrgAdminFunc,
        logout,
        clearError,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
