// src/lib/apiService.ts
import type {
  UserProgressData,
  BatchCompletionsInput,
  ErrorResponse,
  ReflectionInteractionInput,
  ReflectionFeedbackAndDraftResponse,
  ReflectionVersionItem,
  ListOfReflectionDraftsResponse,
  ListOfFinalLearningEntriesResponse,
} from "../types/apiServiceTypes";

export const USE_MOCKED_API = false; // Keep for other mocks if needed, or phase out for these new fns
const MOCKED_USER_ID = "mocked-google-user-id-12345";

const mockApiDelay = (duration: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, duration));

// --- Existing Progress API Functions (keep as is) ---
export async function getUserProgress(
  idToken: string,
  apiGatewayUrl: string
): Promise<UserProgressData> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    // Example check for mock
    console.log(`MOCKED API [getUserProgress]: Called. URL: ${apiGatewayUrl}`);
    await mockApiDelay();
    const mockedProgress: UserProgressData = {
      userId: MOCKED_USER_ID,
      completion: {
        "00_intro/lesson_5": {
          "question-1": new Date().toISOString(),
          "question-2": new Date().toISOString(),
        },
      },
    };
    return Promise.resolve(mockedProgress);
  }

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
      /* ignore */
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

export async function updateUserProgress(
  idToken: string,
  apiGatewayUrl: string,
  batchInput: BatchCompletionsInput
): Promise<UserProgressData> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    console.log(
      `MOCKED API [updateUserProgress]: Called with ${batchInput.completions.length} items.`
    );
    await mockApiDelay();
    // Basic mock: return an empty progress for simplicity or enhance as needed
    return Promise.resolve({ userId: MOCKED_USER_ID, completion: {} });
  }

  if (!idToken)
    return Promise.reject(new Error("Authentication token is required."));
  if (!apiGatewayUrl)
    return Promise.reject(new Error("API Gateway URL is required."));
  if (!batchInput || !batchInput.completions)
    return Promise.reject(new Error("Completions data is required."));

  console.log(
    `LIVE API [updateUserProgress]: Calling PUT ${apiGatewayUrl}/progress`
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

/**
 * Submits reflection content to the server for AI feedback (creating a draft)
 * OR to finalize a learning entry.
 * Corresponds to POST /lessons/{lessonId}/sections/{sectionId}/reflections
 * @param idToken - The user's authentication token.
 * @param apiGatewayUrl - The base URL of the API Gateway.
 * @param lessonId - The ID of the lesson.
 * @param sectionId - The ID of the reflection section.
 * @param submissionData - The reflection content and flags (ReflectionInteractionInput).
 * @returns A Promise resolving to ReflectionFeedbackAndDraftResponse if isFinal=false,
 * or ReflectionVersionItem (the final entry) if isFinal=true.
 */
export async function submitReflectionInteraction(
  idToken: string,
  apiGatewayUrl: string,
  lessonId: string,
  sectionId: string,
  submissionData: ReflectionInteractionInput
): Promise<ReflectionFeedbackAndDraftResponse | ReflectionVersionItem> {
  // Response type depends on submissionData.isFinal

  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    console.log(
      `MOCKED API [submitReflectionInteraction] for ${lessonId}/${sectionId}, isFinal: ${submissionData.isFinal}`
    );
    await mockApiDelay();
    const timestamp = new Date().toISOString();
    const mockVersionId = `mock_${lessonId}_${sectionId}_${timestamp}`;
    if (submissionData.isFinal) {
      const finalEntryMock: ReflectionVersionItem = {
        versionId: mockVersionId,
        userId: MOCKED_USER_ID,
        lessonId,
        sectionId,
        userTopic: submissionData.userTopic,
        userCode: submissionData.userCode,
        userExplanation: submissionData.userExplanation,
        aiFeedback: null, // Final entries don't have their own AI feedback
        aiAssessment: null,
        createdAt: timestamp,
        isFinal: true,
        sourceVersionId:
          submissionData.sourceVersionId || "mock_source_draft_id",
      };
      return Promise.resolve(finalEntryMock);
    } else {
      const draftResponseMock: ReflectionFeedbackAndDraftResponse = {
        versionId: mockVersionId,
        submittedContent: {
          userTopic: submissionData.userTopic,
          userCode: submissionData.userCode,
          userExplanation: submissionData.userExplanation,
        },
        aiFeedback: "This is thoughtful mocked AI feedback for your draft.",
        aiAssessment: "mostly",
        createdAt: timestamp,
      };
      return Promise.resolve(draftResponseMock);
    }
  }

  if (!idToken)
    return Promise.reject(new Error("Authentication token is required."));
  if (!apiGatewayUrl)
    return Promise.reject(new Error("API Gateway URL is required."));

  const endpoint = `${apiGatewayUrl}learning-entries/lessons/${lessonId}/sections/${sectionId}/reflections`;
  console.log(
    `LIVE API [submitReflectionInteraction]: Calling POST ${endpoint}`
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submissionData),
  });

  if (!response.ok) {
    // Covers 201 for created, but checks for 4xx, 5xx
    let errorData: ErrorResponse = {
      message: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = await response.json();
    } catch (e) {
      /* ignore if body not JSON */
    }
    console.error(
      `LIVE API [submitReflectionInteraction]: Error ${response.status} for ${endpoint}`,
      errorData
    );
    throw new Error(
      errorData.message || `Failed to submit reflection: ${response.status}`
    );
  }

  const data = await response.json();
  console.log(
    `LIVE API [submitReflectionInteraction]: Received from ${endpoint} ->`,
    data
  );
  // The actual type depends on what the server sent based on isFinal
  return data as ReflectionFeedbackAndDraftResponse | ReflectionVersionItem;
}

