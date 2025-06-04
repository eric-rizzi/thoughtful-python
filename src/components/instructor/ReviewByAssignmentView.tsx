import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Unit,
  Lesson,
  LessonId,
  SectionId,
  AnyLessonSectionData,
  PRIMMCodeExample,
  PRIMMSectionData,
  ReflectionSectionData,
  InstructorStudentInfo,
  DisplayableAssignment,
  UnitId,
} from "../../types/data";
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

// Helper to display Iterative Reflection details
const IterativeReflectionDisplay: React.FC<{
  versions: ReflectionVersionItem[];
  studentName?: string | null;
}> = ({ versions, studentName }) => {
  if (!versions || versions.length === 0) {
    return (
      <p className={styles.placeholderMessage}>
        No reflection versions available for this student on this assignment.
      </p>
    );
  }

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const finalOrLatestVersion =
    sortedVersions.find((v) => v.isFinal) || sortedVersions[0];

  return (
    <div className={styles.submissionDetailCard}>
      <h4>Reflection Topic: {finalOrLatestVersion.userTopic}</h4>
      <p>
        <strong>Student:</strong> {studentName || finalOrLatestVersion.userId}
      </p>
      <p>
        <strong>Latest Activity:</strong>{" "}
        {new Date(finalOrLatestVersion.createdAt).toLocaleString()}
      </p>
      <Link
        to={`/lesson/${finalOrLatestVersion.lessonId}#${finalOrLatestVersion.sectionId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.contextLink}
      >
        View Original Section
      </Link>

      <div className={styles.iterationsContainer} style={{ marginTop: "1rem" }}>
        <h5>Version History (Newest First):</h5>
        {sortedVersions.map((version, index) => (
          <details
            key={version.versionId}
            className={styles.iterationDetail}
            open={index === 0}
          >
            <summary>
              Version {sortedVersions.length - index} (
              {version.isFinal ? "Final" : "Draft"}) -{" "}
              {new Date(version.createdAt).toLocaleDateString()}
              {version.aiAssessment && (
                <span
                  className={`${styles.assessmentLabelSmall} ${
                    styles[
                      "assessment" +
                        version.aiAssessment.charAt(0).toUpperCase() +
                        version.aiAssessment.slice(1)
                    ]
                  }`}
                >
                  {version.aiAssessment.toUpperCase()}
                </span>
              )}
            </summary>
            <div
              className={styles.submissionDetailCard}
              style={{ borderTop: "1px solid #eee", marginTop: "0.5rem" }}
            >
              <p>
                <strong>Submitted:</strong>{" "}
                {new Date(version.createdAt).toLocaleString()}
              </p>
              <div>
                <strong>Code:</strong>
                <pre>
                  <code>{version.userCode}</code>
                </pre>
              </div>
              <div>
                <strong>Explanation:</strong>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {version.userExplanation}
                </ReactMarkdown>
              </div>
              {version.aiAssessment && (
                <div className={styles.aiFeedbackBlock}>
                  <strong>AI Assessment:</strong>
                  <span
                    className={`${styles.assessmentLabel} ${
                      styles[
                        "assessment" +
                          version.aiAssessment.charAt(0).toUpperCase() +
                          version.aiAssessment.slice(1)
                      ]
                    }`}
                  >
                    {version.aiAssessment.toUpperCase()}
                  </span>
                  {version.aiFeedback && (
                    <p className={styles.feedbackText}>
                      <em>{version.aiFeedback}</em>
                    </p>
                  )}
                </div>
              )}
              {!version.aiAssessment && (
                <p>
                  <em>No AI feedback recorded for this version.</em>
                </p>
              )}
              {version.isFinal && (
                <p
                  style={{
                    fontWeight: "bold",
                    color: "green",
                    marginTop: "0.5rem",
                  }}
                >
                  This is the finalized Learning Entry.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
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
  const [lessonsInSelectedUnit, setLessonsInSelectedUnit] = useState<
    (Lesson & { guid: LessonId })[]
  >([]);

  // New state for the selected assignment from the flattened list
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState<
    string | null
  >(null);

  const [submissions, setSubmissions] = useState<
    AssignmentSubmission<"Reflection" | "PRIMM">[]
  >([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [isLoading, setIsLoadingState] = useState({
    units: false,
    lessons: false,
    submissions: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Effect to load lessons when a unit is selected (to build assignmentsInUnit)
  useEffect(() => {
    if (selectedUnitId) {
      const unit = units.find((u) => u.id === selectedUnitId);
      if (unit) {
        setIsLoadingState((prev) => ({ ...prev, lessons: true }));
        setLessonsInSelectedUnit([]); // Clear previous lessons
        Promise.all(
          unit.lessons.map((lr) => dataLoader.fetchLessonData(lr.path))
        )
          .then((loadedLessons) => {
            setLessonsInSelectedUnit(
              loadedLessons.filter((l) => l !== null) as (Lesson & {
                guid: LessonId;
              })[]
            );
          })
          .catch((err) => {
            setError("Failed to load lessons for assignment list.");
            console.error(err);
          })
          .finally(() =>
            setIsLoadingState((prev) => ({ ...prev, lessons: false }))
          );
      }
    } else {
      setLessonsInSelectedUnit([]);
    }
    // Reset selections when unit changes
    setSelectedAssignmentKey(null);
    setSubmissions([]);
    setError(null);
  }, [selectedUnitId, units]);

  // Auto-load submissions when selectedAssignmentKey changes
  useEffect(() => {
    const assignment = assignmentsInUnit.find(
      (a) => a.key === selectedAssignmentKey
    );
    if (assignment) {
      fetchSubmissionsForSelectedAssignment(assignment);
    } else {
      setSubmissions([]); // Clear submissions if no assignment is selected
    }
  }, [selectedAssignmentKey]); // Removed fetchSubmissionsForSelectedAssignment from deps, it's stable

  const assignmentsInUnit: DisplayableAssignment[] = useMemo(() => {
    if (!selectedUnitId || !lessonsInSelectedUnit.length) return [];
    const displayableAssignments: DisplayableAssignment[] = [];
    const unit = units.find((u) => u.id === selectedUnitId); // Should always find if lessonsInSelectedUnit is populated
    if (!unit) return [];

    lessonsInSelectedUnit.forEach((lesson) => {
      // lesson already has .guid
      if (lesson) {
        (lesson.sections || []).forEach((section) => {
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
            ((section as PRIMMSectionData).examples || []).forEach(
              (example) => {
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
    return displayableAssignments;
  }, [selectedUnitId, lessonsInSelectedUnit, units]);

  const handleAssignmentSelection = (assignmentKey: string) => {
    setSelectedAssignmentKey(assignmentKey);
    setCurrentSubmissionIndex(0); // Reset to first student when new assignment selected
  };

  const fetchSubmissionsForSelectedAssignment = useCallback(
    async (assignment: DisplayableAssignment) => {
      if (!isAuthenticated || !idToken || !apiGatewayUrl || !assignment) return;

      setIsLoadingState((prev) => ({ ...prev, submissions: true }));
      setError(null);
      setSubmissions([]);
      setCurrentSubmissionIndex(0);

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
          setError(
            "No submissions found for this assignment from any student."
          );
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
        setIsLoadingState((prev) => ({ ...prev, submissions: false }));
      }
    },
    [isAuthenticated, idToken, apiGatewayUrl]
  ); // Dependencies for useCallback

  const currentSubmissionData = submissions[currentSubmissionIndex];
  const currentStudentInfo = permittedStudents.find(
    (s) => s.studentId === currentSubmissionData?.studentId
  );
  // Determine selected assignment type for rendering correct display component
  const selectedAssignmentDetails = assignmentsInUnit.find(
    (a) => a.key === selectedAssignmentKey
  );
  const currentDisplayAssignmentType =
    selectedAssignmentDetails?.assignmentType;

  return (
    <div className={styles.viewContainer}>
      <h3>Review by Assignment</h3>
      <div className={styles.filters}>
        <select
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value as UnitId)}
          className={styles.filterSelect}
          disabled={units.length === 0 || isLoading.units}
        >
          <option value="">
            {isLoading.units ? "Loading Units..." : "Select Unit"}
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading.lessons && selectedUnitId && (
        <LoadingSpinner message="Loading assignments for unit..." />
      )}

      {selectedUnitId &&
        !isLoading.lessons &&
        assignmentsInUnit.length === 0 && (
          <p className={styles.placeholderMessage}>
            No reviewable assignments (Reflections/PRIMM) found in this unit.
          </p>
        )}

      {assignmentsInUnit.length > 0 && (
        <div className={styles.assignmentListContainer}>
          <p
            style={{
              padding: "0.5rem 1rem",
              margin: 0,
              fontSize: "0.9em",
              color: "#555",
            }}
          >
            Select an assignment to review submissions:
          </p>
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
                title={`Click to load submissions for: ${assignment.assignmentDisplayTitle}`}
              >
                <span className={styles.assignmentTitle}>
                  {assignment.assignmentDisplayTitle}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading.submissions && (
        <LoadingSpinner message="Loading student submissions..." />
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
                ? ` (Student: ${currentStudentInfo.studentName})`
                : currentSubmissionData.studentId
                ? ` (Student ID: ${currentSubmissionData.studentId})`
                : ""}
            </h4>

            {
              currentDisplayAssignmentType === "Reflection" ? (
                <IterativeReflectionDisplay
                  versions={
                    currentSubmissionData.submissionDetails as ReflectionVersionItem[]
                  }
                  studentName={currentStudentInfo?.studentName}
                />
              ) : currentDisplayAssignmentType === "PRIMM" ? (
                <PrimmSubmissionDisplay
                  submission={
                    currentSubmissionData.submissionDetails as StoredPrimmSubmissionItem
                  }
                  studentName={currentStudentInfo?.studentName}
                />
              ) : (
                selectedAssignmentKey && (
                  <p>Loading details or select an assignment type...</p>
                )
              ) // Fallback if type not yet set but key is
            }

            {submissions.length > 1 && ( // Only show navigation if more than one submission
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
            )}
          </div>
        )}
      {!isLoading.submissions &&
        !error &&
        selectedAssignmentKey &&
        submissions.length === 0 &&
        !error && (
          // This message shows if an assignment is selected, not loading, no error, but API returned empty.
          // The setError in fetchSubmissionsForSelectedAssignment already handles "No submissions found..."
          // So this might be redundant or for a state where fetch hasn't run yet for a selection.
          // Let's rely on the error state from fetch for "no submissions found".
          // This will show if selectedAssignmentKey is set, but fetch hasn't completed or found anything AND didn't set an error.
          <p className={styles.placeholderMessage}>
            Select an assignment or no submissions yet.
          </p>
        )}
    </div>
  );
};

export default ReviewByAssignmentView;
