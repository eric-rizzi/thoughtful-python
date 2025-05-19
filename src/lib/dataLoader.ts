// src/lib/dataLoader.ts
import type { UnitsData, Unit, Lesson } from "../types/data";
import { BASE_PATH } from "../config";

const DATA_FOLDER = "data";

/**
 * Fetches the main units data file.
 * @returns Promise resolving to the UnitsData object.
 * @throws Error if fetching or parsing fails.
 */
export async function fetchUnitsData(): Promise<UnitsData> {
  const url = `${BASE_PATH}${DATA_FOLDER}/units.json`;
  console.log(`Workspaceing units from: ${url}`); // Log the URL being fetched

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} loading ${url}`);
    }
    const data: UnitsData = await response.json();
    if (!data || !Array.isArray(data.units)) {
      throw new Error("Invalid units data format");
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch units data:", error);
    throw new Error(
      `Could not load units data from ${url}. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

const lessonModules: Record<string, () => Promise<any>> = import.meta.glob(
  "../assets/data/**/*.ts"
);
// Example structure of lessonModules:
// {
//   '../assets/data/00_intro/lesson_1.ts': () => import('../assets/data/00_intro/lesson_1.ts'),
//   '../assets/data/01_strings/lesson_1.ts': () => import('../assets/data/01_strings/lesson_1.ts'),
//   ...
// }

export async function fetchLessonData(lessonPath: string): Promise<Lesson> {
  // lessonPath is expected to be like "00_intro/lesson_1" (without .ts)
  const moduleKey = `../assets/data/${lessonPath}.ts`;

  const moduleImporter = lessonModules[moduleKey];
  if (!moduleImporter) {
    console.error("Available module keys:", Object.keys(lessonModules));
    throw new Error(
      `Lesson module importer not found for path: ${lessonPath} (resolved to key: ${moduleKey})`
    );
  }

  try {
    const lessonModule = await moduleImporter();

    if (!lessonModule.default) {
      throw new Error(
        `Lesson module at ${moduleKey} did not have a default export.`
      );
    }
    const lessonData: Lesson = lessonModule.default;

    if (
      !lessonData ||
      !lessonData.title ||
      !Array.isArray(lessonData.sections)
    ) {
      throw new Error(
        `Invalid lesson data format for ${lessonPath} from module.`
      );
    }
    return lessonData;
  } catch (error) {
    console.error(
      `Failed to dynamically import lesson data for ${lessonPath} from ${moduleKey}:`,
      error
    );
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not load lesson data module for '${lessonPath}'. Error: ${errorMessage}`
    );
  }
}

// fetchUnitById and getRequiredSectionsForLesson can remain as they are
// assuming fetchUnitsData and the Lesson type are consistent.
export async function fetchUnitById(unitId: string): Promise<Unit | null> {
  // ... (implementation remains the same)
  try {
    const unitsData = await fetchUnitsData();
    const unit = unitsData.units.find((u) => u.id === unitId);
    return unit || null;
  } catch (error) {
    console.error(`Failed to fetch unit by ID ${unitId}:`, error);
    throw error;
  }
}

export function getRequiredSectionsForLesson(lesson: Lesson): string[] {
  // ... (implementation remains the same)
  const requiredSections: string[] = [];
  lesson.sections.forEach((section) => {
    if (
      [
        "Observation",
        "Testing",
        "Prediction",
        "MultipleChoice",
        "MultipleSelection",
        "Turtle",
        "Reflection",
        "Coverage",
        "PRIMM",
        "Debugger",
      ].includes(section.kind)
    ) {
      requiredSections.push(section.id);
    }
  });
  return requiredSections;
}
