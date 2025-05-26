// src/stores/authStore.tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  clearAllAnonymousData,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../lib/localStorageUtils";
import { BASE_PROGRESS_STORE_KEY, useProgressStore } from "./progressStore";
import { API_GATEWAY_BASE_URL } from "../config";
import * as apiService from "../lib/apiService";
import {
  BatchCompletionsInput,
  SectionCompletionInput,
  UserProgressData,
} from "../types/apiServiceTypes";

export interface UserProfile {
  id: string; // e.g., Google User ID (sub)
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  idToken: string | null; // Google ID Token
  actions: {
    login: (userProfile: UserProfile, idToken: string) => Promise<void>;
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
        login: async (userProfile, idToken) => {
          console.log(
            "[AuthStore] Login action started for user:",
            userProfile.id
          );

          const claimedAnonymousProgressActions: SectionCompletionInput[] = [];
          const anonymousProgressLsKey = `${ANONYMOUS_USER_ID_PLACEHOLDER}_${BASE_PROGRESS_STORE_KEY}`;

          // 1. Read and prepare to claim anonymous progress (if any)
          try {
            const anonymousProgressRaw = localStorage.getItem(
              anonymousProgressLsKey
            );
            if (anonymousProgressRaw) {
              const anonymousProgressData = JSON.parse(anonymousProgressRaw);
              if (anonymousProgressData?.state?.completion) {
                console.log(
                  "[AuthStore] Anonymous progress found, preparing to claim:",
                  anonymousProgressData.state.completion
                );
                for (const lessonId in anonymousProgressData.state.completion) {
                  const sections =
                    (anonymousProgressData.state.completion[lessonId] as {
                      [sectionId: string]: string;
                    }) || {};
                  Object.keys(sections).forEach((sectionId) => {
                    claimedAnonymousProgressActions.push({
                      lessonId,
                      sectionId,
                    });
                  });
                }
              }
            }
          } catch (e) {
            console.error(
              "[AuthStore] Error reading or parsing anonymous progress:",
              e
            );
          }

          // 2. Clear ALL local anonymous data
          console.log(
            "[AuthStore] Clearing all anonymous data from localStorage."
          );
          clearAllAnonymousData();

          // 3. Get the API Gateway URL from the fixed config
          const apiGatewayUrl = API_GATEWAY_BASE_URL; // Use the imported config
          let serverProgressData: UserProgressData | null = null;

          // 5. Set Zustand auth state (Happens BEFORE trying to sync anonymous data)
          set({ isAuthenticated: true, user: userProfile, idToken });
          console.log("[AuthStore] Zustand authentication state updated.");

          const { _addToOfflineQueue: addToProgressStoreQueue } =
            useProgressStore.getState().actions;

          // Check if the API URL is actually set in the config
          if (!apiGatewayUrl && !apiService.USE_MOCKED_API) {
            // Keep USE_MOCKED_API check if you use it
            console.error(
              "[AuthStore] API Gateway URL is not configured in src/config.ts. Cannot fetch server progress."
            );
            // Decide how to handle this: maybe proceed without server sync and rely on local/empty state,
            // or show an error to the user. For now, it will skip fetching and syncing.
          } else {
            try {
              console.log(
                "[AuthStore] Fetching user progress from server using URL:",
                apiGatewayUrl
              );
              serverProgressData = await apiService.getUserProgress(
                idToken,
                apiGatewayUrl // Pass the correct URL
              );
              console.log(
                "[AuthStore] Successfully fetched progress from server:",
                serverProgressData
              );

              // 4. Store this server-fetched progress into localStorage under the user's key.
              const userProgressLsKey = `${userProfile.id}_${BASE_PROGRESS_STORE_KEY}`;
              const persistedState = {
                state: {
                  completion: serverProgressData.completion,
                  // penaltyEndTime: serverProgressData.penaltyEndTime, // If applicable
                },
                version: 0, // Or get from server if available
              };
              localStorage.setItem(
                userProgressLsKey,
                JSON.stringify(persistedState)
              );
              console.log(
                "[AuthStore] Server progress stored in localStorage for user:",
                userProfile.id
              );
            } catch (e) {
              console.error(
                "[AuthStore] Error fetching user progress from server or storing it:",
                e
              );
            }
          }

          // 6. Sync "Claimed" Anonymous Progress to Server (if any existed and URL is available)
          if (claimedAnonymousProgressActions.length > 0) {
            if (navigator.onLine && apiGatewayUrl) {
              // Ensure URL is available
              try {
                console.log(
                  "[AuthStore] Attempting to sync claimed anonymous progress to server...",
                  claimedAnonymousProgressActions
                );
                const batchInput: BatchCompletionsInput = {
                  completions: claimedAnonymousProgressActions,
                };
                const syncResult = await apiService.updateUserProgress(
                  idToken,
                  apiGatewayUrl,
                  batchInput
                );
                console.log(
                  "[AuthStore] Successfully synced claimed anonymous progress. Server response:",
                  syncResult
                );
              } catch (e) {
                console.error(
                  "[AuthStore] Failed to sync claimed anonymous progress:",
                  e
                );
                console.log(
                  "[AuthStore] Adding failed anonymous claims to user's offline queue."
                );
                claimedAnonymousProgressActions.forEach((action) => {
                  addToProgressStoreQueue(action);
                });
              }
            } else {
              const reason = !navigator.onLine
                ? "User is offline"
                : "API URL not configured";
              console.warn(
                `[AuthStore] ${reason}. Claimed anonymous progress will be queued.`
              );
              claimedAnonymousProgressActions.forEach((action) => {
                addToProgressStoreQueue(action);
              });
            }
          }

          // 7. Trigger the reload.
          console.log("[AuthStore] Login successful, reloading page.");
          window.location.reload();
        },

        logout: async () => {
          // ... (logout logic remains the same) ...
          console.log("[AuthStore] Logout action started.");
          const previousUser = get().user;

          set({ ...initialAuthState });
          console.log("[AuthStore] Zustand authentication state reset.");

          if (previousUser && previousUser.id) {
            console.log(
              `[AuthStore] User ${previousUser.id} logged out. Their specific progress data remains in localStorage.`
            );
          }

          console.log(
            "[AuthStore] Logout complete, reloading page for an anonymous session."
          );
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
