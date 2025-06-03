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
  AuthToken,
  BatchCompletionsInput,
  SectionCompletionInput,
  UserProgressData,
} from "../types/apiServiceTypes";
import { IsoTimestamp, SectionId, UserId } from "../types/data";

export interface UserProfile {
  userId: UserId; // e.g., Google User ID (sub)
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  idToken: AuthToken | null; // Google ID Token
  actions: {
    login: (userProfile: UserProfile, idToken: AuthToken) => Promise<void>;
    logout: () => Promise<void>;
    getIdToken: () => AuthToken | null;
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
        login: async (userProfile: UserProfile, idToken: AuthToken) => {
          console.log(
            "[AuthStore] Login action started for user:",
            userProfile.userId
          );

          // 1. Read anonymous progress into memory
          const claimedAnonymousProgressActions: SectionCompletionInput[] = [];
          const anonymousProgressLsKey = `${ANONYMOUS_USER_ID_PLACEHOLDER}_${BASE_PROGRESS_STORE_KEY}`;
          try {
            const anonymousProgressRaw = localStorage.getItem(
              anonymousProgressLsKey
            );
            if (anonymousProgressRaw) {
              const anonymousProgressData = JSON.parse(anonymousProgressRaw);
              if (anonymousProgressData?.state?.completion) {
                for (const lessonId in anonymousProgressData.state.completion) {
                  const sections =
                    (anonymousProgressData.state.completion[lessonId] as {
                      [sectionId: SectionId]: IsoTimestamp;
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
            console.error("[AuthStore] Error reading anonymous progress:", e);
          }

          // 2. Clear all anonymous data from localStorage
          clearAllAnonymousData();
          console.log("[AuthStore] Anonymous data cleared from localStorage.");

          // 3. Set auth state in Zustand. This is crucial so progressStore uses the new user ID for subsequent actions.
          set({ isAuthenticated: true, user: userProfile, idToken });
          console.log(
            "[AuthStore] Zustand authentication state updated for new user."
          );

          const apiGatewayUrl = API_GATEWAY_BASE_URL;
          let finalProgressToPersist: UserProgressData = {
            userId: userProfile.userId,
            completion: {},
          };

          // 4. Fetch current server progress for the authenticated user
          if (apiGatewayUrl || apiService.USE_MOCKED_API) {
            try {
              console.log(
                "[AuthStore] Fetching initial server progress for user:",
                userProfile.userId
              );
              finalProgressToPersist = await apiService.getUserProgress(
                idToken,
                apiGatewayUrl
              );
              console.log(
                "[AuthStore] Initial server progress fetched:",
                finalProgressToPersist
              );
            } catch (e) {
              console.error(
                "[AuthStore] Error fetching initial server progress for user. Will proceed with empty server progress.",
                e
              );
              // Fallback to empty progress if fetch fails, anonymous actions will be queued.
            }
          } else {
            console.warn(
              "[AuthStore] API URL not configured. Assuming empty server progress for user."
            );
          }

          // 5. Attempt to sync claimed anonymous actions to the server
          if (claimedAnonymousProgressActions.length > 0) {
            if (navigator.onLine && apiGatewayUrl) {
              try {
                console.log(
                  "[AuthStore] Syncing claimed anonymous actions:",
                  claimedAnonymousProgressActions
                );
                const batchInput: BatchCompletionsInput = {
                  completions: claimedAnonymousProgressActions,
                };
                // updateUserProgress returns the NEW, MERGED state from the server
                const mergedServerProgress =
                  await apiService.updateUserProgress(
                    idToken,
                    apiGatewayUrl,
                    batchInput
                  );
                finalProgressToPersist = mergedServerProgress; // Use this most up-to-date state
                console.log(
                  "[AuthStore] Anonymous actions synced. Server returned merged progress:",
                  finalProgressToPersist
                );
              } catch (e) {
                console.error(
                  "[AuthStore] Failed to sync claimed anonymous actions. Queuing them.",
                  e
                );
                // If sync fails, add to progressStore's queue (which now uses the authenticated user's key)
                const { _addToOfflineQueue } =
                  useProgressStore.getState().actions;
                claimedAnonymousProgressActions.forEach((action) =>
                  _addToOfflineQueue(action)
                );
              }
            } else {
              // Offline or no API URL
              console.warn(
                "[AuthStore] Offline or no API URL. Queuing anonymous actions."
              );
              const { _addToOfflineQueue } =
                useProgressStore.getState().actions;
              claimedAnonymousProgressActions.forEach((action) =>
                _addToOfflineQueue(action)
              );
            }
          }

          // 6. Update the progressStore with the determined finalProgressToPersist.
          // This ensures that progressStore has the most up-to-date 'completion' data
          // AND it will internally reconcile its offlineActionQueue against this new 'completion' state.
          console.log(
            "[AuthStore] Setting final progress in progressStore before reload:",
            finalProgressToPersist
          );
          useProgressStore
            .getState()
            .actions.setServerProgress(finalProgressToPersist);

          // 7. Reload the page
          console.log("[AuthStore] Login process complete. Reloading page.");
          window.location.reload();
        },

        logout: async () => {
          console.log("[AuthStore] Logout action started.");
          const previousUser = get().user;
          set({ ...initialAuthState });
          if (previousUser && previousUser.userId) {
            console.log(
              `[AuthStore] User ${previousUser.userId} logged out. Their specific progress data remains in localStorage.`
            );
          }
          console.log(
            "[AuthStore] Logout complete. Reloading page for anonymous session."
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
