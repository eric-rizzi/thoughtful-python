// src/lib/apiService.ts
import type {
  UserProgressData,
  BatchCompletionsInput,
  ErrorResponse,
  LearningEntrySubmissionData,
  LearningEntryResponseItem,
} from "../types/apiServiceTypes";
import {
  AssessmentLevel,
  ReflectionResponse,
  ReflectionSubmission,
} from "../types/data";

export const USE_MOCKED_API = false;
const MOCKED_USER_ID = "mocked-google-user-id-12345";

const mockApiDelay = (duration: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, duration));

/**
 * Fetches the authenticated user's complete learning progress from the server.
 */
export async function getUserProgress(
  idToken: string,
  apiGatewayUrl: string
): Promise<UserProgressData> {
  if (USE_MOCKED_API) {
    console.log(`MOCKED API [getUserProgress]: Called. URL: ${apiGatewayUrl}`);
    await mockApiDelay();
    const mockedProgress: UserProgressData = {
      userId: MOCKED_USER_ID,
      completion: {
        "00_intro/lesson_5": [
          "question-1",
          "question-2",
          "question-3",
          "question-4",
          "question-5",
          "question-6",
        ],
        "00_intro/lesson_1": ["python-history"],
      },
      penaltyEndTime: null,
      lastModifiedServerTimestamp: new Date().toISOString(),
    };
    return Promise.resolve(mockedProgress);
  }

  // --- Real API Call ---
  if (!idToken)
    return Promise.reject(new Error("Authentication token is required."));
  if (!apiGatewayUrl)
    return Promise.reject(new Error("API Gateway URL is required."));

  console.log(
    `LIVE API [getUserProgress]: Calling GET ${apiGatewayUrl}/progress`
  );
  const response = await fetch(`${apiGatewayUrl}/progress`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorData: ErrorResponse = {
      message: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore if response body is not JSON
    }
    console.error(
      `LIVE API [getUserProgress]: Error ${response.status}`,
      errorData
    );
    throw new Error(
      errorData.message || `Failed to fetch progress: ${response.status}`
    );
  }
  const data = await response.json();
  console.log("LIVE API [getUserProgress]: Received ->", data);
  return data as UserProgressData;
}

/**
 * Records one or more section completions for the authenticated user.
 * Corresponds to PUT /progress in the Swagger schema.
 */
export async function updateUserProgress(
  idToken: string,
  apiGatewayUrl: string,
  batchInput: BatchCompletionsInput
): Promise<UserProgressData> {
  if (USE_MOCKED_API) {
    console.log(
      `MOCKED API [updateUserProgress]: Called with ${batchInput.completions.length} completion(s). URL: ${apiGatewayUrl}`
    );
    await mockApiDelay(300);
    const baseProgress: UserProgressData = {
      /* ... same mock as before ... */ userId: MOCKED_USER_ID,
      completion: {
        "00_intro/lesson_5": [
          "question-1",
          "question-2",
          "question-3",
          "question-4",
          "question-5",
          "question-6",
        ],
        "00_intro/lesson_1": ["python-history"],
      },
      penaltyEndTime: null,
      lastModifiedServerTimestamp: new Date().toISOString(),
    };
    batchInput.completions.forEach((comp) => {
      if (!baseProgress.completion[comp.lessonId])
        baseProgress.completion[comp.lessonId] = [];
      if (!baseProgress.completion[comp.lessonId].includes(comp.sectionId)) {
        baseProgress.completion[comp.lessonId].push(comp.sectionId);
      }
    });
    baseProgress.lastModifiedServerTimestamp = new Date().toISOString();
    return Promise.resolve(baseProgress);
  }

  // --- Real API Call ---
  if (!idToken)
    return Promise.reject(new Error("Authentication token is required."));
  if (!apiGatewayUrl)
    return Promise.reject(new Error("API Gateway URL is required."));
  if (!batchInput || !batchInput.completions) {
    // Ensure completions array exists
    return Promise.reject(new Error("Completions data is required."));
  }

  console.log(
    `LIVE API [updateUserProgress]: Calling PUT ${apiGatewayUrl}/progress`
  );
  const response = await fetch(`${apiGatewayUrl}/progress`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batchInput), // Send the batchInput directly
  });

  if (!response.ok) {
    let errorData: ErrorResponse = {
      message: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore
    }
    console.error(
      `LIVE API [updateUserProgress]: Error ${response.status}`,
      errorData
    );
    throw new Error(
      errorData.message || `Failed to update progress: ${response.status}`
    );
  }
  const data = await response.json();
  console.log("LIVE API [updateUserProgress]: Received ->", data);
  return data as UserProgressData;
}

// --- Other API Functions (Learning Entries, Reflection Feedback) ---
// Keep these mocked for now, or implement them when their respective backend Lambdas are ready.

// Example: submitLearningEntry (still mocked or placeholder for real implementation)
export async function submitLearningEntry(
  idToken: string,
  apiGatewayUrl: string,
  entryData: LearningEntrySubmissionData
): Promise<{ success: boolean; entryId?: string }> {
  if (USE_MOCKED_API) {
    // Or a specific flag for this service
    console.log(
      `MOCKED API [submitLearningEntry]: Called for lesson "${entryData.lessonId}"`
    );
    await mockApiDelay(500);
    return Promise.resolve({
      success: true,
      entryId: `mock-entry-${Date.now()}`,
    });
  }
  console.log(
    `LIVE API [submitLearningEntry]: Calling POST ${apiGatewayUrl}/learning-entries`
  );
  // Real implementation for submitLearningEntry...
  throw new Error("Real submitLearningEntry not implemented yet.");
}

// Example: fetchLearningEntries (still mocked or placeholder)
export async function fetchLearningEntries(
  idToken: string,
  apiGatewayUrl: string
): Promise<LearningEntryResponseItem[]> {
  // Ensure LearningEntryResponseItem is defined or imported
  if (USE_MOCKED_API) {
    // Or a specific flag for this service
    console.log("MOCKED API [fetchLearningEntries]: Called.");
    await mockApiDelay();
    return Promise.resolve([
      /* ... mocked learning entries ... */
    ]);
  }
  console.log(
    `LIVE API [fetchLearningEntries]: Calling GET ${apiGatewayUrl}/learning-entries`
  );
  // Real implementation for fetchLearningEntries...
  throw new Error("Real fetchLearningEntries not implemented yet.");
}

// Example: getReflectionFeedback (still mocked or placeholder)
export async function getReflectionFeedback(
  idToken: string,
  apiGatewayUrl: string,
  submission: ReflectionSubmission // Ensure this type is defined or imported
): Promise<ReflectionResponse> {
  // Ensure this type is defined or imported
  if (USE_MOCKED_API) {
    // Or a specific flag for this service
    console.log(
      `MOCKED API [getReflectionFeedback]: Called for topic "${submission.topic}"`
    );
    await mockApiDelay(1000);
    return Promise.resolve({
      feedback:
        "This is thoughtful mocked feedback for the live integration phase.",
      assessment: (Math.random() > 0.5
        ? "mostly"
        : "achieves") as AssessmentLevel, // Ensure AssessmentLevel is defined
      timestamp: Date.now(),
    });
  }
  console.log(
    `LIVE API [getReflectionFeedback]: Calling POST ${apiGatewayUrl}/reflection/assess`
  );
  // Real implementation for getReflectionFeedback...
  throw new Error("Real getReflectionFeedback not implemented yet.");
}
