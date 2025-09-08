import {
  saveProgress,
  loadProgress,
  clearAllAnonymousData,
  migrateAnonymousDataToUser,
  hasAnonymousData,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../localStorageUtils";
import type { UserId } from "../../types/data";

// --- In-memory mock for localStorage ---
// This creates a simple object that mimics the localStorage API.
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// Replace the global localStorage object with our mock for the duration of these tests
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("localStorageUtils", () => {
  const userId = "user-123" as UserId;
  const subKey = "test-progress";
  const progressData = { completed: true, score: 100 };

  // Clear the mock localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  describe("saveProgress and loadProgress", () => {
    it("should save and load progress for a specific user", () => {
      // ACT: Save progress for a logged-in user
      saveProgress(userId, subKey, progressData);

      // ASSERT: Load the progress back and check if it's correct
      const loaded = loadProgress(userId, subKey);
      expect(loaded).toEqual(progressData);

      // Ensure it was saved with the correct user-specific key
      const expectedKey = `${userId}_${subKey}`;
      expect(localStorage.getItem(expectedKey)).toBe(
        JSON.stringify(progressData)
      );
    });

    it("should save and load progress for an anonymous user", () => {
      // ACT: Save progress with a null user ID
      saveProgress(null, subKey, progressData);

      // ASSERT: Load the progress back and check if it's correct
      const loaded = loadProgress(null, subKey);
      expect(loaded).toEqual(progressData);

      // Ensure it was saved with the anonymous placeholder key
      const expectedKey = `${ANONYMOUS_USER_ID_PLACEHOLDER}_${subKey}`;
      expect(localStorage.getItem(expectedKey)).toBe(
        JSON.stringify(progressData)
      );
    });

    it("should return null when loading progress that doesn't exist", () => {
      const loaded = loadProgress(userId, "non-existent-key");
      expect(loaded).toBeNull();
    });
  });

  describe("clearAllAnonymousData", () => {
    it("should remove only anonymous data, leaving user-specific data intact", () => {
      // ARRANGE: Set up a mix of anonymous and user-specific data
      localStorage.setItem(
        `${ANONYMOUS_USER_ID_PLACEHOLDER}_anonKey1`,
        "data1"
      );
      localStorage.setItem(`${userId}_userKey1`, "data2");

      // ACT
      clearAllAnonymousData();

      // ASSERT
      expect(
        localStorage.getItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_anonKey1`)
      ).toBeNull();
      expect(localStorage.getItem(`${userId}_userKey1`)).toBe("data2");
    });
  });

  describe("migrateAnonymousDataToUser", () => {
    it("should move anonymous data to a new user and clear the old data", () => {
      // ARRANGE
      localStorage.setItem(
        `${ANONYMOUS_USER_ID_PLACEHOLDER}_progress`,
        JSON.stringify(progressData)
      );

      // ACT
      const result = migrateAnonymousDataToUser(userId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.migratedSubKeys).toEqual(["progress"]);

      // Check that the old anonymous data is gone
      expect(
        localStorage.getItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_progress`)
      ).toBeNull();

      // Check that the new user-specific data exists and is correct
      const migratedData = localStorage.getItem(`${userId}_progress`);
      expect(JSON.parse(migratedData!)).toEqual(progressData);
    });
  });

  describe("hasAnonymousData", () => {
    it("should return true if anonymous data exists", () => {
      localStorage.setItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_someKey`, "data");
      expect(hasAnonymousData()).toBe(true);
    });

    it("should return false if only user-specific data exists", () => {
      localStorage.setItem(`${userId}_someKey`, "data");
      expect(hasAnonymousData()).toBe(false);
    });

    it("should return false if localStorage is empty", () => {
      expect(hasAnonymousData()).toBe(false);
    });
  });
});
