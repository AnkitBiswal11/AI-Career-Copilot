import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { api, onUnauthorized, tokenStore } from "@/services/api";
import type { User } from "@/types/api";

const USER_KEY = "cc_user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = tokenStore.get();
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }

    setReady(true);
  }, []);

  const persist = useCallback((nextToken: string, nextUser: User) => {
    tokenStore.set(nextToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    window.localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    onUnauthorized(() => logout());
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login({
        email,
        password,
      });

      // Backend login returns the JWT token.
      // Fetch the real user profile using that token.
      tokenStore.set(res.access_token);

      const currentUser = await api.me();

      persist(res.access_token, currentUser);
    },
    [persist],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      // Backend expects "name", not "full_name".
      await api.register({
        name: fullName,
        email,
        password,
      });

      // Registration doesn't return a JWT,
      // so log in immediately after successful registration.
      const res = await api.login({
        email,
        password,
      });

      tokenStore.set(res.access_token);

      const currentUser = await api.me();

      persist(res.access_token, currentUser);
    },
    [persist],
  );

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;

      const next = {
        ...prev,
        ...patch,
      };

      window.localStorage.setItem(USER_KEY, JSON.stringify(next));

      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, ready, login, register, logout, updateUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}

export function useRequireAuth() {
  const { ready, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      navigate({
        to: "/login",
        replace: true,
      });
    }
  }, [ready, isAuthenticated, navigate]);

  return {
    ready,
    isAuthenticated,
  };
}