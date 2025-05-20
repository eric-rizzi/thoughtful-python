// src/stores/authStore.tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ANONYMOUS_USER_ID_PLACEHOLDER,
  clearAllAnonymousData,
} from "../lib/localStorageUtils";
import { BASE_PROGRESS_STORE_KEY } from "./progressStore"; // Import progress store

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
    login: (user: UserProfile, idToken: string) => Promise<void>;
    logout: () => Promise<void>;
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
          console.log("Login action: User attempting to log in:", user.id);

          // ---- Start: Anonymous Progress Claiming Logic ----
          const anonymousProgressLocalStorageKey = `${ANONYMOUS_USER_ID_PLACEHOLDER}_${BASE_PROGRESS_STORE_KEY}`;
          const userProgressLocalStorageKey = `${user.id}_${BASE_PROGRESS_STORE_KEY}`;

          try {
            const anonymousProgressRaw = localStorage.getItem(
              anonymousProgressLocalStorageKey
            );

            if (anonymousProgressRaw) {
              console.log(
                "Anonymous progress found. Attempting to merge with user's progress."
              );
              const anonymousProgressData = JSON.parse(anonymousProgressRaw); // Structure: { state: { completion, penaltyEndTime }, version }

              let currentUserProgressData = null;
              const currentUserProgressRaw = localStorage.getItem(
                userProgressLocalStorageKey
              );
              if (currentUserProgressRaw) {
                currentUserProgressData = JSON.parse(currentUserProgressRaw);
              }

              // Perform the non-overwriting union for 'completion'
              const mergedCompletionState = {
                ...(currentUserProgressData?.state?.completion || {}),
              };
              const anonymousCompletion =
                anonymousProgressData?.state?.completion || {};

              for (const lessonId in anonymousCompletion) {
                const anonSections = new Set(
                  anonymousCompletion[lessonId] || []
                );
                const userSections = new Set(
                  mergedCompletionState[lessonId] || []
                );
                anonSections.forEach((section) => userSections.add(section));
                if (userSections.size > 0) {
                  mergedCompletionState[lessonId] = Array.from(userSections);
                }
              }

              // Handle penaltyEndTime: User's existing penalty, or the later of the two.
              let mergedPenaltyTime =
                currentUserProgressData?.state?.penaltyEndTime || null;
              const anonymousPenaltyTime =
                anonymousProgressData?.state?.penaltyEndTime || null;

              if (anonymousPenaltyTime !== null) {
                if (
                  mergedPenaltyTime === null ||
                  anonymousPenaltyTime > mergedPenaltyTime
                ) {
                  mergedPenaltyTime = anonymousPenaltyTime;
                }
              }

              const newProgressForUser = {
                completion: mergedCompletionState,
                penaltyEndTime: mergedPenaltyTime,
              };

              const version =
                currentUserProgressData?.version ??
                anonymousProgressData?.version ??
                0;

              localStorage.setItem(
                userProgressLocalStorageKey,
                JSON.stringify({ state: newProgressForUser, version })
              );
              console.log(
                "Merged progress successfully saved under user's key:",
                userProgressLocalStorageKey
              );

              // Note: The specific anonymous *progress* key (anonymousProgressLocalStorageKey)
              // will be removed by the clearAllAnonymousData() call below.
            } else {
              console.log("No anonymous progress found to claim.");
            }
          } catch (e) {
            console.error(
              "Error during anonymous progress claiming/merging:",
              e
            );
            // Log error, but continue with login to not block the user.
          }
          // ---- End: Anonymous Progress Claiming Logic ----

          // This call was already in your original authStore.tsx's login action.
          // It will wipe ALL localStorage items prefixed with ANONYMOUS_USER_ID_PLACEHOLDER_.
          // This includes the original anonymous progress data (which is fine as it's now merged)
          // and any other anonymous data like code editor drafts or configuration settings.
          console.log(
            "Login action: Clearing ALL anonymous data from localStorage."
          );
          clearAllAnonymousData(); //

          // Set Zustand auth state
          set({ isAuthenticated: true, user, idToken });

          // Reload the page to rehydrate stores with the new user context
          window.location.reload();
          console.log("Login successful, page will reload.");
        },

        logout: async () => {
          console.log("Logout action started.");
          const previousUser = get().user;

          // Reset Zustand auth state first
          set({ ...initialAuthState });
          console.log("Zustand auth state has been reset.");

          // If there was a logged-in user, their data REMAINS in localStorage.
          // We DO NOT remove userProgressLocalStorageKey here.
          if (previousUser && previousUser.id) {
            console.log(
              `User ${previousUser.id} logging out. Their specific progress data will remain persisted in localStorage.`
            );
          } else {
            console.log("Logging out (user was null or had no ID).");
          }

          // Reload the page.
          // After reload, the application will be in an anonymous state.
          // The previously logged-in user's data is still in localStorage under their specific ID,
          // but it won't be loaded until they log in again as that specific user.
          window.location.reload();
          console.log(
            "Logout complete, page will reload for an anonymous session."
          );
        },

        getIdToken: () => get().idToken,
      },
    }),
    {
      name: "auth-storage", // localStorage key for the auth store's own state
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
