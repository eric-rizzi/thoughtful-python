// src/stores/authStore.tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  clearAllAnonymousData,
  // hasAnonymousData, // For potential future merge strategy
  // migrateAnonymousDataToUser, // For potential future merge strategy
} from "../lib/localStorageUtils";
import { useProgressStore } from "./progressStore"; // Import progress store

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  idToken: string | null;
  actions: {
    login: (user: UserProfile, idToken: string) => Promise<void>; // Made async for rehydration
    logout: () => Promise<void>; // Made async for rehydration
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
        login: async (user, idToken) => {
          // Keep async if there were other reasons
          console.log(
            "Login action: Clearing anonymous data from localStorage."
          );
          clearAllAnonymousData();

          set({ isAuthenticated: true, user, idToken });

          // Instead of rehydrate, trigger a reload
          window.location.reload();
        },
        logout: async () => {
          // Keep async if there were other reasons
          console.log("Logout action: User logging out.");
          set({ ...initialAuthState }); // Reset auth state first

          // Instead of rehydrate, trigger a reload
          window.location.reload();
        },
        getIdToken: () => get().idToken,
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        idToken: state.idToken,
      }),
    }
  )
);

export const useAuthActions = () => useAuthStore((state) => state.actions);
