import type {
  Unit,
  Lesson,
  LessonId,
  UnitId,
  LessonReference,
  AnyLessonSectionData,
  SectionId,
  LessonPath,
  UnitManifest,
} from "../types/data";

// Import unit directories list for ordering
import unitDirectories from "../assets/data/units";

// Use import.meta.glob to discover all unit.ts manifest files
const unitManifestModules = import.meta.glob("../assets/data/*/unit.ts") as Record<
  string,
  () => Promise<{ default: UnitManifest }>
>;

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
let unitsDataLoadingPromise: Promise<void> | null = null;

/**
 * Extracts the unit directory name from a unit manifest path.
 * Example: "../assets/data/00_intro/unit.ts" → "00_intro"
 */
function extractUnitDirectory(manifestPath: string): string | null {
  const match = manifestPath.match(/\.\.\/assets\/data\/([^/]+)\/unit\.ts/);
  return match ? match[1] : null;
}

/**
 * Loads all unit manifests and processes them into Unit objects.
 * This function is designed to run only once.
 */
async function processUnitsData(): Promise<void> {
  if (unitsDataProcessed) {
    return;
  }

  try {
    console.log("Loading unit manifests from unit.ts files...");

    // Build a map of directory → manifest loader
    const manifestLoaderMap = new Map<string, () => Promise<{ default: UnitManifest }>>();
    for (const [manifestPath, loader] of Object.entries(unitManifestModules)) {
      const unitDir = extractUnitDirectory(manifestPath);
      if (unitDir) {
        manifestLoaderMap.set(unitDir, loader);
      } else {
        console.warn(`Could not extract unit directory from path: ${manifestPath}`);
      }
    }

    // Load manifests in the order specified by unitDirectories
    const tempUnits: Unit[] = [];
    const directories = Array.isArray(unitDirectories) ? unitDirectories : [];

    for (const unitDir of directories) {
      const loader = manifestLoaderMap.get(unitDir);
      if (!loader) {
        console.error(
          `Unit directory "${unitDir}" specified in units.ts but no unit.ts manifest found. ` +
          `Please create ${unitDir}/unit.ts`
        );
        continue;
      }

      try {
        const module = await loader();
        const manifest = module.default;

        // Validate manifest
        if (!manifest.id || !manifest.title || !Array.isArray(manifest.lessons)) {
          console.error(
            `Invalid unit manifest in ${unitDir}/unit.ts. ` +
            `Required fields: id, title, lessons (array)`
          );
          continue;
        }

        // Resolve relative paths to absolute paths
        const lessonReferences: LessonReference[] = manifest.lessons.map(
          (relativePath) => ({
            path: `${unitDir}/${relativePath}` as LessonPath,
          })
        );

        const resolvedImagePath = `${unitDir}/${manifest.image}`;

        tempUnits.push({
          id: manifest.id,
          title: manifest.title,
          description: manifest.description,
          image: resolvedImagePath,
          lessons: lessonReferences,
        });

        console.log(`Loaded unit: ${manifest.title} (${unitDir})`);
      } catch (error) {
        console.error(`Error loading unit manifest from ${unitDir}/unit.ts:`, error);
      }
    }

    allUnitsCache = tempUnits;

    // Initialize empty maps (will be populated lazily as lessons are loaded)
    lessonIdToPathMap = new Map();
    lessonPathToIdMap = new Map();

    unitsDataProcessed = true;
    console.log(
      `Loaded ${tempUnits.length} units from manifests. Lesson metadata will be loaded on demand.`
    );
  } catch (error) {
    console.error("Failed to process unit manifests:", error);
    unitsDataProcessed = false;
    allUnitsCache = [];
    lessonIdToPathMap = new Map();
    lessonPathToIdMap = new Map();
  }
}

// Start loading units data when the module is first loaded.
unitsDataLoadingPromise = processUnitsData();

