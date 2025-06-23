import { API_GATEWAY_BASE_URL } from "../config";
import {
  getFinalizedLearningEntriesMock,
  getInstructorClassUnitProgressMock,
  getInstructorPermittedStudentsMock,
  getInstructorStudentFinalLearningEntriesMock,
  getInstructorStudentLearningEntriesMock,
  getInstructorStudentPrimmSubmissionsMock,
  getReflectionDraftVersionsMock,
  getStudentDetailedProgressMock,
  getSubmissionsForAssignmentMock,
  getUserProgressMock,
  submitPrimmEvaluationMock,
  submitReflectionInteractionMock,
  updateUserProgressMock,
} from "../mocks/apiMocks";
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
  ListOfInstructorStudentsResponse,
  ClassUnitProgressResponse,
  ListOfAssignmentSubmissionsResponse,
} from "../types/apiServiceTypes";
import {
  UserId,
  LessonId,
  SectionId,
  UnitId,
  AccessTokenId,
  RefreshTokenId,
} from "../types/data";

export const USE_MOCKED_API = false;

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
  if (USE_MOCKED_API) {
    return getUserProgressMock();
  }

  const response = await fetchWithAuth(`${apiGatewayUrl}/progress`);
  return handleApiResponse(response);
}

export async function updateUserProgress(
  apiGatewayUrl: string,
  batchInput: BatchCompletionsInput
): Promise<UserProgressData> {
  if (USE_MOCKED_API) {
    return updateUserProgressMock(batchInput);
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
  if (USE_MOCKED_API) {
    return submitReflectionInteractionMock(lessonId, sectionId, submissionData);
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
  if (USE_MOCKED_API) {
    return getReflectionDraftVersionsMock(lessonId, sectionId);
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
  if (USE_MOCKED_API) {
    return getFinalizedLearningEntriesMock();
  }

  const response = await fetchWithAuth(`${apiGatewayUrl}/learning-entries`);
  return handleApiResponse(response);
}

export async function submitPrimmEvaluation(
  apiGatewayUrl: string,
  payload: PrimmEvaluationRequest
): Promise<PrimmEvaluationResponse> {
  if (USE_MOCKED_API) {
    return submitPrimmEvaluationMock(payload);
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
    return getInstructorPermittedStudentsMock();
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
    return getInstructorClassUnitProgressMock(unitId, studentIds);
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
    return getSubmissionsForAssignmentMock(
      unitId,
      lessonId,
      sectionId,
      assignmentType,
      primmExampleId
    );
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
    return getInstructorStudentLearningEntriesMock(studentId);
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
    return getInstructorStudentFinalLearningEntriesMock(studentId);
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
    return getInstructorStudentPrimmSubmissionsMock(studentId);
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
    return getStudentDetailedProgressMock(studentId);
  }

  const endpoint = `${apiGatewayUrl}/instructor/students/${studentId}/detailed-progress`;
  const response = await fetchWithAuth(endpoint);
  return handleApiResponse(response);
}
