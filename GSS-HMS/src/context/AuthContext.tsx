import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthenticatedUser, UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { authApi } from "@/services/api";

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildAuthUser(data: { id: string; email: string; name: string; role: string; department?: string }): AuthenticatedUser {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    department: data.department || undefined,
    permissions: ROLE_PERMISSIONS[data.role as UserRole] || [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(buildAuthUser(res.data)))
      .catch(() => localStorage.removeItem("auth-token"))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem("auth-token", res.data.token);
      setUser(buildAuthUser(res.data.user));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth-token");
  }, []);

  const hasPermission = useCallback(
    (permission: string) => !!user?.permissions.includes(permission as any),
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((p) => user?.permissions.includes(p as any)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