// Exported functions now rely on the processed data.
export async function fetchUnitsData(): Promise<{ units: Unit[] }> {
  if (!unitsDataProcessed) {
    // Wait for initial loading if still in progress
    if (unitsDataLoadingPromise) {
      await unitsDataLoadingPromise;
    } else {
      // Fallback: start loading now
      console.warn(
        "fetchUnitsData called before units data was processed. Attempting to process now."
      );
      await processUnitsData();
    }

    if (!unitsDataProcessed) {
      throw new Error("Unit data could not be processed.");
    }
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
  if (!unitsDataProcessed) await fetchUnitsData();

  // Check if we already have this mapping
  let lessonId = lessonPathToIdMap?.get(lessonPath);

  // If not, load the lesson to build the mapping
  if (!lessonId) {
    const lesson = await fetchLessonData(lessonPath);
    if (lesson) {
      lessonId = lesson.guid;
    }
  }

  return lessonId || null;
}

export async function fetchLessonData(
  lessonFilePath: LessonPath
): Promise<Lesson | null> {
  if (!unitsDataProcessed) await fetchUnitsData();

  // Check if we already loaded this lesson by path
  const cachedLessonId = lessonPathToIdMap?.get(lessonFilePath);
  if (cachedLessonId && lessonContentCache.has(cachedLessonId)) {
    const cachedLesson = lessonContentCache.get(cachedLessonId);
    return cachedLesson === undefined ? null : cachedLesson;
  }

  const moduleKey = `../assets/data/${lessonFilePath}.ts`;
  if (lessonFileModules[moduleKey]) {
    try {
      const moduleLoader = lessonFileModules[moduleKey];
      const module = await moduleLoader();
      const lessonData = module.default as Lesson;
      const lessonId = lessonData.guid;

      // VALIDATE: Check for duplicate GUIDs
      if (lessonIdToPathMap?.has(lessonId)) {
        const existingPath = lessonIdToPathMap.get(lessonId);
        if (existingPath !== lessonFilePath) {
          console.error(
            `Data Integrity Error: Duplicate LessonId (GUID) found: '${lessonId}'. ` +
              `It exists in both '${existingPath}' and '${lessonFilePath}'. ` +
              `Each lesson GUID must be globally unique.`
          );
          lessonContentCache.set(lessonId, null);
          return null;
        }
      }

      // BUILD MAPS: Add this lesson's GUID↔Path mappings
      lessonIdToPathMap?.set(lessonId, lessonFilePath);
      lessonPathToIdMap?.set(lessonFilePath, lessonId);

      // Validate section IDs (existing logic)
      if (lessonData.sections) {
        const seenSectionIds = new Set<SectionId>();
        for (const section of lessonData.sections) {
          if (seenSectionIds.has(section.id)) {
            console.error(
              `Data Integrity Error: Duplicate sectionId '${section.id}' found within lesson file: '${lessonFilePath}.ts'. Section IDs must be unique per lesson.`
            );
          } else {
            seenSectionIds.add(section.id);
          }
        }
      }

      lessonContentCache.set(lessonId, lessonData);
      return lessonData;
    } catch (error) {
      console.error(
        `Error dynamically loading lesson module for key '${moduleKey}' (Path: ${lessonFilePath}):`,
        error
      );
      return null;
    }
  } else {
    console.error(
      `Lesson module importer not found for key: '${moduleKey}' (Path: ${lessonFilePath}). Check import.meta.glob pattern and file existence/naming.`
    );
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

export function hasReviewableAssignments(lesson: Lesson): boolean {
  if (!lesson || !lesson.sections) {
    return false;
  }
  return lesson.sections.some(
    (s) => s.kind === "Reflection" || s.kind === "PRIMM"
  );
}

export function getLessonPathSync(lessonId: LessonId): LessonPath | null {
  if (!lessonIdToPathMap) {
    console.error(
      "dataLoader has not been initialized. Cannot call getLessonPathSync."
    );
    return null;
  }
  return lessonIdToPathMap.get(lessonId) || null;
}
