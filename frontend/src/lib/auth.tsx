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
import type { UserProfile, UserProfileUpdate } from "@/services/api";
import type { User } from "@/types/api";

const USER_KEY = "cc_user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Convert the backend user profile into the frontend User type.
 * The backend uses "name"; the frontend uses "full_name".
 */
function toFrontendUser(profile: UserProfile): User {
  return {
    id: profile.id,
    full_name: profile.name,
    email: profile.email,
    target_role: profile.target_role ?? "",
    experience_level: profile.experience_level ?? "",
    preferred_location: profile.preferred_location ?? "",
    college: profile.college ?? "",
    graduation_year: profile.graduation_year ?? "",
  };
}

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
    return onUnauthorized(() => logout());
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login({
        email,
        password,
      });

      // Set the token before requesting the user's profile.
      tokenStore.set(res.access_token);

      const profile = await api.me();
      const currentUser = toFrontendUser(profile);

      persist(res.access_token, currentUser);
    },
    [persist]
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      // The backend expects "name", not "full_name".
      await api.register({
        name: fullName,
        email,
        password,
      });

      // Register, then log in because registration does not return a token.
      const res = await api.login({
        email,
        password,
      });

      tokenStore.set(res.access_token);

      const profile = await api.me();
      const currentUser = toFrontendUser(profile);

      persist(res.access_token, currentUser);
    },
    [persist]
  );

  const updateUser = useCallback(
    async (patch: Partial<User>) => {
      if (!user) {
        throw new Error("You must be logged in to update your profile.");
      }

      const profile: UserProfileUpdate = {
        name: patch.full_name ?? user.full_name,
        target_role:
          patch.target_role !== undefined
            ? patch.target_role
            : user.target_role ?? null,
        experience_level:
          patch.experience_level !== undefined
            ? patch.experience_level
            : user.experience_level ?? null,
        preferred_location:
          patch.preferred_location !== undefined
            ? patch.preferred_location
            : user.preferred_location ?? null,
        college:
          patch.college !== undefined
            ? patch.college
            : user.college ?? null,
        graduation_year:
          patch.graduation_year !== undefined
            ? patch.graduation_year
            : user.graduation_year ?? null,
      };

      // Save to the backend first.
      const updatedProfile = await api.updateProfile(profile);

      // Convert the response to the frontend's User shape.
      const nextUser = toFrontendUser(updatedProfile);

      // Persist only after the backend update succeeds.
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    },
    [user]
  );

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
    [user, token, ready, login, register, logout, updateUser]
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