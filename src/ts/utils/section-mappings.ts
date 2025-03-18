/**
 * Mappings between example IDs and sidebar section IDs for each lesson
 */

/**
 * Maps example IDs to their corresponding section IDs in lesson 1
 */
export const LESSON_1_SECTION_MAPPING: { [key: string]: string } = {
  'hello-world': 'print-function',
  'comments': 'comments',
  'math': 'basic-math',
  'exercise1': 'exercises'
};

/**
 * Maps example IDs to their corresponding section IDs in lesson 2
 */
export const LESSON_2_SECTION_MAPPING: { [key: string]: string } = {
  'function-basic': 'functions',
  'function-params': 'functions',
  'temp-conversion': 'temperature',
  'challenge': 'challenge'
};

/**
 * Lesson 3 uses a different approach with a prediction exercise
 * The single section is called 'prediction'
 */
export const LESSON_3_SECTION_MAPPING: { [key: string]: string } = {
  'prediction': 'prediction'
};

/**
 * Lesson 4 mapping is dynamically generated from the JSON data
 * See lesson-loader.ts and lesson_4.ts for implementation
 */
export const LESSON_4_SECTION_MAPPING: { [key: string]: string } = {};

/**
 * Gets the section ID from an example ID using the lesson's mapping
 * @param exampleId - The ID of the example or challenge
 * @param lessonMapping - The mapping object for the current lesson
 * @returns The corresponding section ID or the example ID if not found
 */
export function getSectionIdFromExampleId(
  exampleId: string, 
  lessonMapping: { [key: string]: string }
): string {
  return lessonMapping[exampleId] || exampleId;
}