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
  idToken: AuthToken,
  apiGatewayUrl: string,
  unitId: UnitId,
  lessonId: LessonId,
  sectionId: SectionId,
  assignmentType: T,
  primmExampleId?: string
): Promise<ListOfAssignmentSubmissionsResponse<T>> {
  if (true) {
    console.log(
      `MOCKED API [getSubmissionsForAssignment]: unit: ${unitId}, lesson: ${lessonId}, section: ${sectionId}, type: ${assignmentType}`
    );
    await mockApiDelay(1000);
    const submissions: AssignmentSubmission<T>[] = [];
    const studentIdsForMock: UserId[] = [
      "erizzi@person.com",
      "whodis@you.com",
      "youder@there.com",
    ];

    studentIdsForMock.forEach((sId, index) => {
      const baseTs = Date.now() - index * 86400000; // Offset by days

      if (assignmentType === "Reflection") {
        const reflectionVersions: ReflectionVersionItem[] = [];
        const versionData = [
          {
            expl: "Initial draft, needs work.",
            assess: "developing" as AssessmentLevel,
            feedback: "Expand on key ideas.",
            offset: 2 * 3600000,
            isFinal: false,
          },
          {
            expl: "Second draft, much improved detail.",
            assess: "mostly" as AssessmentLevel,
            feedback: "Good progress, clarify point X.",
            offset: 1 * 3600000,
            isFinal: false,
          },
          {
            expl: "Final reflection, comprehensive.",
            assess: "achieves" as AssessmentLevel,
            feedback: "Excellent work!",
            offset: 0,
            isFinal: true,
          },
        ];
        let prevVersionId: string | null = null;
        versionData.forEach((vd, vIdx) => {
          const ts = new Date(baseTs - vd.offset).toISOString() as IsoTimestamp;
          const currentVersionId = `mockR_${sId}_${lessonId.substring(
            0,
            4
          )}_${sectionId}_v${vIdx + 1}`;
          reflectionVersions.push({
            versionId: currentVersionId,
            userId: sId,
            lessonId,
            sectionId,
            userTopic: `Topic for ${sectionId}`,
            userCode: `print("v${vIdx + 1}")`,
            userExplanation: vd.expl,
            aiAssessment: vd.assess,
            aiFeedback: vd.feedback,
            createdAt: ts,
            isFinal: vd.isFinal,
            sourceVersionId: vd.isFinal
              ? prevVersionId
              : vIdx > 0
              ? `mockR_${sId}_${lessonId.substring(0, 4)}_${sectionId}_v${vIdx}`
              : null,
            finalEntryCreatedAt: vd.isFinal ? ts : null,
          });
          prevVersionId = currentVersionId;
        });
        submissions.push({
          studentId: sId,
          studentName: `Student ${sId}`,
          submissionTimestamp:
            reflectionVersions[reflectionVersions.length - 1].createdAt,
          submissionDetails: reflectionVersions as any, // Cast to 'any' then to T
        } as AssignmentSubmission<T>);
      } else if (assignmentType === "PRIMM" && primmExampleId) {
        const ts = new Date(baseTs).toISOString();
        const primmDetail: StoredPrimmSubmissionItem = {
          userId: sId,
          submissionCompositeKey: `${lessonId}#${sectionId}#${primmExampleId}#${ts}`,
          lessonId,
          sectionId,
          primmExampleId,
          timestampIso: ts,
          createdAt: ts,
          codeSnippet: `code_for_${primmExampleId}`,
          userPredictionPromptText: "Predict this.",
          userPredictionText: `Prediction by ${sId.split("_")[2]}`,
          userPredictionConfidence: 2,
          actualOutputSummary: "Actual output.",
          userExplanationText: `Explanation by ${sId.split("_")[2]}`,
          aiPredictionAssessment: "mostly",
          aiExplanationAssessment: "achieves",
          aiOverallComment: "Good PRIMM analysis.",
        };
        submissions.push({
          studentId: sId,
          studentName: `Student ${sId}`,
          submissionTimestamp: ts,
          submissionDetails: primmDetail as any,
        } as AssignmentSubmission<T>);
      }
    });
    return Promise.resolve({
      assignmentType,
      unitId,
      lessonId,
      sectionId,
      primmExampleId,
      submissions,
    } as ListOfAssignmentSubmissionsResponse<T>);
  }
  // Real API Call
  let queryParams = `unitId=${encodeURIComponent(
    unitId
  )}&lessonId=${encodeURIComponent(lessonId)}&sectionId=${encodeURIComponent(
    sectionId
  )}&assignmentType=${assignmentType}`;
  if (assignmentType === "PRIMM" && primmExampleId)
    queryParams += `&primmExampleId=${encodeURIComponent(primmExampleId)}`;
  const endpoint = `${apiGatewayUrl}/instructor/assignment-submissions?${queryParams}`; // Placeholder
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${idToken}` },
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
  return response.json();
}

export async function getInstructorStudentLearningEntries(
  idToken: AuthToken,
  apiGatewayUrl: string,
  studentId: UserId
): Promise<StudentLearningEntriesResponse> {
  if (true) {
    console.log(
      `MOCKED API [getInstructorStudentLearningEntries]: studentId: ${studentId}`
    );
    await mockApiDelay(750);
    const entries: ReflectionVersionItem[] = [];
    const lessonGuids = [
      "lesson-guid-reflect-A" as LessonId,
      "lesson-guid-reflect-B" as LessonId,
    ];
    const sectionIds = [
      "reflection-topic1" as SectionId,
      "reflection-topic2" as SectionId,
    ];

    lessonGuids.forEach((lId, lIdx) => {
      sectionIds.forEach((sId, sIdx) => {
        const baseTimestamp = Date.now() - lIdx * 100000000 - sIdx * 50000000;
        const versions = [
          {
            isFinal: false,
            userExplanation: `Student ${studentId.substring(
              5,
              9
            )}'s initial draft for ${sId}. It covers the basics but needs more depth on [concept X].`,
            aiAssessment: "developing" as AssessmentLevel,
            aiFeedback:
              "This is a good start. Try to elaborate more on how [concept X] applies to your code example. Also, consider edge cases.",
            createdAtOffset: 2 * 3600 * 1000,
          },
          {
            isFinal: false,
            userExplanation: `Revised draft for ${sId} by ${studentId.substring(
              5,
              9
            )}. Added details on [concept X] and an edge case. I also improved the code example.`,
            aiAssessment: "mostly" as AssessmentLevel,
            aiFeedback:
              "Much better! Your explanation of [concept X] is clearer, and the edge case is relevant. The code example is also more illustrative now.",
            createdAtOffset: 1 * 3600 * 1000,
          },
          {
            isFinal: true,
            userExplanation: `Final thoughts on ${sId} by ${studentId.substring(
              5,
              9
            )}. I've incorporated the feedback and feel this is a solid explanation of [concept X] and [concept Y], supported by the code.`,
            aiAssessment: "achieves" as AssessmentLevel,
            aiFeedback:
              "Excellent work! This final version is clear, comprehensive, and accurately explains the concepts with a good supporting example.",
            createdAtOffset: 0,
          },
        ];
        let previousVersionId: string | null = null;
        versions.forEach((versionData, vIdx) => {
          const versionTimestamp = new Date(
            baseTimestamp - versionData.createdAtOffset
          ).toISOString() as IsoTimestamp;
          const versionId = `entry_${studentId}_${lId}_${sId}_v${vIdx + 1}`;
          entries.push({
            versionId: versionId,
            userId: studentId,
            lessonId: lId,
            sectionId: sId,
            userTopic: `Topic for ${sId} (Lesson: ${lId.substring(0, 12)})`,
            userCode: `print("Student ${studentId.substring(
              5,
              9
            )} - ${sId} - Version ${vIdx + 1}")\n# Code for version ${
              vIdx + 1
            }`,
            userExplanation: versionData.userExplanation,
            aiAssessment: versionData.aiAssessment,
            aiFeedback: versionData.aiFeedback,
            createdAt: versionTimestamp,
            isFinal: versionData.isFinal,
            sourceVersionId: versionData.isFinal
              ? previousVersionId
              : vIdx > 0
              ? `entry_${studentId}_${lId}_${sId}_v${vIdx}`
              : null,
            finalEntryCreatedAt: versionData.isFinal ? versionTimestamp : null,
          });
          previousVersionId = versionId;
        });
      });
    });
    return {
      entries: entries.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  }
  const endpoint = `${apiGatewayUrl}/instructor/students/${studentId}/learning-entries`;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    /* ... error handling ... */ throw new ApiError("Failed", response.status);
  }
  return response.json();
}

