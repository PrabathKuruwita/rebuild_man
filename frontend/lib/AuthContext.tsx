"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { User, loginUser, registerUser, getCurrentUser, type RegisterPayload } from "./api";
import type { AuthResponse } from "./api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setToken(storedToken);
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const handleAuthSuccess = async (response: AuthResponse) => {
    // Save tokens FIRST so subsequent API calls are authenticated
    localStorage.setItem("accessToken", response.access);
    localStorage.setItem("refreshToken", response.refresh);
    setToken(response.access);

    // If the response includes user data (register endpoint), use it directly
    if (response.user) {
      setUser(response.user);
    } else {
      // Login endpoint only returns tokens — fetch user profile
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (e) {
        console.error("Failed to fetch user details after login", e);
      }
    }
    router.push("/");
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginUser(username, password);
      await handleAuthSuccess(response);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await registerUser(data);
      await handleAuthSuccess(response);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
