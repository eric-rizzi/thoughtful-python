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

  describe("fetchUnitById", () => {
    it("should return the correct unit for a valid unit ID", async () => {
      const unit = await dataLoader.fetchUnitById("unit-1" as UnitId);
      expect(unit).toEqual(mockUnitsData[0]);
    });

    it("should return null for an unknown unit ID", async () => {
      const unit = await dataLoader.fetchUnitById("unknown-unit" as UnitId);
      expect(unit).toBeNull();
    });
  });

  describe("getLessonGuidByPath", () => {
    it("should return the correct lesson GUID for a valid path", async () => {
      const guid = await dataLoader.getLessonGuidByPath("unit01/lesson01");
      expect(guid).toBe("lesson-1");
    });

    it("should return null for an unknown path", async () => {
      const guid = await dataLoader.getLessonGuidByPath("unknown/path");
      expect(guid).toBeNull();
    });
  });

  describe("getLessonPath", () => {
    it("should return the correct path for a valid lesson ID", async () => {
      const path = await dataLoader.getLessonPath("lesson-1" as LessonId);
      expect(path).toBe("unit01/lesson01");
    });

    it("should return null for an unknown lesson ID", async () => {
      const path = await dataLoader.getLessonPath("unknown-id" as LessonId);
      expect(path).toBeNull();
    });
  });

  describe("getRequiredSectionsForLesson - edge cases", () => {
    it("should return empty array for lesson with no sections", () => {
      const lessonWithoutSections: Lesson = {
        guid: "lesson-empty" as LessonId,
        title: "Empty Lesson",
        sections: [],
      };
      const result = dataLoader.getRequiredSectionsForLesson(
        lessonWithoutSections
      );
      expect(result).toEqual([]);
    });

    it("should return empty array for null lesson", () => {
      const result = dataLoader.getRequiredSectionsForLesson(null as any);
      expect(result).toEqual([]);
    });

    it("should filter out Information sections and keep required ones", () => {
      const lessonWithMixed: Lesson = {
        guid: "lesson-mixed" as LessonId,
        title: "Mixed Lesson",
        sections: [
          { kind: "Information", id: "info-1" },
          { kind: "Testing", id: "test-1" },
          { kind: "Information", id: "info-2" },
          { kind: "Prediction", id: "pred-1" },
          { kind: "PRIMM", id: "primm-1" },
        ],
      };
      const result =
        dataLoader.getRequiredSectionsForLesson(lessonWithMixed);
      expect(result).toEqual(["test-1", "pred-1", "primm-1"]);
    });

    it("should include all required section kinds", () => {
      const lessonWithAllRequired: Lesson = {
        guid: "lesson-all" as LessonId,
        title: "All Required",
        sections: [
          { kind: "Observation", id: "obs-1" },
          { kind: "Testing", id: "test-1" },
          { kind: "Prediction", id: "pred-1" },
          { kind: "MultipleChoice", id: "mc-1" },
          { kind: "MultipleSelection", id: "ms-1" },
          { kind: "Reflection", id: "refl-1" },
          { kind: "Coverage", id: "cov-1" },
          { kind: "PRIMM", id: "primm-1" },
          { kind: "Debugger", id: "debug-1" },
        ],
      };
      const result = dataLoader.getRequiredSectionsForLesson(
        lessonWithAllRequired
      );
      expect(result.length).toBe(9);
      expect(result).toContain("obs-1");
      expect(result).toContain("test-1");
      expect(result).toContain("pred-1");
      expect(result).toContain("mc-1");
      expect(result).toContain("ms-1");
      expect(result).toContain("refl-1");
      expect(result).toContain("cov-1");
      expect(result).toContain("primm-1");
      expect(result).toContain("debug-1");
    });
  });

  describe("hasReviewableAssignments - edge cases", () => {
    it("should return true for lesson with PRIMM section", () => {
      const lessonWithPrimm: Lesson = {
        guid: "lesson-primm" as LessonId,
        title: "PRIMM Lesson",
        sections: [
          { kind: "Information", id: "info-1" },
          { kind: "PRIMM", id: "primm-1" },
        ],
      };
      const result = dataLoader.hasReviewableAssignments(lessonWithPrimm);
      expect(result).toBe(true);
    });

    it("should return true for lesson with both Reflection and PRIMM", () => {
      const lessonWithBoth: Lesson = {
        guid: "lesson-both" as LessonId,
        title: "Both Types",
        sections: [
          { kind: "Reflection", id: "refl-1" },
          { kind: "PRIMM", id: "primm-1" },
        ],
      };
      const result = dataLoader.hasReviewableAssignments(lessonWithBoth);
      expect(result).toBe(true);
    });

    it("should return false for null lesson", () => {
      const result = dataLoader.hasReviewableAssignments(null as any);
      expect(result).toBe(false);
    });

    it("should return false for lesson without sections array", () => {
      const lessonWithoutSections = {
        guid: "lesson-no-sections" as LessonId,
        title: "No Sections",
      } as any;
      const result = dataLoader.hasReviewableAssignments(
        lessonWithoutSections
      );
      expect(result).toBe(false);
    });

    it("should return false for lesson with empty sections", () => {
      const lessonEmpty: Lesson = {
        guid: "lesson-empty" as LessonId,
        title: "Empty",
        sections: [],
      };
      const result = dataLoader.hasReviewableAssignments(lessonEmpty);
      expect(result).toBe(false);
    });
  });
});
