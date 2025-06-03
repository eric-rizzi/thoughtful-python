import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore"; // To get idToken for API calls
import * as apiService from "../lib/apiService"; // Your API service
import type {
  SectionCompletionInput,
  UserProgressData,
} from "../types/apiServiceTypes";
import { ANONYMOUS_USER_ID_PLACEHOLDER } from "../lib/localStorageUtils";
import { API_GATEWAY_BASE_URL } from "../config";
import { IsoTimestamp, LessonId, SectionId } from "../types/data";

export const BASE_PROGRESS_STORE_KEY = "lesson-progress-storage-v2"; // Make sure this is exported

const EMPTY_COMPLETED_SECTIONS: { [sectionId: SectionId]: IsoTimestamp } = {};
const PENALTY_DURATION_MS = 15 * 1000;

interface ProgressStateData {
  completion: {
    [lessonId: LessonId]: {
      [sectionId: SectionId]: IsoTimestamp; // timeFirstCompleted
    };
  };
  penaltyEndTime: number | null;
  offlineActionQueue: SectionCompletionInput[]; // To store actions made while offline
  isSyncing: boolean; // True if a sync operation with the server is in progress
  lastSyncError: string | null; // Stores the last error message from a sync attempt
}

interface ProgressActions {
  completeSection: (lessonId: LessonId, sectionId: SectionId) => Promise<void>; // Now async
  isSectionComplete: (lessonId: LessonId, sectionId: SectionId) => boolean;
  getCompletedSections: (lessonId: LessonId) => {
    [sectionId: SectionId]: string;
  };
  resetLessonProgress: (lessonId: LessonId) => void;
  resetAllProgress: () => void; // Should also clear offline queue
  startPenalty: () => void;
  clearPenalty: () => void;
  setServerProgress: (serverData: UserProgressData) => void; // New action
  processOfflineQueue: () => Promise<void>; // New action
  _addToOfflineQueue: (action: SectionCompletionInput) => void; // Internal helper
}

interface ProgressState extends ProgressStateData {
  actions: ProgressActions;
}

const initialProgressData: ProgressStateData = {
  completion: {},
  penaltyEndTime: null,
  offlineActionQueue: [],
  isSyncing: false,
  lastSyncError: null,
};

