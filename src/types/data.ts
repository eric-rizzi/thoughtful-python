// src/types/data.ts

import { UserPoolIdentityProviderSamlMetadata } from "aws-cdk-lib/aws-cognito";

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
  functionToTest?: string;
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

export interface PredictionTableRow {
  inputs: any[]; // Use 'any[]' for flexibility or define specific input types if consistent
  expected: number | string | boolean; // Allow different expected types
  description: string;
}

export type SectionKind =
  | "Information"
  | "Observation" // Uses examples
  | "Testing" // Uses examples with testCases
  | "Prediction"
  | "MultipleChoice"
  | "MultipleSelection"
  | "Turtle"
  | "Reflection"
  | "Coverage"
  | "PRIMM";

export interface PredictionSection extends LessonSection {
  kind: "Prediction";
  functionDisplay: {
    title: string;
    code: string;
  };
  predictionTable: {
    columns: string[];
    rows: PredictionTableRow[];
  };
  completionMessage?: string;
}

export interface MultipleChoiceSection extends LessonSection {
  kind: "MultipleChoice";
  options: string[];
  correctAnswer: number;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface MultipleSelectionSection extends LessonSection {
  kind: "MultipleSelection";
  options: string[];
  correctAnswers: number[];
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface TurtlePathSegment {
  type: "segment" | "move"; // 'segment' = line drawn, 'move' = penup move
  start: { x: number; y: number };
  end: { x: number; y: number };
  // Add color, pensize if needed later
}

export interface TurtleSection extends LessonSection {
  kind: "Turtle";
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
  kind: "Reflection";
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

// You might add specific interfaces for ObservationSection, TestingSection etc.
// if they have unique properties beyond the base LessonSection and examples.
// For now, they can just use LessonSection directly.

export interface ReflectionSubmission {
  topic: string; // Value from the select dropdown
  code: string; // User's code example
  explanation: string; // User's explanation
  timestamp: number; // When the submission was created/sent
  submitted: boolean; // Was this submitted to the 'journal'?
}

export type AssessmentLevel = "developing" | "meets" | "exceeds";

export interface ReflectionResponse {
  feedback: string; // Text feedback (simulated AI)
  assessment: AssessmentLevel; // Assessment level based on rubric
  timestamp: number; // When feedback was generated
}

// Update ReflectionSection interface slightly
export interface ReflectionSection extends LessonSection {
  kind: "Reflection";
  prompts: {
    topic: string; // Label for topic dropdown
    code: string; // Label for code input
    explanation: string; // Label for explanation input
  };
  // Rubric is optional, used by simulated feedback
  rubric?: {
    developing: string; // Description for 'developing'
    meets: string; // Description for 'meets'
    exceeds: string; // Description for 'exceeds'
  };
  // apiEndpoint?: string; // Optional: If using a real backend later
}

// Type for the history entry combining submission and optional response
export interface ReflectionHistoryEntry {
  submission: ReflectionSubmission;
  response?: ReflectionResponse;
}

// Type for the state saved in localStorage
export interface SavedReflectionState {
  history: ReflectionHistoryEntry[];
  // Optionally save draft state too
  // draftTopic?: string;
  // draftCode?: string;
  // draftExplanation?: string;
}

export interface CoverageChallenge {
  id: string; // Unique ID for the challenge row
  expectedOutput: string; // The exact stdout expected
  hint?: string; // Optional hint for the user
}

export interface InputParam {
  name: string; // Name of the variable used in the Python code
  type: "text" | "number" | "boolean"; // Input type hint
  placeholder: string; // Placeholder text for the input field
}

export interface CoverageSection extends LessonSection {
  kind: "Coverage";
  code: string; // The Python code snippet to analyze
  inputParams: InputParam[]; // Definitions of the inputs needed
  coverageChallenges: CoverageChallenge[]; // The list of challenges
}

// Type for the state of a single challenge row
export interface ChallengeState {
  inputs: { [paramName: string]: string }; // Store all inputs as strings initially
  actualOutput: string | null;
  isCorrect: boolean | null;
  isRunning: boolean;
}

// Type for the overall state saved in localStorage
export interface SavedCoverageState {
  challengeStates: { [challengeId: string]: Omit<ChallengeState, "isRunning"> }; // Don't save runtime state
}

export interface SavedCodeState {
  [exampleId: string]: string; // Map example ID to its code string
}

export interface PRIMMCodeExample {
  id: string; // Unique ID for this PRIMM block within the section
  code: string; // The code to be displayed and run
  predictPrompt: string; // Question asking the user to predict something (e.g., "What will be the value of x?")
  expectedPrediction: string; // The correct answer for the prediction (string-based for simplicity)
  // Optional: Specific lines to focus on for prediction, or variables
  predictionTargetDescription?: string; // e.g., "the final output", "the value of variable 'y' at the end"
  explanationPrompt: string; // Prompt for the explanation if prediction is wrong
  minExplanationLength: number; // Minimum characters for the explanation
}

export interface PRIMMSection extends LessonSection {
  kind: "PRIMM";
  introduction: string; // General introduction to this PRIMM activity
  examples: PRIMMCodeExample[]; // Array of PRIMM blocks for this section
  // Potentially add Modify or Make prompts later
  conclusion?: string; // Text to show after all examples are completed
}

export interface PRIMMExampleState {
  userPrediction: string; // User's input
  explanationText: string; // User's explanation (if needed)
  hasMetExplanationRequirement: boolean; // Tracks if explanation is sufficient OR prediction was correct
  output: string | null; // Actual output from running the code
  runError: string | null; // Any error message from the Python execution
  runAttempted: boolean; // Has the user clicked Run for this block?
  // No predictionSubmitted or isPredictionCorrect needed here anymore
  // isComplete is now the primary flag for completion of this block
  isComplete: boolean; // Has this specific PRIMM block met its completion criteria?
}

// REVISED Saved state for the whole section
export interface SavedPRIMMSectionState {
  // Keyed by PRIMMCodeExample.id
  exampleStates: {
    // Still store the full state per example, excluding maybe transient error states if desired
    // But storing runError and output is useful for displaying state across sessions
    [exampleId: string]: PRIMMExampleState;
  };
}
