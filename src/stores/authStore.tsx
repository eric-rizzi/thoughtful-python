// src/stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// Import clearAllAnonymousData, and potentially hasAnonymousData for the future
import {
  clearAllAnonymousData,
  hasAnonymousData,
  migrateAnonymousDataToUser,
} from "../lib/localStorageUtils";

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
  // For Strategy 1 later, you'd add: shouldPromptForMerge: boolean;
  actions: {
    login: (user: UserProfile, idToken: string) => void;
    logout: () => void;
    getIdToken: () => string | null;
    // For Strategy 1 later, you'd add:
    // completeMerge: () => void;
    // declineMerge: () => void;
    // setShouldPromptForMerge: (shouldPrompt: boolean) => void;
  };
}

const initialAuthState = {
  isAuthenticated: false,
  user: null,
  idToken: null,
  // For Strategy 1 later: shouldPromptForMerge: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      actions: {
        login: (user, idToken) => {
          console.log(
            "Login action called. Clearing anonymous data for Strategy 3."
          );
          clearAllAnonymousData(); // Strategy 3: Discard anonymous data

          // When moving to Strategy 1, you would replace clearAllAnonymousData() with:
          // if (hasAnonymousData()) {
          //   let userAlreadyHasData = false; /* ... check if user.id_ keys exist ... */
          //   if (userAlreadyHasData) {
          //     clearAllAnonymousData();
          //   } else {
          //     set({ shouldPromptForMerge: true });
          //   }
          // }

          set({ isAuthenticated: true, user, idToken });
        },
        logout: () => {
          console.log("Logout action called.");
          set({ ...initialAuthState }); // Resets isAuthenticated, user, idToken
        },
        getIdToken: () => get().idToken,

        // Placeholder actions for Strategy 1 (implement fully later)
        // completeMerge: () => {
        //   const user = get().user;
        //   if (user && user.id) {
        //     migrateAnonymousDataToUser(user.id);
        //   }
        //   set({ shouldPromptForMerge: false });
        // },
        // declineMerge: () => {
        //   clearAllAnonymousData();
        //   set({ shouldPromptForMerge: false });
        // },
        // setShouldPromptForMerge: (shouldPrompt) => set({ shouldPromptForMerge: shouldPrompt }),
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        idToken: state.idToken,
        // For Strategy 1 later: shouldPromptForMerge: state.shouldPromptForMerge, (if you decide to persist the prompt state)
      }),
    }
  )
);

export const useAuthActions = () => useAuthStore((state) => state.actions);
