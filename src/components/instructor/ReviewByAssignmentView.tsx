import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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

  // State for the UI
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
    lessons: false,
    submissions: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Hook to read and write URL query parameters (e.g., ?unit=...&lesson=...)
  const [searchParams, setSearchParams] = useSearchParams();

  // This effect loads lessons when the selected unit changes
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
          .catch((err) =>
            setError("Failed to load lessons for assignment list.")
          )
          .finally(() =>
            setIsLoadingState((prev) => ({ ...prev, lessons: false }))
          );
      }
    } else {
      setLessonsInSelectedUnit([]);
    }
    // When the unit changes, we reset the assignment selection
    setSelectedAssignmentKey(null);
    setSubmissions([]);
    setError(null);
  }, [selectedUnitId, units]);

  // This effect computes the list of available assignments from the loaded lessons
  const assignmentsInUnit: DisplayableAssignment[] = useMemo(() => {
    if (!selectedUnitId || !lessonsInSelectedUnit.length) return [];
    // ... (logic to generate assignments list from lessons)
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
                  assignmentDisplayTitle: `PRIMM: ${section.title} (in Lesson: ${lesson.title})`,
                });
              }
            );
          }
        });
      }
    });
    return displayableAssignments;
  }, [selectedUnitId, lessonsInSelectedUnit, units]);

  // This new useEffect hook keeps the component's state in sync with the URL
  useEffect(() => {
    const unitIdFromUrl = searchParams.get("unit") as UnitId;
    const lessonIdFromUrl = searchParams.get("lesson");

    // If the URL has a unit, make sure our dropdown matches
    if (unitIdFromUrl && unitIdFromUrl !== selectedUnitId) {
      setSelectedUnitId(unitIdFromUrl);
    }

    // If the URL has a lesson, find its corresponding assignment and select it
    if (lessonIdFromUrl && assignmentsInUnit.length > 0) {
      const targetAssignment = assignmentsInUnit.find(
        (a) => a.lessonId === lessonIdFromUrl
      );
      if (targetAssignment && targetAssignment.key !== selectedAssignmentKey) {
        setSelectedAssignmentKey(targetAssignment.key);
      }
    } else if (!lessonIdFromUrl) {
      setSelectedAssignmentKey(null);
    }
  }, [searchParams, selectedUnitId, assignmentsInUnit, selectedAssignmentKey]);

  const fetchSubmissionsForSelectedAssignment = useCallback(
    async (assignment: DisplayableAssignment) => {
      // ... (this function's internal logic is unchanged)
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

  useEffect(() => {
    const assignment = assignmentsInUnit.find(
      (a) => a.key === selectedAssignmentKey
    );
    if (assignment) {
      fetchSubmissionsForSelectedAssignment(assignment);
    } else {
      setSubmissions([]);
    }
  }, [
    selectedAssignmentKey,
    assignmentsInUnit,
    fetchSubmissionsForSelectedAssignment,
  ]);

  // These handlers now update the URL, which triggers the useEffect above to update state
  const handleUnitSelectionChange = (newUnitId: UnitId | "") => {
    setSearchParams(newUnitId ? { unit: newUnitId } : {});
  };

  const handleAssignmentSelection = (assignmentKey: string) => {
    const assignment = assignmentsInUnit.find((a) => a.key === assignmentKey);
    if (assignment) {
      setSearchParams({ unit: assignment.unitId, lesson: assignment.lessonId });
    }
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
          onChange={(e) =>
            handleUnitSelectionChange(e.target.value as UnitId | "")
          }
          className={styles.filterSelect}
          disabled={units.length === 0}
        >
          <option value="">-- Select Unit --</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading.lessons && selectedUnitId && (
        <LoadingSpinner message="Loading assignments..." />
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
                lessonTitle={selectedAssignmentDetails.lessonTitle}
                sectionId={selectedAssignmentDetails.sectionId}
              />
            ) : null}

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
    </div>
  );
};

export default ReviewByAssignmentView;
