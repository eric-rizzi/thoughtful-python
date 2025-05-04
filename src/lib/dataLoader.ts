// src/lib/dataLoader.ts
import type { UnitsData, Unit, Lesson } from '../types/data';
// Import BASE_PATH from your config file
// Make sure config.ts defines and exports BASE_PATH correctly
// e.g., export const BASE_PATH = import.meta.env.BASE_URL;
// Ensure vite.config.ts sets the 'base' property appropriately.
import { BASE_PATH } from '../config';

const DATA_FOLDER = 'data'; // Relative path within the deployed assets

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
    // Basic validation
    if (!data || !Array.isArray(data.units)) {
        throw new Error('Invalid units data format');
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch units data:', error);
    throw new Error(`Could not load units data from ${url}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches the data for a specific lesson.
 * @param lessonId - The ID of the lesson (e.g., "lesson_1").
 * @returns Promise resolving to the Lesson object.
 * @throws Error if fetching or parsing fails, or if lessonId format is invalid.
 */
export async function fetchLessonData(lessonId: string): Promise<Lesson> {
  // Basic validation for lessonId format
  if (!/^lesson_\d+$/.test(lessonId)) {
     throw new Error(`Invalid lesson ID format: ${lessonId}. Expected "lesson_N".`);
  }

  const url = `${BASE_PATH}${DATA_FOLDER}/${lessonId}.json`;
  console.log(`Workspaceing lesson from: ${url}`); // Log the URL being fetched

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} loading ${url}`);
    }
    const data: Lesson = await response.json();
     // Basic validation
    if (!data || !data.title || !Array.isArray(data.sections)) {
        throw new Error(`Invalid lesson data format for ${lessonId}`);
    }
    return data;
  } catch (error) {
    console.error(`Failed to fetch lesson data for ${lessonId}:`, error);
    throw new Error(`Could not load lesson data for ${lessonId} from ${url}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to fetch a specific unit by its ID.
 * @param unitId - The ID of the unit to fetch.
 * @returns Promise resolving to the Unit object or null if not found.
 * @throws Error if fetching units data fails.
 */
export async function fetchUnitById(unitId: string): Promise<Unit | null> {
    try {
        const unitsData = await fetchUnitsData();
        const unit = unitsData.units.find(u => u.id === unitId);
        return unit || null;
    } catch (error) {
        console.error(`Failed to fetch unit by ID ${unitId}:`, error);
        throw error; // Re-throw error to be handled by the caller
    }
}

// You can also include the utility functions like getLessonMapping and
// getRequiredSections here if you prefer, adapting them as needed.
// Example:
/**
 * Gets all required section IDs for a lesson to be considered complete
 * @param lesson - The lesson data object
 * @returns Array of section IDs
 */
export function getRequiredSectionsForLesson(lesson: Lesson): string[] {
  const requiredSections: string[] = [];
  lesson.sections.forEach(section => {
    // Add kinds that require active completion
    if (['Observation', 'Testing', 'Prediction', 'MultipleChoice', 'MultiSelection', 'Turtle', 'Reflection', 'Coverage'].includes(section.kind)) {
       requiredSections.push(section.id);
    }
    // You might refine this logic based on exactly which sections count towards completion
  });
  return requiredSections;
}