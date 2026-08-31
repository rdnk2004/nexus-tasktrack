import { create } from 'zustand';
import { User, LoginResponse } from '@/types/auth';
import { authApi } from '@/api/auth';

const TOKEN_KEY = 'nutmeg_token';
const USER_KEY = 'nutmeg_user';

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

function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  isLoading: true,

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
    const token = get().token || localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null, token: null });
      return null;
    }

    try {
      set({ isLoading: true });
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
