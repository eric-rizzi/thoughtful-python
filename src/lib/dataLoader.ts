import type {
  Unit,
  Lesson,
  LessonId,
  UnitId,
  LessonReference,
  AnyLessonSectionData,
  SectionId,
  LessonPath,
} from "../types/data";
// Remove BASE_PATH if unitsData is imported directly, or ensure it's used correctly if units.ts is in public
// import { BASE_PATH } from '../config';

// Assuming units.ts is in src/assets/data/ and has a default export
import unitsDataFromTsModule from "../assets/data/units"; // Import directly

// This glob pattern finds all .ts files under src/assets/data/ that could be lessons.
// Vite will handle the actual dynamic importing.
// Apply a type assertion to import.meta.glob to match the expected type.
const lessonFileModules = import.meta.glob("../assets/data/**/*.ts") as Record<
  string,
  () => Promise<{ default: Lesson }>
>;

// Caches to store loaded data and prevent redundant fetching
let allUnitsCache: Unit[] | null = null;
let lessonIdToPathMap: Map<LessonId, LessonPath> | null = null; // Maps LessonUUID to its FilePath
let lessonPathToIdMap: Map<LessonPath, LessonId> | null = null; // Maps LessonUUID to its FilePath
const lessonContentCache: Map<LessonId, Lesson | null> = new Map(); // Maps LessonUUID to loaded Lesson object

// Flag to ensure units data is processed only once
let unitsDataProcessed = false;
// No longer need unitsDataLoadingPromise if unitsData is imported synchronously at module load.
// let unitsDataLoadingPromise: Promise<void> | null = null;

/**
 * Processes imported units data, populating caches and performing validation.
 * This function is designed to run only once.
 */
function processUnitsData(): void {
  if (unitsDataProcessed) {
    return;
  }

  try {
    console.log("Processing imported units.ts data...");
    // Define a more specific type for raw unit data for clarity, matching units.ts export
    // This assumes unitsDataFromTsModule is an array of RawUnit-like objects
    type RawLessonIdentifier = { guid: LessonId; path: LessonPath };
    type RawUnit = {
      id: UnitId;
      title: string;
      description: string;
      image?: string;
      lessons: RawLessonIdentifier[];
    };
    const rawUnits = unitsDataFromTsModule as RawUnit[]; // Cast the imported data

    const tempUnits: Unit[] = [];
    const tempIdToPathMap = new Map<LessonId, LessonPath>();
    const tempPathToIdMap = new Map<LessonPath, LessonId>();
    let hasDataIntegrityErrors = false;

    for (const rawUnit of rawUnits) {
      const lessonReferences: LessonReference[] = [];
      for (const lessonInfo of rawUnit.lessons || []) {
        const lessonUUID = lessonInfo.guid;
        const lessonPath = lessonInfo.path;

        // 1. Check for duplicate LessonId GUIDs
        if (tempIdToPathMap.has(lessonUUID)) {
          console.error(
            `Data Integrity Error: Duplicate LessonId (GUID) found: '${lessonUUID}'. ` +
              `It's referenced for path '${lessonPath}' in unit '${rawUnit.id}', but was already seen. ` +
              `Each lesson GUID must be globally unique.`
          );
          hasDataIntegrityErrors = true;
        } else {
          tempIdToPathMap.set(lessonUUID, lessonPath);
        }

        if (tempPathToIdMap.has(lessonPath)) {
          console.error(
            `Data Integrity Error: Duplicate LessonPath found: '${lessonPath}'. ` +
              `It's referenced for LessonId (GUID) '${lessonUUID}' in unit '${rawUnit.id}', but this path was already mapped. ` +
              `Each lesson path must be unique in units.json/ts.`
          );
          hasDataIntegrityErrors = true;
        } else {
          tempPathToIdMap.set(lessonPath, lessonUUID);
        }

        lessonReferences.push({ guid: lessonUUID, path: lessonPath });
      }

      tempUnits.push({
        id: rawUnit.id as UnitId, // Cast to branded type
        title: rawUnit.title,
        description: rawUnit.description,
        image: rawUnit.image,
        lessons: lessonReferences,
      });
    }

    allUnitsCache = tempUnits;
    lessonIdToPathMap = tempIdToPathMap;
    lessonPathToIdMap = tempPathToIdMap;

    unitsDataProcessed = true; // Mark as processed
    console.log(
      "units.ts data processed. Lesson ID (GUID) to Path map created."
    );

    if (hasDataIntegrityErrors) {
      console.warn(
        "Data integrity issues found in units.ts data. " +
          "Application may behave unexpectedly. Please check console for details."
      );
      // Optional: throw new Error("Critical data integrity issues found in units data.");
    }
  } catch (error) {
    console.error("Failed to process imported units.ts data:", error);
    unitsDataProcessed = false;
    allUnitsCache = [];
    lessonIdToPathMap = new Map();
    // If this processing happens at module load, throwing here might break app load.
    // Consider how to handle critical data errors. For now, it logs and sets empty caches.
  }
}

