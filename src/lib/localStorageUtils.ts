// src/lib/localStorageUtils.ts
import { useAuthStore } from "../stores/authStore"; // To get current user ID if logged in

const ANONYMOUS_USER_ID_PLACEHOLDER = "anonymous";

/**
 * Constructs the full localStorage key.
 * It prepends with the current user's ID if authenticated,
 * otherwise uses an anonymous placeholder.
 * @param subKey The specific key for the piece of data (e.g., "quizState_lesson1_q1").
 * @returns The full key to be used for localStorage.
 */
function getFullStorageKey(subKey: string): string {
  const auth = useAuthStore.getState(); // Get current auth state
  const userId = auth.isAuthenticated && auth.user ? auth.user.id : null;
  const prefix = userId ? `${userId}_` : `${ANONYMOUS_USER_ID_PLACEHOLDER}_`;
  return `${prefix}${subKey}`;
}

export function saveProgress<T>(subKey: string, data: T): void {
  try {
    const fullKey = getFullStorageKey(subKey);
    // console.log(`Saving to localStorage with key: ${fullKey}`);
    localStorage.setItem(fullKey, JSON.stringify(data));
  } catch (error) {
    console.error(
      `Error saving progress to localStorage for subKey "${subKey}":`,
      error
    );
  }
}

export function loadProgress<T>(subKey: string): T | null {
  try {
    const fullKey = getFullStorageKey(subKey);
    // console.log(`Loading from localStorage with key: ${fullKey}`);
    const savedData = localStorage.getItem(fullKey);
    if (savedData === null) {
      return null;
    }
    return JSON.parse(savedData) as T;
  } catch (error) {
    console.error(
      `Error loading progress from localStorage for subKey "${subKey}":`,
      error
    );
    // Optional: Consider removing corrupted data if a parse error occurs
    // localStorage.removeItem(fullKey);
    return null;
  }
}

/**
 * Clears all data stored under the anonymous prefix.
 * This is the primary function used in Strategy 3 when a user logs in.
 */
export function clearAllAnonymousData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${ANONYMOUS_USER_ID_PLACEHOLDER}_`)) {
      keysToRemove.push(key);
    }
  }
  if (keysToRemove.length > 0) {
    console.log("Clearing anonymous data. Keys to remove:", keysToRemove);
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } else {
    // console.log("No anonymous data to clear.");
  }
}

// --- Functions primarily for future Strategy 1 (Prompt to Merge) ---

/**
 * Checks if any data exists under the anonymous prefix.
 * Useful for determining if a merge prompt is needed in Strategy 1.
 */
export function hasAnonymousData(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${ANONYMOUS_USER_ID_PLACEHOLDER}_`)) {
      return true;
    }
  }
  return false;
}

/**
 * Migrates all anonymous data to a specified user ID.
 * Copies data to new user-specific keys and then removes the old anonymous keys.
 * This will be used if you implement Strategy 1.
 */
export function migrateAnonymousDataToUser(newUserId: string): {
  success: boolean;
  error?: string;
  migratedSubKeys: string[];
} {
  if (!newUserId) {
    return {
      success: false,
      error: "New User ID is required for migration.",
      migratedSubKeys: [],
    };
  }

  const anonymousKeysToMigrate: Array<{
    oldFullKey: string;
    originalSubKey: string;
  }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${ANONYMOUS_USER_ID_PLACEHOLDER}_`)) {
      anonymousKeysToMigrate.push({
        oldFullKey: key,
        originalSubKey: key.substring(
          `${ANONYMOUS_USER_ID_PLACEHOLDER}_`.length
        ),
      });
    }
  }

  if (anonymousKeysToMigrate.length === 0) {
    // console.log("No anonymous data to migrate for user:", newUserId);
    return { success: true, migratedSubKeys: [] }; // Nothing to migrate
  }

  const migratedSubKeys: string[] = [];
  try {
    // console.log("Migrating anonymous data for user:", newUserId, "Keys:", anonymousKeysToMigrate.map(k => k.originalSubKey));
    anonymousKeysToMigrate.forEach(({ oldFullKey, originalSubKey }) => {
      const data = localStorage.getItem(oldFullKey); // Data is already stringified JSON
      if (data !== null) {
        const newUserFullKey = `${newUserId}_${originalSubKey}`;
        localStorage.setItem(newUserFullKey, data); // Copy the stringified JSON
        localStorage.removeItem(oldFullKey); // Remove the old anonymous key
        migratedSubKeys.push(originalSubKey);
      }
    });
    return { success: true, migratedSubKeys };
  } catch (e) {
    console.error("Error during data migration for user:", newUserId, e);
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      migratedSubKeys,
    };
  }
}
