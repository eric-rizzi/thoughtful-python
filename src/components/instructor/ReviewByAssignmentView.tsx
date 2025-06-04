import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Unit,
  UnitId,
  Lesson,
  LessonId,
  SectionId,
  AnyLessonSectionData,
  PRIMMCodeExample,
  PRIMMSectionData,
  ReflectionSectionData,
  InstructorStudentInfo,
  DisplayableAssignment, // New type for our list
} from "../../types/data"; // Assuming DisplayableAssignment is in data.ts
import type {
  ListOfAssignmentSubmissionsResponse,
  AssignmentSubmission,
  ReflectionVersionItem,
  StoredPrimmSubmissionItem,
  AssessmentLevel,
} from "../../types/apiServiceTypes";
import * as dataLoader from "../../lib/dataLoader";
import * as apiService from "../../lib/apiService";
import { useAuthStore } from "../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../config";
import LoadingSpinner from "../LoadingSpinner";
import styles from "./InstructorViews.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

// --- Submission Display Components (copied from previous ReviewByStudentView for brevity) ---
// These could be moved to a shared file if used by both views identically.
const ReflectionSubmissionDisplay: React.FC<{
  submission: ReflectionVersionItem;
  studentName?: string | null;
}> = ({ submission, studentName }) => {
  return (
    <div className={styles.submissionDetailCard}>
      <h4>Reflection Topic: {submission.userTopic}</h4>
      <p>
        <strong>Student:</strong> {studentName || submission.userId}
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(submission.createdAt).toLocaleString()}
      </p>
      <Link
        to={`/lesson/${submission.lessonId}#${submission.sectionId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.contextLink}
      >
        View Original Section
      </Link>
      <div style={{ marginTop: "0.5rem" }}>
        <strong>Code:</strong>
        <pre>
          <code>{submission.userCode}</code>
        </pre>
      </div>
      <div>
        <strong>Explanation:</strong>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {submission.userExplanation}
        </ReactMarkdown>
      </div>
      {submission.aiAssessment && (
        <div className={styles.aiFeedbackBlock}>
          <strong>AI Assessment:</strong>
          <span
            className={`${styles.assessmentLabel} ${
              styles[
                "assessment" +
                  submission.aiAssessment.charAt(0).toUpperCase() +
                  submission.aiAssessment.slice(1)
              ]
            }`}
          >
            {submission.aiAssessment.toUpperCase()}
          </span>
          {submission.aiFeedback && (
            <p className={styles.feedbackText}>
              <em>{submission.aiFeedback}</em>
            </p>
          )}
        </div>
      )}
      {submission.isFinal && (
        <p style={{ fontWeight: "bold", color: "green", marginTop: "0.5rem" }}>
          This is the finalized Learning Entry.
        </p>
      )}
    </div>
  );
};

const PrimmSubmissionDisplay: React.FC<{
  submission: StoredPrimmSubmissionItem;
  studentName?: string | null;
}> = ({ submission, studentName }) => {
  return (
    <div className={styles.submissionDetailCard}>
      <h4>PRIMM Analysis: Example '{submission.primmExampleId}'</h4>
      <p>
        <strong>Student:</strong> {studentName || submission.userId}
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(submission.timestampIso).toLocaleString()}
      </p>
      <Link
        to={`/lesson/${submission.lessonId}#${submission.sectionId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.contextLink}
      >
        View Original Section & Example
      </Link>
      <div style={{ marginTop: "0.5rem" }}>
        <strong>Code Snippet Analyzed:</strong>
        <pre>
          <code>{submission.codeSnippet}</code>
        </pre>
      </div>
      <p>
        <strong>Prediction Prompt:</strong>{" "}
        {submission.userPredictionPromptText}
      </p>
      <p>
        <strong>User's Prediction:</strong> {submission.userPredictionText}
      </p>
      <p>
        <strong>Confidence:</strong> {submission.userPredictionConfidence}/3
      </p>
      {submission.actualOutputSummary && (
        <p>
          <strong>Actual Output Summary (User Reported):</strong>{" "}
          {submission.actualOutputSummary}
        </p>
      )}
      <p>
        <strong>User's Explanation:</strong>{" "}
        {submission.userExplanationText || "N/A"}
      </p>

      <div className={styles.aiFeedbackBlock}>
        <h5>AI Evaluation:</h5>
        <p>
          <strong>Prediction Assessment:</strong>
          <span
            className={`${styles.assessmentLabel} ${
              styles[
                "assessment" +
                  submission.aiPredictionAssessment.charAt(0).toUpperCase() +
                  submission.aiPredictionAssessment.slice(1)
              ]
            }`}
          >
            {submission.aiPredictionAssessment.toUpperCase()}
          </span>
        </p>
        {submission.aiExplanationAssessment && (
          <p>
            <strong>Explanation Assessment:</strong>
            <span
              className={`${styles.assessmentLabel} ${
                styles[
                  "assessment" +
                    submission.aiExplanationAssessment.charAt(0).toUpperCase() +
                    submission.aiExplanationAssessment.slice(1)
                ]
              }`}
            >
              {submission.aiExplanationAssessment.toUpperCase()}
            </span>
          </p>
        )}
        {submission.aiOverallComment && (
          <p className={styles.feedbackText}>
            <strong>Overall Comment:</strong>{" "}
            <em>{submission.aiOverallComment}</em>
          </p>
        )}
      </div>
    </div>
  );
};
// --- End Submission Display Components ---

