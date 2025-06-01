import { AssessmentLevel } from "./data";

export interface SectionCompletionInput {
  lessonId: string;
  sectionId: string;
}

export interface UserProgressData {
  userId: string; // Server will derive this from the token and include it in response
  completion: {
    [lessonId: string]: {
      // Key is lessonId
      [sectionId: string]: string; // Key is sectionId, value is timeFirstCompleted (string)
    };
  };
}

export interface BatchCompletionsInput {
  completions: SectionCompletionInput[];
}

export interface ErrorResponse {
  message: string;
  errorCode?: string;
  details?: any;
}

/**
 * Input from the client when interacting with a reflection section.
 * Corresponds to POST /lessons/{lessonId}/sections/{sectionId}/reflections request body.
 * Based on your Swagger: ReflectionInteractionInput
 */
export interface ReflectionInteractionInput {
  userTopic: string;
  userCode: string;
  userExplanation: string; // As per your Swagger's ReflectionInteractionInput
  isFinal?: boolean; // Defaults to false on the server if not provided
  sourceVersionId?: string | null; // Optional from client if isFinal=true; server might look up latest draft
}

/**
 * Represents a single reflection version/item as stored and returned by the API.
 * This is used for individual drafts, items in draft lists, and items in final entry lists.
 * Based on your Swagger: ReflectionVersionItem
 */
export interface ReflectionVersionItem {
  versionId: string; // e.g., "v_1685000000000_abc123" or the composite SK
  userId: string;
  lessonId: string;
  sectionId: string;
  userTopic: string; // Content submitted by the user for this version
  userCode: string; // Content submitted by the user for this version
  userExplanation: string; // Content submitted by the user for this version
  createdAt: string; // ISO 8601 date-time string
  isFinal: boolean; // True if this is a finalized learning entry

  // These are populated for drafts (isFinal: false) after AI feedback.
  // For final entries (isFinal: true), these fields on the final record itself are null,
  // as the qualifying feedback is on the 'sourceVersionId' draft.
  aiFeedback?: string | null;
  aiAssessment?: AssessmentLevel | null;

  // If isFinal is true, this should point to the draft version that
  // contained the AI feedback qualifying this as a final submission.
  // Can also be used if a draft is a copy of another draft.
  sourceVersionId?: string | null;

  // This field is primarily for DynamoDB GSI use and might not always be present
  // in API responses unless specifically projected/needed by the client for that view.
  // Your ReflectionVersionItem in Swagger didn't explicitly list it.
  finalEntryCreatedAt?: string | null;
}

/**
 * Response structure for GET /lessons/{lessonId}/sections/{sectionId}/reflections.
 * Contains a list of draft versions.
 * Based on your Swagger: ListOfReflectionVersionsResponse (when listing drafts)
 */
export interface ListOfReflectionDraftsResponse {
  versions: ReflectionVersionItem[]; // Array of drafts (ReflectionVersionItem where isFinal=false)
  lastEvaluatedKey?: Record<string, any> | null; // For pagination
}

/**
 * Response structure for GET /learning-entries.
 * Contains a list of finalized learning entries.
 * Based on your Swagger: ListOfReflectionVersionsResponse (when listing final entries,
 * where items are ReflectionVersionItem with isFinal=true)
 */
export interface ListOfFinalLearningEntriesResponse {
  entries: ReflectionVersionItem[]; // Array of final entries (ReflectionVersionItem where isFinal=true)
  lastEvaluatedKey?: Record<string, any> | null; // For pagination
}

export interface PrimmEvaluationRequest {
  lessonId: string;
  sectionId: string;
  primmExampleId: string;
  codeSnippet: string;
  userPredictionPromptText: string; // The prompt shown to the user
  userPredictionText: string; // User's English prediction
  userPredictionConfidence: number; // 1-3 for Low/Medium/High
  userExplanationText: string;
  actualOutputSummary?: string | null;
}

export interface PrimmEvaluationResponse {
  aiPredictionAssessment: AssessmentLevel;
  aiExplanationAssessment: AssessmentLevel;
  aiOverallComment: string;
}

export interface InstructorStudentInfo {
  studentId: string;
  studentName?: string | null; // Optional, as it might not be available in POC
  studentEmail?: string | null; // Optional
}

export interface ListOfInstructorStudentsResponse {
  students: InstructorStudentInfo[];
  // lastEvaluatedKey?: Record<string, any> | null; // For future pagination if the list becomes very long
}

export interface StudentLessonProgressItem {
  lessonId: string;
  lessonTitle: string;
  completionPercent: number;
  isCompleted: boolean;
  completedSectionsCount: number;
  totalRequiredSectionsInLesson: number;
}

export interface StudentUnitProgressResponse {
  studentId: string;
  studentName?: string | null;
  unitId: string;
  unitTitle: string;
  lessonsProgress: StudentLessonProgressItem[];
  overallUnitCompletionPercent: number;
}

// For the "At-a-Glance" summary (if fetched from a dedicated endpoint later)
export interface ClassLessonSummaryItem {
  lessonId: string;
  lessonTitle: string;
  averageCompletionPercent: number;
  studentsAttemptedCount: number;
  studentsCompletedCount: number;
}

export interface ClassUnitSummaryResponse {
  unitId: string;
  unitTitle: string;
  totalStudentsInView: number;
  lessonSummaries: ClassLessonSummaryItem[];
}

// You would also keep your existing types like:
// ErrorResponse, UserProgress, BatchCompletionsInput, SectionCompletionInput
// For example:
export interface ErrorResponse {
  message: string;
  errorCode?: string;
  details?: any;
}
