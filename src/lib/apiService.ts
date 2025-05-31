// src/lib/apiService.ts
import type {
  UserProgressData,
  BatchCompletionsInput,
  ErrorResponse, // This is already defined for structured errors
  ReflectionInteractionInput,
  ReflectionVersionItem,
  ListOfReflectionDraftsResponse,
  ListOfFinalLearningEntriesResponse,
  PrimmEvaluationRequest,
  PrimmEvaluationResponse,
  InstructorStudentInfo,
  ListOfInstructorStudentsResponse,
} from "../types/apiServiceTypes";
import { AssessmentLevel } from "../types/data";

export const USE_MOCKED_API = false;
const MOCKED_USER_ID = "mocked-google-user-id-12345";

// Custom Error class to hold status and parsed response
export class ApiError extends Error {
  status: number;
  data: ErrorResponse | { message: string }; // Can hold the parsed JSON error or a simpler message

  constructor(
    message: string,
    status: number,
    data?: ErrorResponse | { message: string }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data || { message };
    Object.setPrototypeOf(this, ApiError.prototype); // For correct instanceof checks
  }
}

const mockApiDelay = (duration: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export async function getUserProgress(
  idToken: string,
  apiGatewayUrl: string
): Promise<UserProgressData> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
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

  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);

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
      /* ignore if body not JSON */
    }
    console.error(
      `LIVE API [getUserProgress]: Error ${response.status}`,
      errorData
    );
    throw new ApiError(
      errorData.message || `Failed to fetch progress: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json() as Promise<UserProgressData>;
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
    return Promise.resolve({ userId: MOCKED_USER_ID, completion: {} });
  }

  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);
  if (!batchInput || !batchInput.completions)
    throw new ApiError("Completions data is required.", 400);

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
      /* ignore */
    }
    console.error(
      `LIVE API [updateUserProgress]: Error ${response.status}`,
      errorData
    );
    throw new ApiError(
      errorData.message || `Failed to update progress: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json() as Promise<UserProgressData>;
}

/**
 * Submits reflection content to the server for AI feedback (creating a draft)
 * OR to finalize a learning entry.
 * Corresponds to POST /reflections/{lessonId}/sections/{sectionId}
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
): Promise<ReflectionVersionItem> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    console.log(
      `MOCKED API [submitReflectionInteraction] for ${lessonId}/${sectionId}, isFinal: ${submissionData.isFinal}`
    );
    await mockApiDelay();
    const timestamp = new Date().toISOString();
    const mockVersionId = `mock_${lessonId}_${sectionId}_${timestamp.replace(
      /:|\./g,
      ""
    )}`;

    const mockItem: ReflectionVersionItem = {
      versionId: mockVersionId,
      userId: MOCKED_USER_ID,
      lessonId,
      sectionId,
      userTopic: submissionData.userTopic,
      userCode: submissionData.userCode,
      userExplanation: submissionData.userExplanation,
      createdAt: timestamp,
      isFinal: submissionData.isFinal || false,
      aiFeedback: submissionData.isFinal
        ? null
        : "This is thoughtful mocked AI feedback for your draft.",
      aiAssessment: submissionData.isFinal ? null : "mostly",
      sourceVersionId: submissionData.isFinal
        ? submissionData.sourceVersionId || "mock_source_draft_id"
        : null,
      finalEntryCreatedAt: submissionData.isFinal ? timestamp : null,
    };
    return Promise.resolve(mockItem);
  }

  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);

  const lessonIdNoSlash = lessonId.replace("/", "-");
  const endpoint = `${apiGatewayUrl}/reflections/${lessonIdNoSlash}/sections/${sectionId}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submissionData),
  });

  if (!response.ok) {
    // Handles 201 for created, but checks for 4xx, 5xx including 429
    let errorData: ErrorResponse = {
      message: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      // The Lambda's format_lambda_response sends {"message": ..., "type": ...} for 429
      const parsedJson = await response.json();
      // If 'type' exists (like our throttling types), include it.
      errorData = {
        message: parsedJson.message || errorData.message,
        details: parsedJson.type ? { type: parsedJson.type } : undefined,
      };
    } catch (e) {
      /* ignore if body not JSON or different structure */
    }

    console.error(
      `LIVE API [submitReflectionInteraction]: Error ${response.status} for ${endpoint}`,
      errorData
    );
    throw new ApiError(errorData.message, response.status, errorData);
  }

  return response.json() as Promise<ReflectionVersionItem>;
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
          createdAt: new Date(Date.now() - 100000).toISOString(),
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
      lastEvaluatedKey: null,
    };
    return Promise.resolve(mockDrafts);
  }

  if (!idToken)
    return Promise.reject(new Error("Authentication token is required."));
  if (!apiGatewayUrl)
    return Promise.reject(new Error("API Gateway URL is required."));

  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);

  const lessonIdNoSlash = lessonId.replace("/", "-");
  const endpoint = `${apiGatewayUrl}/reflections/${lessonIdNoSlash}/sections/${sectionId}`;
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
      `LIVE API [getReflectionDraftVersions]: Error ${response.status} for ${endpoint}`,
      errorData
    );
    throw new ApiError(
      errorData.message || `Failed to fetch drafts: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json() as Promise<ListOfReflectionDraftsResponse>;
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
): Promise<ListOfFinalLearningEntriesResponse> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    console.log(`MOCKED API [getFinalizedLearningEntries]`);
    await mockApiDelay();
    const mockFinalEntries: ListOfFinalLearningEntriesResponse = {
      entries: [
        {
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
          finalEntryCreatedAt: new Date().toISOString(),
        },
      ],
      lastEvaluatedKey: null,
    };
    return Promise.resolve(mockFinalEntries);
  }

  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);

  const endpoint = `${apiGatewayUrl}/learning-entries`;
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
    throw new ApiError(
      errorData.message || `Failed to fetch entries: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json() as Promise<ListOfFinalLearningEntriesResponse>;
}

