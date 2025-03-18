/**
 * Utility for loading lesson data from JSON
 */

export interface LessonExample {
  id: string;
  title: string;
  description: string;
  code: string;
}

export interface LessonSection {
  id: string;
  title: string;
  content: string;
  examples: LessonExample[];
}

export interface Lesson {
  title: string;
  description: string;
  sections: LessonSection[];
}

/**
 * Loads a lesson from a JSON file
 * @param lessonId - The lesson identifier (e.g., "lesson_4")
 * @returns Promise resolving to the lesson data
 */
export async function loadLesson(lessonId: string): Promise<Lesson> {
  try {
    // Fetch the lesson JSON file
    const response = await fetch(`/data/${lessonId}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to load lesson data: ${response.status} ${response.statusText}`);
    }
    
    const lessonData: Lesson = await response.json();
    return lessonData;
  } catch (error) {
    console.error(`Error loading lesson ${lessonId}:`, error);
    throw error;
  }
}

/**
 * Gets a mapping of example IDs to section IDs for a lesson
 * @param lesson - The lesson data
 * @returns Object mapping example IDs to their section IDs
 */
export function getLessonMapping(lesson: Lesson): { [key: string]: string } {
  const mapping: { [key: string]: string } = {};
  
  lesson.sections.forEach(section => {
    section.examples.forEach(example => {
      mapping[example.id] = section.id;
    });
  });
  
  return mapping;
}

/**
 * Gets all required section IDs for a lesson to be considered complete
 * @param lesson - The lesson data
 * @returns Array of section IDs
 */
export function getRequiredSections(lesson: Lesson): string[] {
  return lesson.sections.map(section => section.id);
}