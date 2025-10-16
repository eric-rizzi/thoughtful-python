import type { Lesson, LessonId } from "../../types/data";

// --- Mock Data ---
const mockLesson1: Lesson = {
  guid: "lesson-1" as LessonId,
  title: "Lesson One Title",
  description: "The first lesson description",
  sections: [
    { kind: "Information", id: "sec-1a" },
    { kind: "Reflection", id: "sec-1b" },
  ],
};

// Import the functions we want to test
import {
  getRequiredSectionsForLesson,
  hasReviewableAssignments,
} from "../dataLoader";

describe("dataLoader - Pure Logic Functions", () => {
  describe("getRequiredSectionsForLesson", () => {
    it("should return a list of IDs for all sections except 'Information'", () => {
      const requiredSections = getRequiredSectionsForLesson(mockLesson1);
      // "sec-1a" (Information) should be excluded, "sec-1b" (Reflection) should be included
      expect(requiredSections).toEqual(["sec-1b"]);
    });

    it("should return empty array for lesson with no sections", () => {
      const lessonWithoutSections: Lesson = {
        guid: "lesson-empty" as LessonId,
        title: "Empty Lesson",
        sections: [],
      };
      const result = getRequiredSectionsForLesson(lessonWithoutSections);
      expect(result).toEqual([]);
    });

    it("should return empty array for null lesson", () => {
      const result = getRequiredSectionsForLesson(null as any);
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
      const result = getRequiredSectionsForLesson(lessonWithMixed);
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
      const result = getRequiredSectionsForLesson(lessonWithAllRequired);
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

  describe("hasReviewableAssignments", () => {
    it("should return true if a lesson contains a Reflection section", () => {
      const result = hasReviewableAssignments(mockLesson1);
      expect(result).toBe(true);
    });

    it("should return false if a lesson has no reviewable sections", () => {
      const lessonWithoutReviewables: Lesson = {
        guid: "lesson-2" as LessonId,
        title: "No Assignments Here",
        sections: [{ kind: "Information", id: "info-1" }],
      };
      const result = hasReviewableAssignments(lessonWithoutReviewables);
      expect(result).toBe(false);
    });

    it("should return true for lesson with PRIMM section", () => {
      const lessonWithPrimm: Lesson = {
        guid: "lesson-primm" as LessonId,
        title: "PRIMM Lesson",
        sections: [
          { kind: "Information", id: "info-1" },
          { kind: "PRIMM", id: "primm-1" },
        ],
      };
      const result = hasReviewableAssignments(lessonWithPrimm);
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
      const result = hasReviewableAssignments(lessonWithBoth);
      expect(result).toBe(true);
    });

    it("should return false for null lesson", () => {
      const result = hasReviewableAssignments(null as any);
      expect(result).toBe(false);
    });

    it("should return false for lesson without sections array", () => {
      const lessonWithoutSections = {
        guid: "lesson-no-sections" as LessonId,
        title: "No Sections",
      } as any;
      const result = hasReviewableAssignments(lessonWithoutSections);
      expect(result).toBe(false);
    });

    it("should return false for lesson with empty sections", () => {
      const lessonEmpty: Lesson = {
        guid: "lesson-empty" as LessonId,
        title: "Empty",
        sections: [],
      };
      const result = hasReviewableAssignments(lessonEmpty);
      expect(result).toBe(false);
    });
  });
});
