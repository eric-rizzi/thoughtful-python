// src/lib/localStorageUtils.ts

/**
 * Saves progress data to localStorage.
 * @param key The unique key for the data.
 * @param data The data to save (should be JSON-serializable).
 */
export function saveProgress<T>(key: string, data: T): void {
  try {
      localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
      console.error(`Error saving progress to localStorage for key "${key}":`, error);
  }
}

/**
* Loads progress data from localStorage.
* @param key The unique key for the data.
* @returns The parsed data or null if not found or parsing fails.
*/
export function loadProgress<T>(key: string): T | null {
  try {
      const savedData = localStorage.getItem(key);
      if (savedData === null) {
          return null; // No data saved
      }
      return JSON.parse(savedData) as T;
  } catch (error) {
      console.error(`Error loading progress from localStorage for key "${key}":`, error);
      localStorage.removeItem(key); // Remove corrupted data
      return null;
  }
}