/**
 * Fetches all draft versions of a specific reflection section for the user.
 * Corresponds to GET /lessons/{lessonId}/sections/{sectionId}/reflections
 * @param idToken - The user's authentication token.
 * @param apiGatewayUrl - The base URL of the API Gateway.
 * @param lessonId - The ID of the lesson.
 * @param sectionId - The ID of the reflection section.
 * @returns A Promise resolving to ListOfReflectionDraftsResponse.
 */
export async function getReflectionDraftVersions(
  idToken: string,
  apiGatewayUrl: string,
  lessonId: string,
  sectionId: string
  // Add query params for pagination if needed: lastEvaluatedKey?: string, limit?: number
): Promise<ListOfReflectionDraftsResponse> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    console.log(
      `MOCKED API [getReflectionDraftVersions] for ${lessonId}/${sectionId}`
    );
    await mockApiDelay();
    const mockDrafts: ListOfReflectionDraftsResponse = {
      versions: [
        {
          versionId: "draft_v1",
          userId: MOCKED_USER_ID,
          lessonId,
          sectionId,
          userTopic: "Mock Draft Topic 1",
          userCode: "print(1)",
          userExplanation: "Expl 1",

          aiFeedback: "Good start.",
          aiAssessment: "developing",
          createdAt: new Date().toISOString(),
          isFinal: false,
        },
        {
          versionId: "draft_v2",
          userId: MOCKED_USER_ID,
          lessonId,
          sectionId,
          userTopic: "Mock Draft Topic 2",
          userCode: "print(2)",
          userExplanation: "Expl 2",
          aiFeedback: "Getting better!",
          aiAssessment: "mostly",
          createdAt: new Date().toISOString(),
          isFinal: false,
        },
      ],
      // lastEvaluatedKey: null // Or a mock key
    };
    return Promise.resolve(mockDrafts);
  }

  if (!idToken)
    return Promise.reject(new Error("Authentication token is required."));
  if (!apiGatewayUrl)
    return Promise.reject(new Error("API Gateway URL is required."));

  const endpoint = `${apiGatewayUrl}learning-entries/lessons/${lessonId}/sections/${sectionId}/reflections`;
  // Add query parameters for pagination here if implementing:
  // const url = new URL(endpoint);
  // if (limit) url.searchParams.append('limit', String(limit));
  // if (lastEvaluatedKey) url.searchParams.append('lastEvaluatedKey', lastEvaluatedKey);
  console.log(`LIVE API [getReflectionDraftVersions]: Calling GET ${endpoint}`);

  const response = await fetch(endpoint, {
    // Change to url.toString() if using URL object
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
      /* ignore */
    }
    console.error(
      `LIVE API [getReflectionDraftVersions]: Error ${response.status} for ${endpoint}`,
      errorData
    );
    throw new Error(
      errorData.message ||
        `Failed to fetch reflection drafts: ${response.status}`
    );
  }
  const data = await response.json();
  console.log(
    `LIVE API [getReflectionDraftVersions]: Received from ${endpoint} ->`,
    data
  );
  return data as ListOfReflectionDraftsResponse;
}

/**
 * Fetches all finalized learning entries for the authenticated user.
 * Corresponds to GET /learning-entries
 * @param idToken - The user's authentication token.
 * @param apiGatewayUrl - The base URL of the API Gateway.
 * @returns A Promise resolving to ListOfFinalLearningEntriesResponse.
 */
export async function getFinalizedLearningEntries(
  idToken: string,
  apiGatewayUrl: string
  // Add query params for pagination if needed: lastEvaluatedKey?: string, limit?: number
): Promise<ListOfFinalLearningEntriesResponse> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    console.log(`MOCKED API [getFinalizedLearningEntries]`);
    await mockApiDelay();
    const mockFinalEntries: ListOfFinalLearningEntriesResponse = {
      entries: [
        {
          // These are ReflectionVersionItem where isFinal=true and aiFeedback/Assessment are null
          versionId: "final_entry_1",
          userId: MOCKED_USER_ID,
          lessonId: "00_intro/lesson_7",
          sectionId: "python-reflection",
          userTopic: "Final Topic 1",
          userCode: "print('final 1')",
          userExplanation: "Final Expl 1",
          aiFeedback: null,
          aiAssessment: null,
          createdAt: new Date().toISOString(),
          isFinal: true,
          sourceVersionId: "draft_v2_for_final_1",
        },
      ],
      // lastEvaluatedKey: null
    };
    return Promise.resolve(mockFinalEntries);
  }

  if (!idToken)
    return Promise.reject(new Error("Authentication token is required."));
  if (!apiGatewayUrl)
    return Promise.reject(new Error("API Gateway URL is required."));

  const endpoint = `${apiGatewayUrl}/learning-entries`;
  // Add query parameters for pagination here if implementing
  console.log(
    `LIVE API [getFinalizedLearningEntries]: Calling GET ${endpoint}`
  );

  const response = await fetch(endpoint, {
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
      /* ignore */
    }
    console.error(
      `LIVE API [getFinalizedLearningEntries]: Error ${response.status} for ${endpoint}`,
      errorData
    );
    throw new Error(
      errorData.message ||
        `Failed to fetch finalized learning entries: ${response.status}`
    );
  }
  const data = await response.json();
  console.log(
    `LIVE API [getFinalizedLearningEntries]: Received from ${endpoint} ->`,
    data
  );
  return data as ListOfFinalLearningEntriesResponse;
}
