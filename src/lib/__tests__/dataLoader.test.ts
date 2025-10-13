import { vi } from "vitest";
import type { Unit, Lesson, LessonId, UnitId } from "../../types/data";

// --- Mock Data ---
const mockLesson1: Lesson & { guid: LessonId } = {
  guid: "lesson-1" as LessonId,
  title: "Lesson One Title",
  sections: [
    { kind: "Information", id: "sec-1a" },
    { kind: "Reflection", id: "sec-1b" },
  ],
};

const mockUnitsData: Unit[] = [
  {
    id: "unit-1" as UnitId,
    title: "Unit One",
    description: "The first unit.",
    lessons: [{ guid: "lesson-1" as LessonId, path: "unit01/lesson01" }],
  },
];

// --- Mocks Setup ---
// FIX: The path must be relative from this test file (`src/lib/__tests__`)
// to the target module (`src/assets/data`).
vi.mock("../../assets/data/units", () => ({
  default: mockUnitsData,
}));

// Create a spy for our dynamic lesson import to track calls
const mockLessonLoader = vi.fn(() => Promise.resolve({ default: mockLesson1 }));

// Mock Vite's import.meta.glob function using stubGlobal
vi.stubGlobal("import", {
  meta: {
    glob: vi.fn(() => ({
      // The key must exactly match the glob pattern's expected resolution
      "../assets/data/unit01/lesson01.ts": mockLessonLoader,
    })),
  },
});

describe("dataLoader", () => {
  // This will hold the fresh instance of the dataLoader for each test
  let dataLoader: typeof import("../dataLoader");

  beforeEach(async () => {
    vi.clearAllMocks();
    // This is the most critical part: it clears all module caches,
    // ensuring that when we import dataLoader, its initialization logic runs again.
    vi.resetModules();
    dataLoader = await import("../dataLoader");
  });

  describe("fetchUnitsData", () => {
    it("should process and return the units data from the mocked module", async () => {
      const { units } = await dataLoader.fetchUnitsData();
      expect(units).toEqual(mockUnitsData);
    });
  });

  describe("fetchLessonData", () => {
    it("should return null for a path not defined in units.ts", async () => {
      const lesson = await dataLoader.fetchLessonData("non/existent/path");
      expect(lesson).toBeNull();
    });
  });

  describe("getRequiredSectionsForLesson", () => {
    it("should return a list of IDs for all sections except 'Information'", () => {
      const requiredSections =
        dataLoader.getRequiredSectionsForLesson(mockLesson1);
      // "sec-1a" (Information) should be excluded, "sec-1b" (Reflection) should be included
      expect(requiredSections).toEqual(["sec-1b"]);
    });
  });

  describe("hasReviewableAssignments", () => {
    it("should return true if a lesson contains a Reflection section", () => {
      const result = dataLoader.hasReviewableAssignments(mockLesson1);
      expect(result).toBe(true);
    });

    it("should return false if a lesson has no reviewable sections", () => {
      const lessonWithoutReviewables: Lesson = {
        guid: "lesson-2" as LessonId,
        title: "No Assignments Here",
        sections: [{ kind: "Information", id: "info-1" }],
      };
      const result = dataLoader.hasReviewableAssignments(
        lessonWithoutReviewables
      );
      expect(result).toBe(false);
    });
  });

  describe("getLessonPathSync", () => {
    it("should return the correct path for a given lesson ID", () => {
      const path = dataLoader.getLessonPathSync("lesson-1" as LessonId);
      expect(path).toBe("unit01/lesson01");
    });

    it("should return null for an unknown lesson ID", () => {
      const path = dataLoader.getLessonPathSync("unknown-id" as LessonId);
      expect(path).toBeNull();
    });
  });
});
