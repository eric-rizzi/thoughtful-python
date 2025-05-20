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
          console.log(
            "Login action: Clearing anonymous data from localStorage."
          );
          clearAllAnonymousData(); // Deletes 'anonymous_...' keys from localStorage

          set({ isAuthenticated: true, user, idToken });

          // After auth state is set, force progressStore to rehydrate.
          // Its custom storage adapter will now use the new USER_ID prefixed key.
          console.log(
            "Login action: Forcing rehydration of progressStore for new user."
          );
          await useProgressStore.persist.rehydrate();
          // If rehydrate doesn't clear old state, or if there's no data for the new user,
          // you might still want to ensure a clean slate if that's the desired UX.
          // However, rehydrate() should load the new user's data or the store's initial state if no data is found for that user.
          // If no data for the new user, progressStore will have its initial state (empty completion).
        },
        logout: async () => {
          console.log("Logout action: User logging out.");
          set({ ...initialAuthState }); // Reset auth state first

          // After auth state is reset to anonymous, force progressStore to rehydrate.
          // Its custom storage adapter will now use the 'anonymous_' prefixed key.
          console.log(
            "Logout action: Forcing rehydration of progressStore for anonymous state."
          );
          await useProgressStore.persist.rehydrate();
          // If no anonymous data, progressStore will have its initial state (empty completion).
        },
        getIdToken: () => get().idToken,
      },
    }),
    {
      name: "auth-storage", // This key itself is not user-specific by name
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