export async function getInstructorStudentFinalLearningEntries(
  idToken: AuthToken,
  apiGatewayUrl: string,
  studentId: UserId
): Promise<StudentLearningEntriesResponse> {
  if (true) {
    console.log(
      `MOCKED API [getInstructorStudentFinalLearningEntries]: studentId: ${studentId}`
    );
    await mockApiDelay(600);
    // Leverage the existing mock that generates all versions, then filter
    const allEntriesResponse = await getInstructorStudentLearningEntries(
      idToken,
      apiGatewayUrl,
      studentId
    );
    const finalEntries = allEntriesResponse.entries.filter(
      (entry) => entry.isFinal
    );
    console.log(
      `Mock returning ${finalEntries.length} final entries for ${studentId}`
    );
    return Promise.resolve({ entries: finalEntries });
  }
  // Real API call: add ?isFinal=true query parameter
  const endpoint = `${apiGatewayUrl}/instructor/students/${studentId}/learning-entries?isFinal=true`;
  console.log(
    `LIVE API [getInstructorStudentFinalLearningEntries]: Calling GET ${endpoint}`
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
      `LIVE API [getInstructorStudentFinalLearningEntries]: Error ${response.status}`,
      errorData
    );
    throw new ApiError(
      errorData.message ||
        `Failed to fetch final learning entries: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json() as Promise<StudentLearningEntriesResponse>;
}

export async function getInstructorStudentPrimmSubmissions(
  idToken: AuthToken,
  apiGatewayUrl: string,
  studentId: UserId
): Promise<StudentPrimmSubmissionsResponse> {
  if (true) {
    console.log(
      `MOCKED API [getInstructorStudentPrimmSubmissions]: studentId: ${studentId}`
    );
    await mockApiDelay(650);
    const submissions: StoredPrimmSubmissionItem[] = [];
    const lessonGuids = [
      "lesson-guid-primm-X" as LessonId,
      "lesson-guid-primm-Y" as LessonId,
    ];
    lessonGuids.forEach((lId, lIdx) => {
      const sectionId = `primm-sec-${lIdx + 1}` as SectionId;
      const exampleId = `ex${lIdx + 1}_${studentId.substring(5, 7)}`;
      const ts = new Date(Date.now() - lIdx * 150000000).toISOString();
      submissions.push({
        userId: studentId,
        submissionCompositeKey: `${lId}#${sectionId}#${exampleId}#${ts}`,
        lessonId: lId,
        sectionId,
        primmExampleId: exampleId,
        timestampIso: ts,
        createdAt: ts,
        codeSnippet: `print("PRIMM Example ${exampleId} for ${studentId.substring(
          5,
          9
        )}")`,
        userPredictionPromptText:
          "What does this code do, and what will it output?",
        userPredictionText:
          "It will print a specific calculated value based on the example.",
        userPredictionConfidence: ((lIdx % 3) + 1) as 1 | 2 | 3,
        actualOutputSummary: "Printed the calculated value correctly.",
        userExplanationText:
          "My prediction was accurate. The code initializes a variable and then prints its transformed state.",
        aiPredictionAssessment: (["achieves", "mostly"] as AssessmentLevel[])[
          lIdx % 2
        ],
        aiExplanationAssessment: (
          ["mostly", "developing"] as AssessmentLevel[]
        )[lIdx % 2],
        aiOverallComment:
          "Good analysis of PRIMM example " + exampleId + ". Keep practicing!",
      });
    });
    return { submissions };
  }
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