interface ReviewByAssignmentViewProps {
  units: Unit[];
  permittedStudents: InstructorStudentInfo[];
}

const ReviewByAssignmentView: React.FC<ReviewByAssignmentViewProps> = ({
  units,
  permittedStudents,
}) => {
  const { idToken, isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const [selectedUnitId, setSelectedUnitId] = useState<UnitId | "">("");
  const [assignmentsInUnit, setAssignmentsInUnit] = useState<
    DisplayableAssignment[]
  >([]);
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState<
    string | null
  >(null); // Use the unique key

  const [submissions, setSubmissions] = useState<
    AssignmentSubmission<"Reflection" | "PRIMM">[]
  >([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState({
    units: false,
    lessons: false,
    submissions: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Populate assignments when unit changes
  useEffect(() => {
    if (selectedUnitId) {
      const unit = units.find((u) => u.id === selectedUnitId);
      if (unit) {
        setIsLoading((prevState) => ({ ...prevState, lessons: true }));
        setAssignmentsInUnit([]); // Clear previous
        setSelectedAssignmentKey(null);
        setSubmissions([]);

        const lessonPromises = unit.lessons.map((lr) =>
          dataLoader.fetchLessonData(lr.path)
        ); // lr.id is GUID
        Promise.all(lessonPromises)
          .then((loadedLessonsFull) => {
            const displayableAssignments: DisplayableAssignment[] = [];
            loadedLessonsFull.forEach((lesson) => {
              if (lesson) {
                // lesson is Lesson object with .guid
                lesson.sections.forEach((section) => {
                  if (section.kind === "Reflection") {
                    displayableAssignments.push({
                      key: `${lesson.guid}-${section.id}-reflection`,
                      unitId: unit.id,
                      lessonId: lesson.guid,
                      lessonTitle: lesson.title,
                      sectionId: section.id,
                      sectionTitle: section.title,
                      assignmentType: "Reflection",
                      assignmentDisplayTitle: `Reflection: "${section.title}" (Lesson: ${lesson.title})`,
                    });
                  } else if (section.kind === "PRIMM") {
                    (section as PRIMMSectionData).examples.forEach(
                      (example, idx) => {
                        displayableAssignments.push({
                          key: `${lesson.guid}-${section.id}-primm-${example.id}`,
                          unitId: unit.id,
                          lessonId: lesson.guid,
                          lessonTitle: lesson.title,
                          sectionId: section.id,
                          sectionTitle: section.title,
                          assignmentType: "PRIMM",
                          primmExampleId: example.id,
                          assignmentDisplayTitle: `PRIMM: Ex. "${example.id}" in "${section.title}" (Lesson: ${lesson.title})`,
                        });
                      }
                    );
                  }
                });
              }
            });
            setAssignmentsInUnit(displayableAssignments);
          })
          .catch((err) => {
            console.error("Error loading lessons for unit assignments:", err);
            setError("Failed to load assignments for the selected unit.");
          })
          .finally(() =>
            setIsLoading((prevState) => ({ ...prevState, lessons: false }))
          );
      }
    } else {
      setAssignmentsInUnit([]);
      setSelectedAssignmentKey(null);
      setSubmissions([]);
    }
  }, [selectedUnitId, units]);

  const handleAssignmentSelection = (assignmentKey: string) => {
    setSelectedAssignmentKey(assignmentKey);
    setSubmissions([]); // Clear previous submissions
    setCurrentSubmissionIndex(0);
    setError(null);
    // Automatically load submissions when an assignment is selected
    const assignment = assignmentsInUnit.find((a) => a.key === assignmentKey);
    if (assignment) {
      fetchSubmissionsForSelectedAssignment(assignment);
    }
  };

  const fetchSubmissionsForSelectedAssignment = useCallback(
    async (assignment: DisplayableAssignment) => {
      if (!isAuthenticated || !idToken || !apiGatewayUrl || !assignment) return;

      setIsLoading((prevState) => ({ ...prevState, submissions: true }));
      setError(null);

      try {
        const response = await apiService.getSubmissionsForAssignment(
          idToken,
          apiGatewayUrl,
          assignment.unitId,
          assignment.lessonId,
          assignment.sectionId,
          assignment.assignmentType,
          assignment.primmExampleId
        );
        setSubmissions(response.submissions);
        if (response.submissions.length === 0) {
          setError("No submissions found for this assignment.");
        }
      } catch (err) {
        console.error("Failed to fetch assignment submissions:", err);
        if (err instanceof apiService.ApiError) {
          setError(
            `Error fetching submissions: ${err.data.message || err.message}`
          );
        } else if (err instanceof Error) {
          setError(`Error fetching submissions: ${err.message}`);
        } else {
          setError("An unknown error occurred while fetching submissions.");
        }
      } finally {
        setIsLoading((prevState) => ({ ...prevState, submissions: false }));
      }
    },
    [isAuthenticated, idToken, apiGatewayUrl]
  );

  const currentSubmissionData = submissions[currentSubmissionIndex];
  const currentStudentInfo = permittedStudents.find(
    (s) => s.studentId === currentSubmissionData?.studentId
  );

  return (
    <div className={styles.viewContainer}>
      <h3>Review by Assignment</h3>
      <div className={styles.filters}>
        <select
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value as UnitId)}
          className={styles.filterSelect}
        >
          <option value="">Select Unit</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.title}
            </option>
          ))}
        </select>
        {/* The "Load Submissions" button is removed; loading happens on assignment click */}
      </div>

      {isLoading.lessons && <LoadingSpinner message="Loading assignments..." />}

      {selectedUnitId &&
        !isLoading.lessons &&
        assignmentsInUnit.length === 0 && (
          <p className={styles.placeholderMessage}>
            No reviewable assignments (Reflections/PRIMM) found in this unit.
          </p>
        )}

      {assignmentsInUnit.length > 0 && (
        <div className={styles.assignmentListContainer}>
          <ul className={styles.assignmentList}>
            {assignmentsInUnit.map((assignment) => (
              <li
                key={assignment.key}
                className={`${styles.assignmentListItem} ${
                  selectedAssignmentKey === assignment.key
                    ? styles.selected
                    : ""
                }`}
                onClick={() => handleAssignmentSelection(assignment.key)}
              >
                <span className={styles.assignmentTitle}>
                  {assignment.assignmentDisplayTitle}
                </span>
                <span className={styles.assignmentMeta}>
                  Type: {assignment.assignmentType}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading.submissions && (
        <LoadingSpinner message="Loading submissions..." />
      )}
      {error && !isLoading.submissions && (
        <p className={styles.errorMessage}>{error}</p>
      )}

      {!isLoading.submissions &&
        !error &&
        submissions.length > 0 &&
        currentSubmissionData && (
          <div className={styles.submissionViewer}>
            <h4>
              Viewing Submission {currentSubmissionIndex + 1} of{" "}
              {submissions.length}
              {currentStudentInfo?.studentName
                ? ` (${currentStudentInfo.studentName})`
                : ` (Student ID: ${currentSubmissionData.studentId})`}
            </h4>

            {currentSubmissionData.submissionDetails.hasOwnProperty(
              "userTopic"
            ) ? ( // Heuristic for Reflection
              <ReflectionSubmissionDisplay
                submission={
                  currentSubmissionData.submissionDetails as ReflectionVersionItem
                }
                studentName={currentStudentInfo?.studentName}
              />
            ) : currentSubmissionData.submissionDetails.hasOwnProperty(
                "primmExampleId"
              ) ? ( // Heuristic for PRIMM
              <PrimmSubmissionDisplay
                submission={
                  currentSubmissionData.submissionDetails as StoredPrimmSubmissionItem
                }
                studentName={currentStudentInfo?.studentName}
              />
            ) : (
              <p>Selected assignment type not recognized for display.</p>
            )}

            <div className={styles.navigationButtons}>
              <button
                onClick={() =>
                  setCurrentSubmissionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentSubmissionIndex === 0}
              >
                &larr; Previous Student
              </button>
              <span>
                Student {currentSubmissionIndex + 1} / {submissions.length}
              </span>
              <button
                onClick={() =>
                  setCurrentSubmissionIndex((prev) =>
                    Math.min(submissions.length - 1, prev + 1)
                  )
                }
                disabled={currentSubmissionIndex >= submissions.length - 1}
              >
                Next Student &rarr;
              </button>
            </div>
          </div>
        )}
      {!isLoading.submissions &&
        !error &&
        selectedAssignmentKey &&
        submissions.length === 0 && (
          // This message is covered by setError in fetchSubmissions if API returns empty.
          // If fetchSubmissions itself isn't called yet, this won't show.
          // The error state handles "No submissions found".
          <p className={styles.placeholderMessage}>
            Awaiting submissions or none found for the selected assignment.
          </p>
        )}
    </div>
  );
};

export default ReviewByAssignmentView;
