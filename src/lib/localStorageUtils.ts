import { UserId } from "../types/data";

// src/lib/localStorageUtils.ts
export const ANONYMOUS_USER_ID_PLACEHOLDER = "anonymous" as UserId;

/**
 * Constructs the full localStorage key.
 * It prepends with the provided user ID or an anonymous placeholder.
 * @param userId The user's ID, or null/undefined for anonymous.
 * @param subKey The specific key for the piece of data (e.g., "quizState_lesson1_q1").
 * @returns The full key to be used for localStorage.
 */
function getFullStorageKey(
  userId: UserId | null | undefined,
  subKey: string
): string {
  const prefix = userId ? `${userId}_` : `${ANONYMOUS_USER_ID_PLACEHOLDER}_`;
  return `${prefix}${subKey}`;
}

export function saveProgress<T>(
  userId: UserId | null | undefined,
  subKey: string,
  data: T
): void {
  try {
    const fullKey = getFullStorageKey(userId, subKey);
    // console.log(`Saving to localStorage with key: ${fullKey}`);
    localStorage.setItem(fullKey, JSON.stringify(data));
  } catch (error) {
    console.error(
      `Error saving progress to localStorage for subKey "${subKey}" (User: ${
        userId || "anonymous"
      }):`,
      error
    );
  }
}

export function loadProgress<T>(
  userId: UserId | null | undefined,
  subKey: string
): T | null {
  try {
    const fullKey = getFullStorageKey(userId, subKey);
    // console.log(`Loading from localStorage with key: ${fullKey}`);
    const savedData = localStorage.getItem(fullKey);
    if (savedData === null) {
      return null;
    }
    return JSON.parse(savedData) as T;
  } catch (error) {
    console.error(
      `Error loading progress from localStorage for subKey "${subKey}" (User: ${
        userId || "anonymous"
      }):`,
      error
    );
    return null;
  }
}

/**
 * Clears all data stored under the anonymous prefix.
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
  }
}

/**
 * Migrates all anonymous data to a specified user ID.
 * Copies data to new user-specific keys and then removes the old anonymous keys.
 */
export function migrateAnonymousDataToUser(newUserId: UserId): {
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
    return { success: true, migratedSubKeys: [] };
  }

  const migratedSubKeys: string[] = [];
  try {
    anonymousKeysToMigrate.forEach(({ oldFullKey, originalSubKey }) => {
      const data = localStorage.getItem(oldFullKey);
      if (data !== null) {
        // Construct new key using the modified getFullStorageKey logic implicitly
        const newUserFullKey = getFullStorageKey(newUserId, originalSubKey);
        localStorage.setItem(newUserFullKey, data);
        localStorage.removeItem(oldFullKey);
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

/**
 * Checks if any data exists under the anonymous prefix.
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
