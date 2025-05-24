import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore"; // To get idToken for API calls
import { useApiSettingsStore } from "./apiSettingsStore"; // To get API Gateway URL
import * as apiService from "../lib/apiService"; // Your API service
import type {
  SectionCompletionInput,
  UserProgressData,
} from "../types/apiServiceTypes";
import { ANONYMOUS_USER_ID_PLACEHOLDER } from "../lib/localStorageUtils";

export const BASE_PROGRESS_STORE_KEY = "lesson-progress-storage-v2"; // Make sure this is exported

const EMPTY_COMPLETED_SECTIONS: { [sectionId: string]: string } = {};
const PENALTY_DURATION_MS = 15 * 1000;

interface ProgressStateData {
  completion: {
    [lessonId: string]: {
      [sectionId: string]: string; // timeFirstCompleted
    };
  };
  penaltyEndTime: number | null;
  offlineActionQueue: SectionCompletionInput[]; // To store actions made while offline
  isSyncing: boolean; // True if a sync operation with the server is in progress
  lastSyncError: string | null; // Stores the last error message from a sync attempt
}

interface ProgressActions {
  completeSection: (lessonId: string, sectionId: string) => Promise<void>; // Now async
  isSectionComplete: (lessonId: string, sectionId: string) => boolean;
  getCompletedSections: (lessonId: string) => { [sectionId: string]: string };
  resetLessonProgress: (lessonId: string) => void;
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
        ? authState.user.id
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
          const currentCompletion = get().completion[lessonId] || [];
          if (sectionId in currentCompletion) {
            console.log(
              `[ProgressStore] Section ${lessonId}/${sectionId} already complete locally.`
            );
            return; // Already complete locally
          }

          // Optimistic local update
          set((state) => ({
            completion: {
              ...state.completion,
              [lessonId]: { ...currentCompletion, sectionId: "2025-01-01" },
            },
          }));
          console.log(
            `[ProgressStore] Optimistically completed ${lessonId}/${sectionId} locally.`
          );

          const { isAuthenticated, actions: authActions } =
            useAuthStore.getState();
          if (!isAuthenticated) {
            console.log(
              "[ProgressStore] User not authenticated. Progress saved locally for anonymous."
            );
            return; // For anonymous users, progress is only local until login & claim
          }

          const actionToSync: SectionCompletionInput = { lessonId, sectionId };

          if (navigator.onLine) {
            try {
              const idToken = authActions.getIdToken();
              const apiGatewayUrl =
                useApiSettingsStore.getState().progressApiGateway;
              if (idToken && apiGatewayUrl) {
                console.log(
                  `[ProgressStore] Attempting to sync completion: ${lessonId}/${sectionId}`
                );
                await apiService.updateUserProgress(idToken, apiGatewayUrl, {
                  completions: [actionToSync],
                });
                console.log(
                  `[ProgressStore] Successfully synced completion: ${lessonId}/${sectionId}`
                );
                // Optional: Could update local state with server response if it differs significantly
              } else {
                throw new Error(
                  "Missing token or API URL for authenticated sync."
                );
              }
            } catch (error) {
              console.error(
                `[ProgressStore] Failed to sync completion ${lessonId}/${sectionId}:`,
                error
              );
              set({
                lastSyncError:
                  error instanceof Error ? error.message : String(error),
              });
              get().actions._addToOfflineQueue(actionToSync); // Add to queue on failure
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
            "[ProgressStore] Setting progress from server data:",
            serverData
          );
          // Naive approach: Overwrite local state.
          // A more advanced version would merge or reconcile with offlineActionQueue.
          // For example, remove actions from queue if serverData.completion already includes them.
          // For now, we'll overwrite and let processOfflineQueue handle potential redundancies
          // (server merge should be idempotent).
          const newCompletion = serverData.completion || {};

          // Smart queue clearing: remove actions from queue if server already has them
          const currentQueue = get().offlineActionQueue;
          console.log(currentQueue);
          const updatedQueue = currentQueue.filter((action) => {
            const lessonCompletionsOnServer =
              newCompletion[action.lessonId] || {};
            return !(action.sectionId in lessonCompletionsOnServer);
          });

          set({
            completion: newCompletion,
            offlineActionQueue: updatedQueue, // Set the filtered queue
            lastSyncError: null, // Clear sync error as we have new truth from server
          });
          console.log(
            "[ProgressStore] Local state updated with server data. Filtered offline queue:",
            updatedQueue
          );
        },
        processOfflineQueue: async () => {
          const { isSyncing, offlineActionQueue } = get();
          const { isAuthenticated, actions: authActions } =
            useAuthStore.getState();

          if (!isAuthenticated) {
            // console.log("[ProgressStore] processOfflineQueue: User not authenticated. Skipping.");
            return; // Only sync for authenticated users
          }

          if (isSyncing || offlineActionQueue.length === 0) {
            // console.log(`[ProgressStore] processOfflineQueue: Skipping. Syncing: ${isSyncing}, Queue empty: ${offlineActionQueue.length === 0}`);
            return;
          }

          if (!navigator.onLine) {
            console.log(
              "[ProgressStore] processOfflineQueue: App is offline. Skipping."
            );
            return;
          }

          set({ isSyncing: true, lastSyncError: null });
          console.log(
            "[ProgressStore] Processing offline queue:",
            offlineActionQueue
          );

          // Take a snapshot of the queue to send
          // This prevents issues if new items are added while this async operation is in flight
          const queueSnapshot = [...offlineActionQueue];

          try {
            const idToken = authActions.getIdToken();
            const apiGatewayUrl =
              useApiSettingsStore.getState().progressApiGateway;
            if (idToken && apiGatewayUrl) {
              await apiService.updateUserProgress(idToken, apiGatewayUrl, {
                completions: queueSnapshot,
              });
              console.log(
                "[ProgressStore] Successfully synced offline queue batch to server."
              );
              // Remove successfully synced items from the main queue
              set((state) => ({
                offlineActionQueue: state.offlineActionQueue.filter(
                  (item) => !queueSnapshot.includes(item)
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
            // Items remain in queue for next attempt
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
  lessonId: string | undefined
): { [sectionId: string]: string } =>
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
