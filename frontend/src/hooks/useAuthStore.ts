import { create } from 'zustand';
import { User, LoginResponse } from '@/types/auth';
import { authApi } from '@/api/auth';

const TOKEN_KEY = 'nexus_token';
const USER_KEY = 'nexus_user';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (authData: LoginResponse) => void;
  logout: () => void;
  checkAuth: () => Promise<User | null>;
  setUser: (user: User) => void;
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

const initialToken = getStoredToken();
const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: !!initialToken,
  // Never block UI on initial load if token/user already cached, or if unauthenticated
  isLoading: false,

  login: (authData: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    const user: User = {
      email: authData.email,
      name: authData.email.split('@')[0].toUpperCase(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      token: authData.access_token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    const token = get().token || getStoredToken();
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null, token: null });
      return null;
    }

    // Only set loading if we don't have cached user data yet
    if (!get().user) {
      set({ isLoading: true });
    }

    try {
      const user = await authApi.getCurrentUser();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false, token });
      return user;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ isAuthenticated: false, isLoading: false, user: null, token: null });
      return null;
    }
  },

  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },
}));
