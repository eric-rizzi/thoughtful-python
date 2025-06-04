import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Unit,
  Lesson,
  LessonId,
  PRIMMSectionData,
  DisplayableAssignment,
  UnitId,
} from "../../types/data";
import type {
  AssignmentSubmission,
  InstructorStudentInfo,
  ReflectionVersionItem,
  StoredPrimmSubmissionItem,
} from "../../types/apiServiceTypes";
import * as dataLoader from "../../lib/dataLoader";
import * as apiService from "../../lib/apiService";
import { useAuthStore } from "../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../config";
import LoadingSpinner from "../LoadingSpinner";
import styles from "./InstructorViews.module.css";

import RenderReflectionVersions from "./shared/RenderReflectionVersions";
import RenderPrimmActivity from "./shared/RenderPrimmActivity";

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
        setLessonsInSelectedUnit([]);
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
    setSelectedAssignmentKey(null);
    setSubmissions([]);
    setError(null);
  }, [selectedUnitId, units]);

  // Memoize the list of displayable assignments
  const assignmentsInUnit: DisplayableAssignment[] = useMemo(() => {
    if (!selectedUnitId || !lessonsInSelectedUnit.length) return [];
    const displayableAssignments: DisplayableAssignment[] = [];
    const unit = units.find((u) => u.id === selectedUnitId);
    if (!unit) return [];

    lessonsInSelectedUnit.forEach((lesson) => {
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
  );

  // Auto-load submissions when selectedAssignmentKey changes and is valid
  useEffect(() => {
    const assignment = assignmentsInUnit.find(
      (a) => a.key === selectedAssignmentKey
    );
    if (assignment) {
      fetchSubmissionsForSelectedAssignment(assignment);
    } else {
      setSubmissions([]); // Clear if no valid assignment selected
    }
  }, [
    selectedAssignmentKey,
    assignmentsInUnit,
    fetchSubmissionsForSelectedAssignment,
  ]);

  const handleAssignmentSelection = (assignmentKey: string) => {
    setSelectedAssignmentKey(assignmentKey);
    // Submissions will be fetched by the useEffect above
  };

  const currentSubmissionData = submissions[currentSubmissionIndex];
  const currentStudentInfo = permittedStudents.find(
    (s) => s.studentId === currentSubmissionData?.studentId
  );
  const selectedAssignmentDetails = assignmentsInUnit.find(
    (a) => a.key === selectedAssignmentKey
  );

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
        currentSubmissionData &&
        selectedAssignmentDetails && (
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

            {selectedAssignmentDetails.assignmentType === "Reflection" ? (
              <RenderReflectionVersions
                versions={
                  currentSubmissionData.submissionDetails as ReflectionVersionItem[]
                }
                studentName={currentStudentInfo?.studentName}
                lessonGuid={selectedAssignmentDetails.lessonId}
                sectionId={selectedAssignmentDetails.sectionId}
              />
            ) : selectedAssignmentDetails.assignmentType === "PRIMM" ? (
              <RenderPrimmActivity
                submission={
                  currentSubmissionData.submissionDetails as StoredPrimmSubmissionItem
                }
                studentName={currentStudentInfo?.studentName}
                lessonTitle={selectedAssignmentDetails.sectionTitle}
                sectionId={selectedAssignmentDetails.sectionId}
              />
            ) : (
              <p>Selected assignment type not recognized for display.</p>
            )}

            {submissions.length > 1 && (
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
        selectedAssignmentKey &&
        submissions.length === 0 &&
        !error && (
          <p className={styles.placeholderMessage}>
            Select an assignment or no submissions yet for the current
            selection.
          </p>
        )}
    </div>
  );
};

export default ReviewByAssignmentView;
