import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  clearAllAnonymousData,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../lib/localStorageUtils";
import { BASE_PROGRESS_STORE_KEY } from "./progressStore"; // For constructing localStorage keys
import { useApiSettingsStore } from "./apiSettingsStore"; // To get API Gateway URL
import * as apiService from "../lib/apiService"; // Import your mocked API service

// Interfaces (should match or be imported if defined elsewhere centrally)
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

          const claimedAnonymousProgressActions: apiService.SectionCompletionInput[] =
            [];
          const anonymousProgressLsKey = `${ANONYMOUS_USER_ID_PLACEHOLDER}_${BASE_PROGRESS_STORE_KEY}`;

          // 1. Read and prepare to claim anonymous progress (if any)
          try {
            const anonymousProgressRaw = localStorage.getItem(
              anonymousProgressLsKey
            );
            if (anonymousProgressRaw) {
              const anonymousProgressData = JSON.parse(anonymousProgressRaw); // Expected: { state: { completion: {...} }, version: X }
              if (anonymousProgressData?.state?.completion) {
                console.log(
                  "[AuthStore] Anonymous progress found, preparing to claim:",
                  anonymousProgressData.state.completion
                );
                for (const lessonId in anonymousProgressData.state.completion) {
                  const sections =
                    (anonymousProgressData.state.completion[
                      lessonId
                    ] as string[]) || [];
                  sections.forEach((sectionId) => {
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
            // Continue login even if this fails
          }

          // 2. Clear ALL local anonymous data (from localStorageUtils)
          // This wipes everything prefixed with ANONYMOUS_USER_ID_PLACEHOLDER_
          console.log(52);
          console.log(
            "[AuthStore] Clearing all anonymous data from localStorage."
          );
          clearAllAnonymousData();

          // 3. Fetch canonical progress from the (mocked) server for the logged-in user
          const apiGatewayUrl =
            useApiSettingsStore.getState().progressApiGateway;
          let serverProgressData: apiService.UserProgressData | null = null;

          if (!apiGatewayUrl && !apiService.USE_MOCKED_API) {
            // Check if URL is needed for real calls
            console.error(
              "[AuthStore] API Gateway URL is not configured for real API calls. Cannot fetch server progress."
            );
            // Potentially handle this by setting user up with empty progress or erroring login
          } else {
            try {
              console.log(
                "[AuthStore] Fetching user progress from server (mocked)..."
              );
              serverProgressData = await apiService.getUserProgress(
                idToken,
                apiGatewayUrl
              );
              console.log(
                "[AuthStore] Successfully fetched (mocked) progress from server:",
                serverProgressData
              );

              // 4. Store this server-fetched (mocked) progress into localStorage under the user's key.
              // This state will be picked up by progressStore after page reload.
              const userProgressLsKey = `${userProfile.id}_${BASE_PROGRESS_STORE_KEY}`;
              const persistedState = {
                state: {
                  // Match the structure progressStore's persist expects
                  completion: serverProgressData.completion,
                  penaltyEndTime: serverProgressData.penaltyEndTime,
                },
                version: 0, // TODO: Get version from server if available, or use a default
              };
              localStorage.setItem(
                userProgressLsKey,
                JSON.stringify(persistedState)
              );
              console.log(
                "[AuthStore] (Mocked) Server progress stored in localStorage for user:",
                userProfile.id
              );
            } catch (e) {
              console.error(
                "[AuthStore] Error fetching (mocked) user progress from server or storing it:",
                e
              );
              // If server fetch fails, the user might start with empty progress from localStorage if their key doesn't exist.
              // The claimedAnonymousProgressActions sync (step 6) will still attempt.
            }
          }

          // 5. Set Zustand auth state (this happens before reload)
          set({ isAuthenticated: true, user: userProfile, idToken });
          console.log("[AuthStore] Zustand authentication state updated.");

          // 6. Sync "Claimed" Anonymous Progress to Mocked Server (if any existed and online)
          if (claimedAnonymousProgressActions.length > 0) {
            if (navigator.onLine) {
              try {
                console.log(
                  "[AuthStore] Attempting to sync claimed anonymous progress to server (mocked)...",
                  claimedAnonymousProgressActions
                );
                const batchInput: apiService.BatchCompletionsInput = {
                  completions: claimedAnonymousProgressActions,
                };
                const syncResult = await apiService.updateUserProgress(
                  idToken,
                  apiGatewayUrl,
                  batchInput
                );
                console.log(
                  "[AuthStore] Successfully synced claimed anonymous progress (mocked). Server response:",
                  syncResult
                );
                // The server (even mocked) now has this. If the getUserProgress earlier didn't include it,
                // the next full sync or GET /progress would reflect it.
                // For simplicity, we assume the server handles the merge.
              } catch (e) {
                console.error(
                  "[AuthStore] Failed to sync claimed anonymous progress (mocked):",
                  e
                );
                // In a real app: If this critical sync fails, you'd add these actions to the user's
                // own robust offline queue in progressStore. For this phase, logging is okay.
                // This implies a need for progressStore to handle an initial batch of "to-sync" items.
              }
            } else {
              console.warn(
                "[AuthStore] User is offline. Claimed anonymous progress was not synced. It would need to be added to a user-specific offline queue."
              );
              // This is a more complex scenario: user logs in offline and had prior anon data.
              // The anon data is cleared locally. To preserve it, it would need to be added
              // to the (yet to be fully implemented) user's offline queue in progressStore.
              // For now, if login occurs offline, this specific claimed anonymous progress might be lost
              // if not immediately synced. The server-fetched state (step 4) is the primary.
            }
          }

          // 7. Trigger the reload.
          console.log("[AuthStore] Login successful, reloading page.");
          window.location.reload();
        },

        logout: async () => {
          console.log("[AuthStore] Logout action started.");
          const previousUser = get().user;

          // Clear Zustand auth state first
          set({ ...initialAuthState });
          console.log("[AuthStore] Zustand authentication state reset.");

          // User's specific progress data in localStorage is NOT deleted here
          // to allow it to persist if they log back in.
          if (previousUser && previousUser.id) {
            console.log(
              `[AuthStore] User ${previousUser.id} logged out. Their specific progress data remains in localStorage.`
            );
          }

          // The googleLogout() function from @react-oauth/google should be called
          // by your UI component that handles the Google logout button, before calling this action.

          console.log(
            "[AuthStore] Logout complete, reloading page for an anonymous session."
          );
          window.location.reload();
        },

        getIdToken: () => get().idToken,
      },
    }),
    {
      name: "auth-storage", // localStorage key for the auth store's own persisted state
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        idToken: state.idToken,
      }),
    }
  )
);

// Optional: Export actions hook for convenience
export const useAuthActions = () => useAuthStore((state) => state.actions);
