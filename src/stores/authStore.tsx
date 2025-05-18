// src/stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserProfile {
  id: string; // Google User ID (from 'sub' claim)
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  idToken: string | null; // Store the Google ID Token
  actions: {
    login: (user: UserProfile, idToken: string) => void;
    logout: () => void;
    getIdToken: () => string | null;
  };
}

const initialAuthState = {
  isAuthenticated: false,
  user: null,
  idToken: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      actions: {
        login: (user, idToken) => set({ isAuthenticated: true, user, idToken }),
        logout: () => set({ ...initialAuthState }),
        getIdToken: () => get().idToken,
      },
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        idToken: state.idToken,
      }),
    }
  )
);

// Export actions separately for convenience
export const useAuthActions = () => useAuthStore((state) => state.actions);