export async function submitPrimmEvaluation(
  idToken: string,
  apiGatewayUrl: string,
  payload: PrimmEvaluationRequest
): Promise<PrimmEvaluationResponse> {
  if (USE_MOCKED_API) {
    console.log(
      "MOCKED API [submitPrimmEvaluation]: Called with payload:",
      payload
    );
    await mockApiDelay(1200);

    // Use a more consistent mock based on the latest PrimmEvaluationResponse structure
    const mockResponse: PrimmEvaluationResponse = {
      aiPredictionAssessment: ["achieves", "mostly", "developing"][
        Math.floor(Math.random() * 3)
      ] as AssessmentLevel,
      aiExplanationAssessment: payload.userExplanationText // If explanation text is provided, give an assessment
        ? (["achieves", "mostly", "developing", "insufficient"][
            Math.floor(Math.random() * 4)
          ] as AssessmentLevel)
        : // If no explanation text, the server Pydantic model might default or it should be optional.
          // Per your swagger, aiExplanationAssessment is required. So, let's provide a default if no text.
          "insufficient",
      aiOverallComment: `Mocked AI Overall Comment: Your prediction (confidence: ${
        payload.userPredictionConfidence
      }) showed some insight. Your explanation was ${
        payload.userExplanationText ? "noted" : "not provided"
      }. Keep it up!`,
    };
    return Promise.resolve(mockResponse);
  }

  // --- REAL API CALL LOGIC ---
  if (!idToken)
    throw new ApiError(
      "Authentication token is required for PRIMM evaluation.",
      401
    );
  if (!apiGatewayUrl)
    throw new ApiError(
      "API Gateway URL is required for PRIMM evaluation.",
      500
    );

  const endpoint = `${apiGatewayUrl}/primm-feedback`;

  console.log(
    `LIVE API [submitPrimmEvaluation]: Calling POST ${endpoint} with payload:`,
    payload
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // This will catch 429, 400, 500, etc.
    let errorData: { message: string; details?: any; type?: string } = {
      message: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      const parsedJson = await response.json();
      errorData = {
        message: parsedJson.message || errorData.message,
        type: parsedJson.type || undefined,
        details: parsedJson.details || undefined,
      };
    } catch (e) {
      console.warn(
        "Response from server was not valid JSON, using status text as message."
      );
    }

    console.error(
      `LIVE API [submitPrimmEvaluation]: Error ${response.status}`,
      errorData
    );
    throw new ApiError(errorData.message, response.status, errorData);
  }
  return response.json() as Promise<PrimmEvaluationResponse>;
}

export async function getInstructorPermittedStudents(
  idToken: string,
  apiGatewayUrl: string
): Promise<ListOfInstructorStudentsResponse> {
  if (USE_MOCKED_API) {
    console.log("MOCKED API [getInstructorPermittedStudents]: Called");
    await mockApiDelay();
    const mockStudents: InstructorStudentInfo[] = [
      {
        studentId: "USER#student_alpha_123",
        studentName: "Alpha Armstrong",
        studentEmail: "alpha@example.com",
      },
      { studentId: "USER#student_beta_456", studentName: "Beta Bronson" },
      {
        studentId: "USER#student_gamma_789",
        studentEmail: "gamma@example.com",
      },
    ];
    return Promise.resolve({ students: mockStudents });
  }

  // Real API call logic
  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);

  const endpoint = `${apiGatewayUrl}/instructor/students`; // Path from your Swagger

  console.log(
    `LIVE API [getInstructorPermittedStudents]: Calling GET ${endpoint}`
  );
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorData: { message: string; details?: any; type?: string } = {
      message: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      const parsedJson = await response.json();
      errorData = {
        message: parsedJson.message || errorData.message,
        type: parsedJson.type || undefined,
        details: parsedJson.details || undefined,
      };
    } catch (e) {
      console.warn(
        "Response from server was not valid JSON, using status text as message."
      );
    }
    console.error(
      `LIVE API [getInstructorPermittedStudents]: Error ${response.status}`,
      errorData
    );
    throw new ApiError(errorData.message, response.status, errorData);
  }
  return response.json() as Promise<ListOfInstructorStudentsResponse>;
}
