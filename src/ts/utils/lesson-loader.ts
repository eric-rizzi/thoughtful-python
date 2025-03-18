/**
 * Utility for loading lesson data from JSON
 */

export interface LessonExample {
  id: string;
  title: string;
  description: string;
  code: string;
  testCases?: Array<{
    input: any;
    expected: any;
    description: string;
  }>;
}

export interface LessonSection {
  kind: 'Information' | 'Observation' | 'Testing' | 'Prediction' | 'MultipleChoice' | 'MultiSelection' | 'Turtle';
  id: string;
  title: string;
  content: string;
  examples?: LessonExample[];
  // Additional properties for different kinds of sections
  functionDisplay?: {
    title: string;
    code: string;
  };
  predictionTable?: {
    columns: string[];
    rows: Array<{
      inputs: number[];
      expected: number;
      description: string;
    }>;
  };
  // Properties for multiple choice questions
  options?: string[];
  correctAnswer?: number;
  // Properties for multi-selection questions
  correctAnswers?: number[];
  // Properties for turtle challenges
  instructions?: string;
  initialCode?: string;
  turtleCommands?: Array<{
    name: string;
    description: string;
  }>;
  validationCriteria?: {
    type: string;
    shape?: string;
    width?: number;
    height?: number;
    sideLength?: number;
    [key: string]: any;
  };
  // Feedback for quiz and turtle sections
  feedback?: {
    correct: string;
    incorrect: string;
  };
  completionMessage?: string;
  [key: string]: any;
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
    // Check if the section has examples
    if (section.examples && section.examples.length > 0) {
      section.examples.forEach(example => {
        mapping[example.id] = section.id;
      });
    } else {
      // For lessons without examples (or for Prediction sections)
      // map the section ID to itself
      mapping[section.id] = section.id;
    }
  });
  
  return mapping;
}

/**
 * Gets all required section IDs for a lesson to be considered complete
 * @param lesson - The lesson data
 * @returns Array of section IDs
 */
export function getRequiredSections(lesson: Lesson): string[] {
  // For certain kinds of sections, we might have different completion requirements
  const requiredSections: string[] = [];
  
  lesson.sections.forEach(section => {
    switch(section.kind) {
      case 'Testing':
      case 'Prediction':
      case 'Observation':
      case 'MultipleChoice':
      case 'MultiSelection':
      case 'Turtle':
        // These kinds of sections require interaction to complete
        requiredSections.push(section.id);
        break;
      case 'Information':
        // Information sections are optional for completion
        // They can be marked as completed by viewing them, but aren't required
        break;
      default:
        // For any other kind, include it by default
        requiredSections.push(section.id);
    }
  });
  
  return requiredSections;
}