import { API_GATEWAY_BASE_URL } from "../config";
import { useAuthStore } from "../stores/authStore";
import type {
  UserProgressData,
  BatchCompletionsInput,
  ErrorResponse,
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
  AccessTokenId,
  RefreshTokenId,
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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { getAccessToken, getRefreshToken, setTokens, logout } =
    useAuthStore.getState().actions;
  const token = getAccessToken();

  // Set the Authorization header
  options.headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(url, options);

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        options.headers!["Authorization"] = `Bearer ${getAccessToken()}`;
        return fetch(url, options);
      });
    }

    isRefreshing = true;
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      logout();
      isRefreshing = false;
      return Promise.reject(
        new ApiError("Session expired. Please log in again.", 401)
      );
    }

    try {
      const newTokens = await refreshAccessToken(
        API_GATEWAY_BASE_URL,
        refreshToken
      );
      setTokens(newTokens);
      processQueue(null, newTokens.accessToken);
      options.headers!["Authorization"] = `Bearer ${newTokens.accessToken}`;
      response = await fetch(url, options); // Retry the original request
    } catch (refreshError) {
      processQueue(refreshError, null);
      logout();
      return Promise.reject(
        new ApiError("Session expired. Please log in again.", 401)
      );
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

export async function loginWithGoogle(
  apiGatewayUrl: string,
  googleIdToken: string
): Promise<{ accessToken: AccessTokenId; refreshToken: RefreshTokenId }> {
  const response = await fetch(`${apiGatewayUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ googleIdToken }),
  });
  if (!response.ok) throw new ApiError("Login failed", response.status);
  return response.json();
}

export async function refreshAccessToken(
  apiGatewayUrl: string,
  refreshToken: string
): Promise<{ accessToken: AccessTokenId; refreshToken: RefreshTokenId }> {
  const response = await fetch(`${apiGatewayUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok)
    throw new ApiError("Failed to refresh token", response.status);
  return response.json();
}

export async function logoutUser(
  apiGatewayUrl: string,
  refreshToken: string
): Promise<void> {
  await fetch(`${apiGatewayUrl}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData: ErrorResponse = {
      message: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore if body is not valid JSON
    }
    throw new ApiError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
};

export async function getUserProgress(
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

  const response = await fetchWithAuth(`${apiGatewayUrl}/progress`);
  return handleApiResponse(response);
}

export async function updateUserProgress(
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

  const response = await fetchWithAuth(`${apiGatewayUrl}/progress`, {
    method: "PUT",
    body: JSON.stringify(batchInput),
  });
  return handleApiResponse(response);
}

/**
 * Submits reflection content to the server for AI feedback (creating a draft)
 * OR to finalize a learning entry.
 * Corresponds to POST /reflections/{lessonId}/sections/{sectionId}
 * @param apiGatewayUrl - The base URL of the API Gateway.
 * @param lessonId - The ID of the lesson.
 * @param sectionId - The ID of the reflection section.
 * @param submissionData - The reflection content and flags (ReflectionInteractionInput).
 * @returns A Promise resolving to ReflectionFeedbackAndDraftResponse if isFinal=false,
 * or ReflectionVersionItem (the final entry) if isFinal=true.
 */
export async function submitReflectionInteraction(
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

  const endpoint = `${apiGatewayUrl}/reflections/${lessonId}/sections/${sectionId}`;
  const response = await fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
  if (!response.ok)
    throw new ApiError("Failed to submit reflection", response.status);
  return response.json();
}

/**
 * Fetches all draft versions of a specific reflection section for the user.
 * Corresponds to GET /lessons/{lessonId}/sections/{sectionId}/reflections
 * @param apiGatewayUrl - The base URL of the API Gateway.
 * @param lessonId - The ID of the lesson.
 * @param sectionId - The ID of the reflection section.
 * @returns A Promise resolving to ListOfReflectionDraftsResponse.
 */
export async function getReflectionDraftVersions(
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

  const endpoint = `${apiGatewayUrl}/reflections/${lessonId}/sections/${sectionId}`;
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}

/**
 * Fetches all finalized learning entries for the authenticated user.
 * Corresponds to GET /learning-entries
 * @param apiGatewayUrl - The base URL of the API Gateway.
 * @returns A Promise resolving to ListOfFinalLearningEntriesResponse.
 */
export async function getFinalizedLearningEntries(
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

  const response = await fetchWithAuth(`${apiGatewayUrl}/learning-entries`);
  return handleApiResponse(response);
}

export async function submitPrimmEvaluation(
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

  const endpoint = `${apiGatewayUrl}/primm-feedback`;
  const response = await fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleApiResponse(response);
}

export async function getInstructorPermittedStudents(
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

  const response = await fetchWithAuth(`${apiGatewayUrl}/instructor/students`);
  return handleApiResponse(response);
}

export async function getInstructorClassUnitProgress(
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

  const endpoint = `${apiGatewayUrl}/instructor/units/${unitId}/class-progress`;
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}

export async function getSubmissionsForAssignment<
  T extends "Reflection" | "PRIMM"
>(
  apiGatewayUrl: string,
  unitId: UnitId,
  lessonId: LessonId,
  sectionId: SectionId,
  assignmentType: T,
  primmExampleId?: string
): Promise<ListOfAssignmentSubmissionsResponse<T>> {
  // The mock implementation can be updated or removed as needed.
  if (USE_MOCKED_API) {
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
        const ts = new Date(baseTs).toISOString() as IsoTimestamp;
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

  const basePath = `${apiGatewayUrl}/instructor/units/${unitId}/lessons/${lessonId}/sections/${sectionId}/assignment-submissions`;
  const queryParams = new URLSearchParams({ assignmentType });
  if (assignmentType === "PRIMM" && primmExampleId) {
    queryParams.append("primmExampleId", primmExampleId);
  }
  const endpoint = `${basePath}?${queryParams.toString()}`;
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}

export async function getInstructorStudentLearningEntries(
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
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}

export async function getInstructorStudentFinalLearningEntries(
  apiGatewayUrl: string,
  studentId: UserId
): Promise<StudentLearningEntriesResponse> {
  if (USE_MOCKED_API) {
    console.log(
      `MOCKED API [getInstructorStudentFinalLearningEntries]: studentId: ${studentId}`
    );
    await mockApiDelay(600);
    // Leverage the existing mock that generates all versions, then filter
    const allEntriesResponse = await getInstructorStudentLearningEntries(
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
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}

export async function getInstructorStudentPrimmSubmissions(
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
      const ts = new Date(
        Date.now() - lIdx * 150000000
      ).toISOString() as IsoTimestamp;
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
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}

export async function getStudentDetailedProgress(
  apiGatewayUrl: string,
  studentId: UserId
): Promise<StudentDetailedProgressResponse> {
  // This function is currently mocked to allow for UI development.
  // The 'true' flag can be changed to USE_MOCKED_API when ready.
  if (true) {
    console.log(
      `MOCKED API [getStudentDetailedProgress]: Called for studentId: ${studentId}`
    );
    await mockApiDelay(800);

    const mockReflectionSubmission: ReflectionVersionItem[] = [
      {
        versionId: "mock_final_v3",
        userId: studentId,
        lessonId: "ab5bed79-7662-423e-90ef-952539f59099" as LessonId,
        sectionId: "python-reflection" as SectionId,
        userTopic: "Using For Loops",
        userCode: 'for i in range(5):\n  print("Hello", i)',
        userExplanation: "This was my final, best explanation of for loops.",
        createdAt: new Date().toISOString() as IsoTimestamp,
        isFinal: true,
        sourceVersionId: "mock_draft_v2",
        finalEntryCreatedAt: new Date().toISOString() as IsoTimestamp,
      },
      {
        versionId: "mock_draft_v2",
        userId: studentId,
        lessonId: "ab5bed79-7662-423e-90ef-952539f59099" as LessonId,
        sectionId: "python-reflection" as SectionId,
        userTopic: "Using For Loops",
        userCode: 'for i in range(5):\n  print("Hello", i)',
        userExplanation: "This was my second draft, incorporating feedback.",
        aiFeedback:
          "Excellent improvement! Your explanation is much clearer now.",
        aiAssessment: "achieves",
        createdAt: new Date(Date.now() - 3600000).toISOString() as IsoTimestamp, // 1 hour ago
        isFinal: false,
      },
    ];

    const mockResponse: StudentDetailedProgressResponse = {
      studentId: studentId,
      studentName: "Beta Bronson (Mocked)",
      profile: [
        {
          unitId: "intro_python" as UnitId,
          unitTitle: "Introduction to Python",
          lessons: [
            {
              lessonId: "3c1e0332-e7ec-4e6a-b0c6-f9c9890999c5" as LessonId,
              lessonTitle: "Python Basics",
              sections: [
                {
                  sectionId: "python-history" as SectionId,
                  sectionTitle: "The History of Python",
                  sectionKind: "Information",
                  status: "completed",
                },
                {
                  sectionId: "print-function" as SectionId,
                  sectionTitle: "The Print Function",
                  sectionKind: "Observation",
                  status: "completed",
                },
                {
                  sectionId: "comments" as SectionId,
                  sectionTitle: "Comments",
                  sectionKind: "Observation",
                  status: "not_started",
                },
              ],
            },
            {
              lessonId: "ab5bed79-7662-423e-90ef-952539f59099" as LessonId,
              lessonTitle: "Reflection and Self-Assessment",
              sections: [
                {
                  sectionId: "reflection-intro" as SectionId,
                  sectionTitle: "Introduction to Reflection",
                  sectionKind: "Information",
                  status: "completed",
                },
                {
                  sectionId: "python-reflection" as SectionId,
                  sectionTitle: "Python Concept Reflection",
                  sectionKind: "Reflection",
                  status: "submitted",
                  submissionTimestamp: mockReflectionSubmission[0].createdAt,
                  submissionDetails: mockReflectionSubmission,
                },
              ],
            },
          ],
        },
        {
          unitId: "python_strings" as UnitId,
          unitTitle: "Python Strings Deep Dive",
          lessons: [
            {
              lessonId: "03cff8d8-33a0-49ed-98c4-d51613995340" as LessonId,
              lessonTitle: "String Formatting and f-strings",
              sections: [
                {
                  sectionId: "primm-print-analysis" as SectionId,
                  sectionTitle: "Predict, Run, Investigate: Print Statements",
                  sectionKind: "PRIMM",
                  status: "not_started",
                },
              ],
            },
          ],
        },
      ],
    };
    return Promise.resolve(mockResponse);
  }

  const endpoint = `${apiGatewayUrl}/instructor/students/${studentId}/detailed-progress`;
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}
