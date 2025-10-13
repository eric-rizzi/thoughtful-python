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

  describe("saveProgress - edge cases", () => {
    it("should handle saving complex nested objects", () => {
      const complexData = {
        level1: {
          level2: {
            array: [1, 2, 3],
            string: "test",
          },
        },
      };
      saveProgress(userId, subKey, complexData);
      const loaded = loadProgress(userId, subKey);
      expect(loaded).toEqual(complexData);
    });

    it("should handle saving arrays", () => {
      const arrayData = [1, 2, 3, "test", { nested: true }];
      saveProgress(userId, subKey, arrayData);
      const loaded = loadProgress(userId, subKey);
      expect(loaded).toEqual(arrayData);
    });

    it("should handle undefined userId (treated as anonymous)", () => {
      saveProgress(undefined, subKey, progressData);
      const loaded = loadProgress(undefined, subKey);
      expect(loaded).toEqual(progressData);

      // Should use anonymous placeholder
      const expectedKey = `${ANONYMOUS_USER_ID_PLACEHOLDER}_${subKey}`;
      expect(localStorage.getItem(expectedKey)).toBe(
        JSON.stringify(progressData)
      );
    });

    it("should handle empty string subKey", () => {
      saveProgress(userId, "", progressData);
      const loaded = loadProgress(userId, "");
      expect(loaded).toEqual(progressData);
    });
  });

  describe("loadProgress - edge cases", () => {
    it("should return null for malformed JSON in storage", () => {
      const key = `${userId}_${subKey}`;
      localStorage.setItem(key, "{ invalid json }");
      const loaded = loadProgress(userId, subKey);
      expect(loaded).toBeNull();
    });

    it("should return null when storage throws an error", () => {
      // Temporarily break localStorage.getItem
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => {
        throw new Error("Storage error");
      };

      const loaded = loadProgress(userId, subKey);
      expect(loaded).toBeNull();

      // Restore
      localStorage.getItem = originalGetItem;
    });
  });

  describe("migrateAnonymousDataToUser - edge cases", () => {
    it("should return error when newUserId is empty", () => {
      const result = migrateAnonymousDataToUser("" as UserId);
      expect(result.success).toBe(false);
      expect(result.error).toBe("New User ID is required for migration.");
      expect(result.migratedSubKeys).toEqual([]);
    });

    it("should return error when newUserId is null", () => {
      const result = migrateAnonymousDataToUser(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("New User ID is required for migration.");
    });

    it("should succeed with no data when no anonymous data exists", () => {
      localStorage.setItem(`${userId}_someKey`, "data");
      const result = migrateAnonymousDataToUser(userId);
      expect(result.success).toBe(true);
      expect(result.migratedSubKeys).toEqual([]);
    });

    it("should migrate multiple anonymous keys", () => {
      localStorage.setItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_key1`, "data1");
      localStorage.setItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_key2`, "data2");
      localStorage.setItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_key3`, "data3");

      const result = migrateAnonymousDataToUser(userId);
      expect(result.success).toBe(true);
      expect(result.migratedSubKeys.length).toBe(3);
      expect(result.migratedSubKeys).toContain("key1");
      expect(result.migratedSubKeys).toContain("key2");
      expect(result.migratedSubKeys).toContain("key3");

      // Verify all were moved
      expect(localStorage.getItem(`${userId}_key1`)).toBe("data1");
      expect(localStorage.getItem(`${userId}_key2`)).toBe("data2");
      expect(localStorage.getItem(`${userId}_key3`)).toBe("data3");

      // Verify old keys removed
      expect(
        localStorage.getItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_key1`)
      ).toBeNull();
    });

    it("should preserve data integrity during migration", () => {
      const complexData = {
        nested: { array: [1, 2, 3] },
        string: "test",
      };
      saveProgress(null, "complex", complexData);

      const result = migrateAnonymousDataToUser(userId);
      expect(result.success).toBe(true);

      const migratedData = loadProgress(userId, "complex");
      expect(migratedData).toEqual(complexData);
    });
  });

  describe("clearAllAnonymousData - edge cases", () => {
    it("should handle clearing when no anonymous data exists", () => {
      localStorage.setItem(`${userId}_key1`, "data");
      clearAllAnonymousData();
      // Should not throw and should leave user data intact
      expect(localStorage.getItem(`${userId}_key1`)).toBe("data");
    });

    it("should handle clearing multiple anonymous keys", () => {
      for (let i = 0; i < 10; i++) {
        localStorage.setItem(
          `${ANONYMOUS_USER_ID_PLACEHOLDER}_key${i}`,
          `data${i}`
        );
      }

      clearAllAnonymousData();

      for (let i = 0; i < 10; i++) {
        expect(
          localStorage.getItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_key${i}`)
        ).toBeNull();
      }
    });

    it("should only clear keys with exact anonymous placeholder prefix", () => {
      // The function clears keys starting with "anonymous_"
      // This test documents the actual behavior
      localStorage.setItem(`not_anonymous_key`, "data1"); // Different prefix
      localStorage.setItem(`${userId}_key`, "data2"); // User-specific
      localStorage.setItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_key`, "data3");

      clearAllAnonymousData();

      // Keys without anonymous_ prefix should remain
      expect(localStorage.getItem(`not_anonymous_key`)).toBe("data1");
      expect(localStorage.getItem(`${userId}_key`)).toBe("data2");

      // Anonymous keys should be cleared
      expect(
        localStorage.getItem(`${ANONYMOUS_USER_ID_PLACEHOLDER}_key`)
      ).toBeNull();
    });
  });
});