// createUserSpecificStorage (assuming it's defined as in your existing code)
const createUserSpecificStorage = (baseKey: string): StateStorage => {
  const getEffectiveKey = (): string => {
    const authState = useAuthStore.getState();
    const userId =
      authState.isAuthenticated && authState.user
        ? authState.user.userId
        : ANONYMOUS_USER_ID_PLACEHOLDER;
    return `${userId}_${baseKey}`;
  };
  return {
    getItem: (name) => localStorage.getItem(getEffectiveKey()),
    setItem: (name, value) => localStorage.setItem(getEffectiveKey(), value),
    removeItem: (name) => localStorage.removeItem(getEffectiveKey()),
  };
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialProgressData,
      actions: {
        _addToOfflineQueue: (action) => {
          set((state) => ({
            offlineActionQueue: [...state.offlineActionQueue, action],
            lastSyncError: null, // Clear previous error when new action is queued
          }));
        },
        completeSection: async (lessonId, sectionId) => {
          // Correctly get current completions for the lesson as an object
          const currentLessonCompletions = get().completion[lessonId] || {};

          if (currentLessonCompletions[sectionId]) {
            // Check if the sectionId key exists
            console.log(
              `[ProgressStore] Section ${lessonId}/${sectionId} already complete locally with timestamp: ${currentLessonCompletions[sectionId]}.`
            );
            return;
          }

          const optimisticTimestamp = new Date().toISOString(); // Use a real ISO timestamp

          // Optimistic local update - THIS IS THE CORRECTED PART
          set((state) => ({
            completion: {
              ...state.completion,
              [lessonId]: {
                ...(state.completion[lessonId] || {}), // Spread existing sections for this lesson
                [sectionId]: optimisticTimestamp, // Correctly use dynamic sectionId as key
              },
            },
            lastSyncError: null,
          }));
          console.log(
            `[ProgressStore] Optimistically completed ${lessonId}/${sectionId} locally at ${optimisticTimestamp}.`
          );

          const { isAuthenticated, actions: authActions } =
            useAuthStore.getState();
          if (!isAuthenticated) {
            console.log(
              "[ProgressStore] User not authenticated. Local optimistic update for anonymous user is done."
            );
            return;
          }

          const actionToSync: SectionCompletionInput = { lessonId, sectionId };

          if (navigator.onLine) {
            try {
              const idToken = authActions.getIdToken();
              const apiGatewayUrl = API_GATEWAY_BASE_URL; // Using fixed URL from config

              if (idToken && apiGatewayUrl) {
                console.log(
                  `[ProgressStore] Attempting to sync completion: ${lessonId}/${sectionId}`
                );
                const serverResponseState = await apiService.updateUserProgress(
                  idToken,
                  apiGatewayUrl,
                  {
                    completions: [actionToSync],
                  }
                );
                console.log(
                  `[ProgressStore] Successfully synced completion: ${lessonId}/${sectionId}. Server state:`,
                  serverResponseState
                );

                // Crucial: Update local state with the authoritative state from the server
                // This ensures server timestamps are reflected and reconciles any differences.
                get().actions.setServerProgress(serverResponseState);
              } else {
                throw new Error(
                  "Missing token or API URL for authenticated sync. Queuing action."
                );
              }
            } catch (error) {
              console.error(
                `[ProgressStore] Failed to sync completion ${lessonId}/${sectionId}:`,
                error
              );
              get().actions._addToOfflineQueue(actionToSync); // Use the internal action
              set({
                // Update lastSyncError through set for reactivity
                lastSyncError:
                  error instanceof Error ? error.message : String(error),
              });
            }
          } else {
            console.log(
              `[ProgressStore] App is offline. Queuing completion: ${lessonId}/${sectionId}`
            );
            get().actions._addToOfflineQueue(actionToSync);
          }
        },
        setServerProgress: (serverData) => {
          console.log(
            "[ProgressStore] Setting/Merging progress from server data:",
            serverData
          );

          set((state) => {
            // Create a deep copy of the current completion state to avoid direct mutation issues
            const newCompletionState = JSON.parse(
              JSON.stringify(state.completion)
            );

            // Merge serverData into newCompletionState
            // Server data is the source of truth for sections it knows about.
            for (const lessonId in serverData.completion) {
              if (!newCompletionState[lessonId]) {
                newCompletionState[lessonId] = {};
              }
              for (const sectionId in serverData.completion[lessonId]) {
                newCompletionState[lessonId][sectionId] =
                  serverData.completion[lessonId][sectionId];
              }
            }

            // Filter offline queue: remove actions already covered by serverData
            const updatedQueue = state.offlineActionQueue.filter((action) => {
              const lessonCompletionsOnServer =
                serverData.completion[action.lessonId] || {};
              return !(action.sectionId in lessonCompletionsOnServer);
            });

            return {
              completion: newCompletionState,
              offlineActionQueue: updatedQueue,
              lastSyncError: null,
            };
          });
          console.log("[ProgressStore] Local state updated with server data.");
        },
        processOfflineQueue: async () => {
          // ... (Ensure this method also uses API_GATEWAY_BASE_URL from config)
          const { isSyncing, offlineActionQueue } = get();
          const { isAuthenticated, actions: authActions } =
            useAuthStore.getState();

          if (
            !isAuthenticated ||
            isSyncing ||
            offlineActionQueue.length === 0 ||
            !navigator.onLine
          ) {
            return;
          }

          set({ isSyncing: true, lastSyncError: null });
          const queueSnapshot = [...offlineActionQueue]; // Process a snapshot

          try {
            const idToken = authActions.getIdToken();
            const apiGatewayUrl = API_GATEWAY_BASE_URL; // Use fixed URL

            if (idToken && apiGatewayUrl) {
              const serverResponseState = await apiService.updateUserProgress(
                idToken,
                apiGatewayUrl,
                {
                  completions: queueSnapshot,
                }
              );
              console.log(
                "[ProgressStore] Successfully synced offline queue batch to server."
              );

              // Update local state with authoritative server state
              get().actions.setServerProgress(serverResponseState);

              // Remove only the successfully synced items from the main queue
              // (setServerProgress might have already cleared some if they were in serverResponseState)
              set((state) => ({
                offlineActionQueue: state.offlineActionQueue.filter(
                  (item) =>
                    !queueSnapshot.some(
                      (syncedItem) =>
                        syncedItem.lessonId === item.lessonId &&
                        syncedItem.sectionId === item.sectionId
                    )
                ),
              }));
            } else {
              throw new Error("Missing token or API URL for offline sync.");
            }
          } catch (error) {
            console.error(
              "[ProgressStore] Failed to sync offline queue:",
              error
            );
            set({
              lastSyncError:
                error instanceof Error ? error.message : String(error),
            });
          } finally {
            set({ isSyncing: false });
          }
        },
        isSectionComplete: (lessonId, sectionId) => {
          const lessonCompletion = get().completion[lessonId] || [];
          return sectionId in lessonCompletion;
        },
        getCompletedSections: (lessonId) => {
          return get().completion[lessonId] || EMPTY_COMPLETED_SECTIONS;
        },
        resetLessonProgress: (
          lessonId // This should ideally also inform the server
        ) =>
          set((state) => {
            const newCompletion = { ...state.completion };
            delete newCompletion[lessonId];
            // TODO: Add server call for reset if needed, or queue it.
            // For now, local reset only.
            console.warn(
              `[ProgressStore] Local reset for lesson ${lessonId}. Server sync for reset not implemented.`
            );
            return {
              completion: newCompletion,
              // Also reset relevant items from offline queue for this lesson
              offlineActionQueue: state.offlineActionQueue.filter(
                (act) => act.lessonId !== lessonId
              ),
            };
          }),
        resetAllProgress: () => {
          // This should also inform the server
          set({ ...initialProgressData }); // Resets to initial state, including empty offline queue
          // TODO: Add server call for full reset if needed.
          console.warn(
            "[ProgressStore] Local reset for all progress. Server sync for reset not implemented."
          );
        },
        startPenalty: () =>
          set({ penaltyEndTime: Date.now() + PENALTY_DURATION_MS }),
        clearPenalty: () => set({ penaltyEndTime: null }),
      },
    }),
    {
      name: BASE_PROGRESS_STORE_KEY,
      storage: createJSONStorage(() =>
        createUserSpecificStorage(BASE_PROGRESS_STORE_KEY)
      ),
      partialize: (state) => ({
        // Persist these fields
        completion: state.completion,
        penaltyEndTime: state.penaltyEndTime,
        offlineActionQueue: state.offlineActionQueue,
        // Do not persist transient fields like isSyncing or lastSyncError directly if they should reset on load
        // However, for lastSyncError, persisting it might be useful to show to the user on next load.
        // Let's persist lastSyncError, but isSyncing should reset.
        lastSyncError: state.lastSyncError,
      }),
      onRehydrateStorage: (state) => {
        console.log("[ProgressStore] Hydration finished.");
        return (hydratedState, error) => {
          if (error) {
            console.error(
              "[ProgressStore] Error rehydrating progress store:",
              error
            );
          } else if (hydratedState) {
            // Reset isSyncing to false on rehydration, as any sync would have been interrupted.
            hydratedState.isSyncing = false;
            console.log(
              "[ProgressStore] Rehydrated state. isSyncing reset to false. Offline queue length:",
              hydratedState.offlineActionQueue?.length
            );
          }
        };
      },
    }
  )
);

// Selectors
export const useProgressActions = () =>
  useProgressStore((state) => state.actions);
export const useCompletedSectionsForLesson = (
  lessonId: LessonId | undefined
): { [sectionId: SectionId]: IsoTimestamp } =>
  useProgressStore((state) =>
    lessonId
      ? state.completion[lessonId] || EMPTY_COMPLETED_SECTIONS
      : EMPTY_COMPLETED_SECTIONS
  );
export const useAllCompletions = () =>
  useProgressStore((state) => state.completion);
export const useIsPenaltyActive = (): boolean =>
  useProgressStore(
    (state) =>
      state.penaltyEndTime !== null && Date.now() < state.penaltyEndTime
  );
export const useRemainingPenaltyTime = (): number => {
  const penaltyEndTime = useProgressStore((state) => state.penaltyEndTime);
  if (penaltyEndTime === null || Date.now() >= penaltyEndTime) return 0;
  return Math.ceil((penaltyEndTime - Date.now()) / 1000);
};
export const useIsSyncing = () => useProgressStore((state) => state.isSyncing);
export const useLastSyncError = () =>
  useProgressStore((state) => state.lastSyncError);
export const useOfflineQueueCount = () =>
  useProgressStore((state) => state.offlineActionQueue.length);
