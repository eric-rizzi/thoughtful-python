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
  ClassUnitProgressResponse,
  StudentUnitCompletionData,
  AuthToken,
  StoredPrimmSubmissionItem,
  AssignmentSubmission,
  ListOfAssignmentSubmissionsResponse,
} from "../types/apiServiceTypes";
import {
  AssessmentLevel,
  UserId,
  LessonId,
  SectionId,
  UnitId,
  IsoTimestamp,
} from "../types/data";

export const USE_MOCKED_API = false;
const MOCKED_USER_ID = "mocked-google-user-id-12345" as UserId;

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
  idToken: AuthToken,
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
  idToken: AuthToken,
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
  idToken: AuthToken,
  apiGatewayUrl: string,
  lessonId: LessonId,
  sectionId: SectionId,
  submissionData: ReflectionInteractionInput
): Promise<ReflectionVersionItem> {
  if (USE_MOCKED_API && apiGatewayUrl.includes("mock")) {
    console.log(
      `MOCKED API [submitReflectionInteraction] for ${lessonId}/${sectionId}, isFinal: ${submissionData.isFinal}`
    );
    await mockApiDelay();
    const timestamp = new Date().toISOString() as IsoTimestamp;
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

  const endpoint = `${apiGatewayUrl}/reflections/${lessonId}/sections/${sectionId}`;

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
  idToken: AuthToken,
  apiGatewayUrl: string,
  lessonId: LessonId,
  sectionId: SectionId
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
          createdAt: new Date(
            Date.now() - 100000
          ).toISOString() as IsoTimestamp,
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
          createdAt: new Date().toISOString() as IsoTimestamp,
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

  const endpoint = `${apiGatewayUrl}/reflections/${lessonId}/sections/${sectionId}`;
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
          lessonId: "00_intro/lesson_7" as LessonId,
          sectionId: "python-reflection" as SectionId,
          userTopic: "Final Topic 1",
          userCode: "print('final 1')",
          userExplanation: "Final Expl 1",
          aiFeedback: null,
          aiAssessment: null,
          createdAt: new Date().toISOString() as IsoTimestamp,
          isFinal: true,
          sourceVersionId: "draft_v2_for_final_1",
          finalEntryCreatedAt: new Date().toISOString() as IsoTimestamp,
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
  idToken: AuthToken,
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
  idToken: AuthToken,
  apiGatewayUrl: string
): Promise<ListOfInstructorStudentsResponse> {
  if (USE_MOCKED_API) {
    console.log("MOCKED API [getInstructorPermittedStudents]: Called");
    await mockApiDelay();
    const mockStudents: InstructorStudentInfo[] = [
      {
        studentId: "USER#student_alpha_123" as UserId,
        studentName: "Alpha Armstrong",
        studentEmail: "alpha@example.com",
      },
      {
        studentId: "USER#student_beta_456" as UserId,
        studentName: "Beta Bronson",
      },
      {
        studentId: "USER#student_gamma_789" as UserId,
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

export async function getInstructorClassUnitProgress(
  idToken: AuthToken,
  apiGatewayUrl: string,
  unitId: UnitId,
  studentIds: UserId[] // Optional: Server could get permitted students itself, or client sends IDs
): Promise<ClassUnitProgressResponse> {
  // For this version, let's assume the server will determine permitted students based on the instructor's idToken.
  // If you wanted client to send studentIds, you'd add it to query params or request body (if POST).
  // For a GET, usually it's query params. e.g. ?studentIds=id1,id2,id3

  if (USE_MOCKED_API) {
    console.log(
      `MOCKED API [getInstructorClassUnitProgress]: unitId: ${unitId}, for ${studentIds.length} students`
    );
    await mockApiDelay(800);

    const mockStudentProgressData: StudentUnitCompletionData[] = studentIds.map(
      (sId) => {
        const seed = (sId.length + unitId.length) % 4;
        return {
          studentId: sId,
          completedSectionsInUnit: {
            [`${unitId}/lesson_1`]:
              seed > 0
                ? { section_a: "2025-06-01", section_b: "2025-06-02" }
                : { section_a: "2025-06-03" },
            [`${unitId}/lesson_2`]:
              seed > 1
                ? {
                    section_c: "2025-06-01",
                    section_d: "2025-06-01",
                    section_e: "2025-06-01",
                  }
                : seed > 0
                ? { section_c: "2025-06-01" }
                : {},
            [`${unitId}/lesson_3`]: seed > 2 ? { section_f: "2025-06-01" } : {},
          },
        };
      }
    );

    return Promise.resolve({
      unitId: unitId,
      studentProgressData: mockStudentProgressData,
    });
  }

  // Real API call logic
  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);
  if (!unitId) throw new ApiError("Unit ID is required.", 400);

  // The server-side lambda for this endpoint will use the instructor's ID (from idToken)
  // to fetch their permitted students and then get progress for those students for the given unitId.
  const endpoint = `${apiGatewayUrl}/instructor/units/${unitId}/class-progress`;

  console.log(
    `LIVE API [getInstructorClassUnitProgress]: Calling GET ${endpoint}`
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
      /* ignore */
    }
    console.error(
      `LIVE API [getInstructorClassUnitProgress]: Error ${response.status}`,
      errorData
    );
    throw new ApiError(errorData.message, response.status, errorData);
  }
  return response.json() as Promise<ClassUnitProgressResponse>;
}

export async function getSubmissionsForAssignment<
  T extends "Reflection" | "PRIMM"
>(
  idToken: AuthToken, // For API consistency, even if mock doesn't use it for auth
  apiGatewayUrl: string, // For API consistency
  unitId: UnitId,
  lessonId: LessonId, // GUID
  sectionId: SectionId, // ID of the Reflection or PRIMM section
  assignmentType: T,
  primmExampleId?: string // Only if assignmentType is "PRIMM"
): Promise<ListOfAssignmentSubmissionsResponse<T>> {
  // This mock will always run if USE_MOCKED_API is true, regardless of other params for now
  if (true) {
    console.log(
      `MOCKED API [getSubmissionsForAssignment]: unitId: ${unitId}, lessonId: ${lessonId}, sectionId: ${sectionId}, type: ${assignmentType}` +
        (primmExampleId ? `, primmExampleId: ${primmExampleId}` : "")
    );
    await mockApiDelay(1000); // Simulate network delay

    const submissions: AssignmentSubmission<T>[] = [];
    // Simulate 3-5 student submissions for the selected assignment
    const studentIdsForMock: UserId[] = [
      "student_alpha_123",
      "student_beta_456",
      "student_gamma_789",
      "student_delta_000",
    ];

    studentIdsForMock.forEach((sId, index) => {
      const submissionTimestamp = new Date(
        Date.now() - index * 3600000 * 24 - index * 123456
      ).toISOString() as IsoTimestamp;

      if (assignmentType === "Reflection") {
        // For reflections, the AssignmentSubmission.submissionDetails is a ReflectionVersionItem
        // We'll mock the *final* version for simplicity in this list view.
        // A more complex mock could return multiple versions if the UI is to show history here.
        const reflectionDetail: ReflectionVersionItem = {
          versionId: `rv_mock_${lessonId}_${sectionId}_${sId}_final`,
          userId: sId,
          lessonId: lessonId,
          sectionId: sectionId,
          userTopic: `Reflection on ${sectionId} by Student ${index + 1}`,
          userCode: `print("Student ${
            index + 1
          }'s code for ${sectionId}")\n# Some more code`,
          userExplanation: `This is student ${
            sId.split("_")[1]
          }'s insightful final explanation for the reflection topic in section ${sectionId} of lesson ${lessonId.substring(
            0,
            8
          )}. They discussed various aspects with clarity.`,
          aiFeedback: `Mocked AI: Student ${
            index + 1
          } provided a comprehensive reflection. Well done on articulating your thoughts on [key concept from section ${sectionId}].`,
          aiAssessment: (
            ["achieves", "mostly", "developing"] as AssessmentLevel[]
          )[index % 3],
          createdAt: submissionTimestamp,
          isFinal: true,
          sourceVersionId: `rv_mock_${lessonId}_${sectionId}_${sId}_draft2`, // Fictional previous draft
          finalEntryCreatedAt: submissionTimestamp,
        };
        submissions.push({
          studentId: sId,
          studentName: `Student ${sId
            .split("_")[1]
            .charAt(0)
            .toUpperCase()}${sId.split("_")[1].substring(1, 4)}`,
          submissionTimestamp,
          submissionDetails: reflectionDetail as any, // Cast to 'any' then to T to satisfy TypeScript
        } as AssignmentSubmission<T>);
      } else if (assignmentType === "PRIMM" && primmExampleId) {
        // For PRIMM, submissionDetails is a StoredPrimmSubmissionItem
        const primmDetail: StoredPrimmSubmissionItem = {
          userId: sId,
          submissionCompositeKey: `${lessonId}#${sectionId}#${primmExampleId}#${submissionTimestamp}`,
          lessonId: lessonId,
          sectionId: sectionId,
          primmExampleId: primmExampleId,
          timestampIso: submissionTimestamp,
          createdAt: submissionTimestamp, // Add createdAt if your StoredPrimmSubmissionItem has it
          codeSnippet: `def example_func():\n  val = ${
            index * 5
          }\n  print(f"Value is {val}")\nexample_func()`,
          userPredictionPromptText: `What will be the output of the code for example ${primmExampleId}?`,
          userPredictionText: `Student ${
            sId.split("_")[1]
          } predicted the output for example ${primmExampleId} would be 'Value is ${
            index * 5
          }'.`,
          userPredictionConfidence: ((index % 3) + 1) as 1 | 2 | 3, // 1, 2, or 3
          actualOutputSummary: `Value is ${index * 5}`,
          userExplanationText: `Student ${
            sId.split("_")[1]
          } explained that the function calculates and prints the value. Their prediction was accurate.`,
          aiPredictionAssessment: (
            ["achieves", "mostly", "developing"] as AssessmentLevel[]
          )[index % 3],
          aiExplanationAssessment: (
            ["achieves", "mostly"] as AssessmentLevel[]
          )[(index + 1) % 2],
          aiOverallComment: `Mocked AI overall comment for ${
            sId.split("_")[1]
          } on PRIMM example ${primmExampleId}. Focus on detailing execution flow.`,
        };
        submissions.push({
          studentId: sId,
          studentName: `Student ${sId
            .split("_")[1]
            .charAt(0)
            .toUpperCase()}${sId.split("_")[1].substring(1, 4)}`,
          submissionTimestamp,
          submissionDetails: primmDetail as any, // Cast to 'any' then to T
        } as AssignmentSubmission<T>);
      }
    });

    return Promise.resolve({
      assignmentType,
      unitId,
      lessonId,
      sectionId,
      primmExampleId: assignmentType === "PRIMM" ? primmExampleId : undefined,
      submissions,
    } as ListOfAssignmentSubmissionsResponse<T>); // Ensure the outer cast matches
  }

  // --- REAL API CALL LOGIC (to be implemented when backend is ready) ---
  if (!idToken) throw new ApiError("Authentication token is required.", 401);
  if (!apiGatewayUrl) throw new ApiError("API Gateway URL is required.", 500);

  // Construct the endpoint based on your Swagger definition
  // Example: /instructor/assignments/submissions?unitId=...&lessonId=...&sectionId=...&type=...
  // This will depend on how your backend API for this is designed.
  // For now, let's assume a placeholder path and query params.
  let queryParams = `unitId=${encodeURIComponent(
    unitId
  )}&lessonId=${encodeURIComponent(lessonId)}&sectionId=${encodeURIComponent(
    sectionId
  )}&assignmentType=${assignmentType}`;
  if (assignmentType === "PRIMM" && primmExampleId) {
    queryParams += `&primmExampleId=${encodeURIComponent(primmExampleId)}`;
  }
  const endpoint = `${apiGatewayUrl}/instructor/assignment-submissions?${queryParams}`; // Placeholder endpoint

  console.log(
    `LIVE API [getSubmissionsForAssignment]: Calling GET ${endpoint}`
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
      /* ignore */
    }
    console.error(
      `LIVE API [getSubmissionsForAssignment]: Error ${response.status}`,
      errorData
    );
    throw new ApiError(errorData.message, response.status, errorData);
  }
  return response.json() as Promise<ListOfAssignmentSubmissionsResponse<T>>;
}

// Mocked functions for fetching individual student's detailed entries
// (These would call your /instructor/students/{studentId}/learning-entries and /primm-submissions endpoints)
export async function getInstructorStudentLearningEntries(
  idToken: string,
  apiGatewayUrl: string,
  studentId: string
): Promise<StudentLearningEntriesResponse> {
  if (USE_MOCKED_API) {
    console.log(
      `MOCKED API [getInstructorStudentLearningEntries]: studentId: ${studentId}`
    );
    await mockApiDelay(600);
    const entries: ReflectionVersionItem[] = [];
    const lessonIds = [
      "lesson-guid-abc" as LessonId,
      "lesson-guid-def" as LessonId,
    ];
    lessonIds.forEach((lId, lIdx) => {
      const sectionId = `reflection-${lIdx + 1}` as SectionId;
      for (let i = 0; i < 2; i++) {
        // Mock 2 versions per reflection
        const isFinal = i === 1;
        const ts = new Date(
          Date.now() - lIdx * 100000000 - i * 5000000
        ).toISOString();
        entries.push({
          versionId: `s_${studentId}_${lId}_${sectionId}_v${i + 1}`,
          userId: studentId,
          lessonId: lId,
          sectionId: sectionId,
          userTopic: `Topic for ${lId.substring(
            0,
            10
          )} by ${studentId.substring(0, 10)} v${i + 1}`,
          userCode: `print("Version ${i + 1}")`,
          userExplanation: `Explanation v${i + 1}. This is ${
            isFinal ? "final." : "a draft."
          }`,
          aiAssessment: isFinal
            ? "achieves"
            : (["developing", "mostly"] as AssessmentLevel[])[i % 2],
          aiFeedback: isFinal
            ? "Excellent final thoughts."
            : "Good start, consider adding more detail.",
          createdAt: ts,
          isFinal: isFinal,
          sourceVersionId:
            i > 0 ? `s_${studentId}_${lId}_${sectionId}_v${i}` : null,
          finalEntryCreatedAt: isFinal ? ts : null,
        });
      }
    });
    return {
      entries: entries.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  }
  // Real API call
  const endpoint = `${apiGatewayUrl}/instructor/students/${studentId}/learning-entries`;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok)
    throw new ApiError(
      "Failed to fetch student learning entries",
      response.status
    );
  return response.json();
}

export async function getInstructorStudentPrimmSubmissions(
  idToken: string,
  apiGatewayUrl: string,
  studentId: string
): Promise<StudentPrimmSubmissionsResponse> {
  if (USE_MOCKED_API) {
    console.log(
      `MOCKED API [getInstructorStudentPrimmSubmissions]: studentId: ${studentId}`
    );
    await mockApiDelay(650);
    const submissions: StoredPrimmSubmissionItem[] = [];
    const lessonIds = [
      "lesson-guid-xyz" as LessonId,
      "lesson-guid-123" as LessonId,
    ];
    lessonIds.forEach((lId, lIdx) => {
      const sectionId = `primm-sec-${lIdx + 1}` as SectionId;
      const exampleId = `ex${lIdx + 1}`;
      const ts = new Date(Date.now() - lIdx * 150000000).toISOString();
      submissions.push({
        userId: studentId,
        submissionCompositeKey: `${lId}#${sectionId}#${exampleId}#${ts}`,
        lessonId: lId,
        sectionId,
        primmExampleId: exampleId,
        timestampIso: ts,
        createdAt: ts,
        codeSnippet: `print("PRIMM ${exampleId}")`,
        userPredictionPromptText: "What does this do?",
        userPredictionText: "It prints something.",
        userPredictionConfidence: 2,
        actualOutputSummary: "It printed: PRIMM " + exampleId,
        userExplanationText:
          "My prediction was okay, but the explanation is key.",
        aiPredictionAssessment: "developing",
        aiExplanationAssessment: "mostly",
        aiOverallComment: "Good effort on PRIMM example " + exampleId,
      });
    });
    return { submissions };
  }
  // Real API call
  const endpoint = `${apiGatewayUrl}/instructor/students/${studentId}/primm-submissions`;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok)
    throw new ApiError(
      "Failed to fetch student PRIMM submissions",
      response.status
    );
  return response.json();
}
