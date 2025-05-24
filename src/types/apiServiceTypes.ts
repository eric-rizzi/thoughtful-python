import {
  AssessmentLevel,
  ReflectionResponse,
  ReflectionSubmission,
} from "./data";

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

export interface LearningEntrySubmissionData {
  // This is what client sends for POST /learning-entries
  lessonId: string;
  sectionId: string;
  sectionTitle: string;
  submission: ReflectionSubmission;
  assessmentResponse: ReflectionResponse;
}

export interface LearningEntryResponseItem {
  // This is what client receives in the array for GET /learning-entries
  id: string;
  userId?: string;
  lessonId: string;
  sectionId: string;
  sectionTitle: string;
  submittedTimestamp: number;
  topic: string;
  code: string;
  explanation: string;
  aiFeedback: string;
  aiAssessment: AssessmentLevel;
  aiFeedbackTimestamp: number;
  createdAt?: string;
  updatedAt?: string;
}