// Ensure units data is processed when the module is first loaded.
processUnitsData();

// Exported functions now rely on the processed data.
export async function fetchUnitsData(): Promise<{ units: Unit[] }> {
  if (!unitsDataProcessed) {
    // This case should ideally not be hit if processUnitsData is called at module load.
    // Could be a fallback if initial processing failed or was deferred.
    console.warn(
      "fetchUnitsData called before units data was processed. Attempting to process now."
    );
    processUnitsData(); // Attempt to process if not done
    if (!unitsDataProcessed)
      throw new Error("Unit data could not be processed.");
  }
  return { units: allUnitsCache || [] };
}

export async function fetchUnitById(unitId: UnitId): Promise<Unit | null> {
  if (!unitsDataProcessed) await fetchUnitsData(); // Ensure data is processed
  return allUnitsCache?.find((unit) => unit.id === unitId) || null;
}

export async function getLessonGuidByPath(
  lessonPath: LessonPath
): Promise<LessonId | null> {
  if (!unitsDataProcessed) await fetchUnitsData(); // Ensure maps are populated
  return lessonPathToIdMap?.get(lessonPath) || null;
}

export async function fetchLessonData(
  lessonFilePath: LessonPath
): Promise<Lesson | null> {
  if (!unitsDataProcessed) await fetchUnitsData(); // Ensure map is populated

  const lessonId = lessonPathToIdMap?.get(lessonFilePath);
  if (!lessonId) {
    console.error(
      `No LessonId found for path (UUID): '${lessonFilePath}'. Check units.ts mapping.`
    );
    return null;
  }

  if (lessonContentCache.has(lessonId)) {
    const cachedLesson = lessonContentCache.get(lessonId);
    return cachedLesson === undefined ? null : cachedLesson;
  }

  const moduleKey = `../assets/data/${lessonFilePath}.ts`;
  if (lessonFileModules[moduleKey]) {
    try {
      const moduleLoader = lessonFileModules[moduleKey];
      const module = await moduleLoader();
      const lessonData = module.default as Lesson;

      if (lessonData.guid !== lessonId) {
        console.error(
          `Lesson ID Mismatch Error: Requested LessonId (UUID) was '${lessonId}', ` +
            `but the loaded file ('${lessonFilePath}.ts') contains internal LessonId (UUID) '${lessonData.guid}'. ` +
            `Please ensure units.ts and the lesson's .ts file have consistent GUIDs.`
        );
        lessonContentCache.set(lessonId, null);
        return null;
      }

      lessonContentCache.set(lessonId, lessonData);
      return lessonData;
    } catch (error) {
      console.error(
        `Error dynamically loading lesson module for key '${moduleKey}' (LessonId: ${lessonId}, Path: ${lessonFilePath}):`,
        error
      );
      lessonContentCache.set(lessonId, null);
      return null;
    }
  } else {
    console.error(
      `Lesson module importer not found for key: '${moduleKey}' (LessonId: ${lessonId}, Path: ${lessonFilePath}). Check import.meta.glob pattern and file existence/naming.`
    );
    lessonContentCache.set(lessonId, null);
    return null;
  }
}

export function getRequiredSectionsForLesson(lesson: Lesson): SectionId[] {
  if (!lesson || !lesson.sections) {
    return [];
  }
  const requiredKinds: Array<AnyLessonSectionData["kind"]> = [
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
  ];

  return lesson.sections
    .filter((section) => requiredKinds.includes(section.kind))
    .map((section) => section.id);
}

export async function getLessonPath(
  lessonId: LessonId
): Promise<string | null> {
  if (!unitsDataProcessed) await fetchUnitsData(); // Ensure map is populated
  return lessonIdToPathMap?.get(lessonId) || null;
}
