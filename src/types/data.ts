// src/types/data.ts

// --- Base Structures ---

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
  kind: SectionKind; // Use the SectionKind type
  id: string;
  title: string;
  content: string;
  examples?: LessonExample[]; // Primarily for Observation/Testing
  [key: string]: any; // Allow other properties specific to kinds
}

export interface Lesson {
  title: string;
  description: string;
  sections: LessonSection[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: string[]; // Array of lesson IDs (e.g., "lesson_1")
  image?: string;
}

export interface UnitsData {
  units: Unit[];
}

// --- Specific Section Kind Interfaces (Extending LessonSection) ---

export type SectionKind =
  | 'Information'
  | 'Observation' // Uses examples
  | 'Testing'     // Uses examples with testCases
  | 'Prediction'
  | 'MultipleChoice'
  | 'MultiSelection'
  | 'Turtle'
  | 'Reflection'
  | 'Coverage';

export interface PredictionSection extends LessonSection {
  kind: 'Prediction';
  functionDisplay: {
    title: string;
    code: string;
  };
  predictionTable: {
    columns: string[];
    rows: Array<{
      inputs: number[];
      expected: number;
      description: string;
    }>;
  };
  completionMessage?: string;
}

export interface MultipleChoiceSection extends LessonSection {
  kind: 'MultipleChoice';
  options: string[];
  correctAnswer: number;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface MultiSelectionSection extends LessonSection {
  kind: 'MultiSelection';
  options: string[];
  correctAnswers: number[];
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface TurtleSection extends LessonSection {
  kind: 'Turtle';
  instructions: string;
  initialCode: string;
  validationCriteria: {
    type: string; // e.g., 'shape'
    shape?: string;
    width?: number;
    height?: number;
    sideLength?: number;
    [key: string]: any;
  };
  turtleCommands?: Array<{
    name: string;
    description: string;
  }>;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface ReflectionSection extends LessonSection {
  kind: 'Reflection';
  prompts: {
    topic: string;
    code: string;
    explanation: string;
  };
  rubric?: {
    developing: string;
    meets: string;
    exceeds: string;
  };
  // apiEndpoint?: string; // Consider adding if needed later
}

export interface CoverageSection extends LessonSection {
  kind: 'Coverage';
  code: string; // The code snippet to analyze
  coverageChallenges: Array<{
    id: string;
    expectedOutput: string;
    hint?: string;
  }>;
  inputParams: Array<{
    name: string; // Name of the variable to replace in the code
    type: string; // e.g., 'number', 'text', 'boolean'
    placeholder: string;
  }>;
}

// You might add specific interfaces for ObservationSection, TestingSection etc.
// if they have unique properties beyond the base LessonSection and examples.
// For now, they can just use LessonSection directly.