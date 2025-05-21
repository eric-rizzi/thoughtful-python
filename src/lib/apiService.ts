// src/lib/apiService.ts

// --- Type Definitions (mirroring components.schemas from your Swagger) ---
export interface SectionCompletionInput {
  lessonId: string;
  sectionId: string;
}

export interface UserProgressData {
  userId: string; // Server will derive this from the token and include it in response
  completion: {
    [lessonId: string]: string[]; // e.g., "00_intro/lesson_1": ["section_a", "section_b"]
  };
  penaltyEndTime: number | null;
  lastModifiedServerTimestamp?: string; // ReadOnly, set by server
}

export interface BatchCompletionsInput {
  completions: SectionCompletionInput[];
}

export interface ErrorResponse {
  message: string;
  errorCode?: string;
  details?: any;
}

// --- Mock Configuration ---
export const USE_MOCKED_API = true; // Set to false when your backend is ready
const MOCKED_USER_ID = "109086647533336088230"; // Example user ID

// Simulate network delay for mocked calls
const mockApiDelay = (duration: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, duration));

// --- API Functions ---

/**
 * Fetches the authenticated user's complete learning progress from the server.
 *
 * MOCK IMPLEMENTATION:
 * Returns progress indicating Lesson 5 of the "Introduction to Python" unit is fully complete.
 * Other lessons/sections will be shown as incomplete or not started.
 * (Based on src/assets/data/00_intro/lesson_5.ts and getRequiredSectionsForLesson logic)
 */
export async function getUserProgress(
  idToken: string,
  apiGatewayUrl: string
): Promise<UserProgressData> {
  console.log("hi eric");
  if (!idToken && !USE_MOCKED_API) {
    // Allow empty token for mock if not strictly needed by mock
    return Promise.reject(
      new Error("Authentication token is required for real API calls.")
    );
  }
  console.log("hi eric and penis");
  if (!apiGatewayUrl && !USE_MOCKED_API) {
    return Promise.reject(
      new Error("API Gateway URL is required for real API calls.")
    );
  }

  console.log("hi eric and other penis");
  if (USE_MOCKED_API) {
    console.log(
      `MOCKED API [getUserProgress]: Called. Token: ${
        idToken ? idToken.substring(0, 15) : "N/A"
      }..., URL: ${apiGatewayUrl}`
    );
    await mockApiDelay();

    // Sections for "00_intro/lesson_5" considered for completion (excluding "Information" types)
    // From src/assets/data/00_intro/lesson_5.ts:
    // "question-1", "question-2", "question-3", "question-4", "question-5", "question-6"
    const completedLesson5Sections = [
      "question-1",
      "question-2",
      "question-3",
      "question-4",
      "question-5",
      "question-6",
    ];

    const mockedProgress: UserProgressData = {
      userId: MOCKED_USER_ID,
      completion: {
        "00_intro/lesson_5": [...completedLesson5Sections],
        // Example of other lessons being incomplete or not started
        "00_intro/lesson_1": ["python-history"], // Partially complete example
        "00_intro/lesson_2": [], // Started but no required sections complete
        "01_strings/lesson_1": [],
        // Any lessonId not present is considered not started
      },
      penaltyEndTime: null,
      lastModifiedServerTimestamp: new Date().toISOString(),
    };
    console.log(
      "MOCKED API [getUserProgress]: Returning ->",
      JSON.stringify(mockedProgress, null, 2)
    );
    return Promise.resolve(mockedProgress);
  }

  // --- Real API Call (Placeholder - to be implemented when backend is ready) ---
  console.log(`REAL API [getUserProgress]: Calling ${apiGatewayUrl}/progress`);
  const response = await fetch(`${apiGatewayUrl}/progress`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      message: response.statusText,
      errorCode: `HTTP_${response.status}`,
    }));
    console.error(
      `REAL API [getUserProgress]: Error ${response.status}`,
      errorData
    );
    throw new Error(
      errorData.message || `Failed to fetch progress: ${response.status}`
    );
  }
  const data = await response.json();
  console.log("REAL API [getUserProgress]: Received ->", data);
  return data as UserProgressData;
}

/**
 * Records one or more section completions for the authenticated user.
 * Corresponds to PUT /progress in the Swagger schema.
 *
 * MOCK IMPLEMENTATION:
 * Logs the input and attempts a simplistic merge with the static "lesson 5 complete" state.
 * Returns this potentially modified state.
 */
export async function updateUserProgress(
  idToken: string,
  apiGatewayUrl: string,
  batchInput: BatchCompletionsInput
): Promise<UserProgressData> {
  if (!idToken && !USE_MOCKED_API) {
    return Promise.reject(
      new Error("Authentication token is required for real API calls.")
    );
  }
  if (!apiGatewayUrl && !USE_MOCKED_API) {
    return Promise.reject(
      new Error("API Gateway URL is required for real API calls.")
    );
  }
  if (
    !batchInput ||
    !batchInput.completions ||
    batchInput.completions.length === 0
  ) {
    return Promise.reject(new Error("No completions provided in the batch."));
  }

  if (USE_MOCKED_API) {
    console.log(
      `MOCKED API [updateUserProgress]: Called with ${batchInput.completions.length} completion(s). URL: ${apiGatewayUrl}`
    );
    console.log(
      "MOCKED API [updateUserProgress]: Batch input ->",
      JSON.stringify(batchInput.completions, null, 2)
    );
    await mockApiDelay(300);

    // Start with the base mocked progress (lesson 5 complete)
    const baseProgress: UserProgressData = {
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
        "00_intro/lesson_2": [],
        "01_strings/lesson_1": [],
      },
      penaltyEndTime: null,
      lastModifiedServerTimestamp: new Date().toISOString(), // Update timestamp
    };

    // Simulate server-side merge/union for the mock
    batchInput.completions.forEach((completion) => {
      if (!baseProgress.completion[completion.lessonId]) {
        baseProgress.completion[completion.lessonId] = [];
      }
      if (
        !baseProgress.completion[completion.lessonId].includes(
          completion.sectionId
        )
      ) {
        baseProgress.completion[completion.lessonId].push(completion.sectionId);
        console.log(
          `MOCKED API [updateUserProgress]: Merged ${completion.lessonId}/${completion.sectionId}`
        );
      }
    });
    baseProgress.lastModifiedServerTimestamp = new Date().toISOString();

    console.log(
      "MOCKED API [updateUserProgress]: Returning updated progress ->",
      JSON.stringify(baseProgress, null, 2)
    );
    return Promise.resolve(baseProgress);
  }

  // --- Real API Call (Placeholder - to be implemented when backend is ready) ---
  console.log(
    `REAL API [updateUserProgress]: Calling PUT ${apiGatewayUrl}/progress`
  );
  const response = await fetch(`${apiGatewayUrl}/progress`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batchInput),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      message: response.statusText,
      errorCode: `HTTP_${response.status}`,
    }));
    console.error(
      `REAL API [updateUserProgress]: Error ${response.status}`,
      errorData
    );
    throw new Error(
      errorData.message || `Failed to update progress: ${response.status}`
    );
  }
  const data = await response.json();
  console.log("REAL API [updateUserProgress]: Received ->", data);
  return data as UserProgressData;
}
