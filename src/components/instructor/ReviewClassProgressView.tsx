import React, { useState, useEffect, useMemo } from "react";
import * as apiService from "../../lib/apiService";
import { useAuthStore } from "../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../config";
import type {
  InstructorStudentInfo,
  StudentLessonProgressItem,
  // ClassUnitProgressResponse, // This is the API response type
} from "../../types/apiServiceTypes";
import type {
  Unit,
  Lesson,
  LessonId,
  UserId,
  UnitId,
  LessonReference,
} from "../../types/data";
import {
  fetchLessonData,
  getRequiredSectionsForLesson,
} from "../../lib/dataLoader";

import LoadingSpinner from "../LoadingSpinner";
import styles from "../../pages/InstructorDashboardPage.module.css"; // Reuse styles from parent page for now

// Client-side computed structure for display
interface DisplayableStudentUnitProgress {
  studentId: UserId;
  studentName?: string | null;
  lessonsProgress: StudentLessonProgressItem[];
  overallUnitCompletionPercent: number;
}

interface ClientClassLessonSummary {
  lessonId: LessonId; // GUID
  lessonTitle: string;
  averageCompletionPercent: number;
  numStudentsAttempted: number;
  numStudentsCompleted: number;
}

interface ReviewClassProgressViewProps {
  units: Unit[];
  permittedStudents: InstructorStudentInfo[];
  isLoadingStudents: boolean; // Pass loading state from parent
  studentsError: string | null; // Pass error state from parent
  isLoadingUnits: boolean; // Pass loading state from parent
}

const ReviewClassProgressView: React.FC<ReviewClassProgressViewProps> = ({
  units,
  permittedStudents,
  isLoadingStudents,
  studentsError,
  isLoadingUnits,
}) => {
  const { idToken, isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const [selectedUnitId, setSelectedUnitId] = useState<UnitId>("" as UnitId);
  const [selectedUnitObject, setSelectedUnitObject] = useState<Unit | null>(
    null
  );
  const [selectedUnitLessons, setSelectedUnitLessons] = useState<
    (Lesson & { guid: LessonId })[]
  >([]);

  const [displayableClassProgress, setDisplayableClassProgress] = useState<
    DisplayableStudentUnitProgress[]
  >([]);
  const [isLoadingClassProgress, setIsLoadingClassProgress] =
    useState<boolean>(false);
  const [classProgressError, setClassProgressError] = useState<string | null>(
    null
  );

  // Set default unit if units are loaded and none is selected
  useEffect(() => {
    if (units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
    }
  }, [units, selectedUnitId]);

  // Fetch lessons for the selected unit AND then fetch class progress
  useEffect(() => {
    if (
      !selectedUnitId ||
      !isAuthenticated ||
      !idToken ||
      !apiGatewayUrl ||
      units.length === 0
    ) {
      setDisplayableClassProgress([]);
      setSelectedUnitLessons([]);
      setSelectedUnitObject(null);
      return;
    }

    const fetchUnitAndProgressDetails = async () => {
      setIsLoadingClassProgress(true);
      setClassProgressError(null);

      try {
        const currentUnitData = units.find((u) => u.id === selectedUnitId);
        if (!currentUnitData) {
          if (units.length > 0)
            throw new Error(`Unit details not found for ${selectedUnitId}`);
          else {
            setIsLoadingClassProgress(false);
            return;
          }
        }
        setSelectedUnitObject(currentUnitData);

        const lessonPromises = currentUnitData.lessons.map(
          (lessonRef: LessonReference) => fetchLessonData(lessonRef.path) // Use lessonRef.id (which is the GUID)
        );
        const lessonsForUnitRaw = (await Promise.all(lessonPromises)).filter(
          (l): l is Lesson => l !== null
        );
        setSelectedUnitLessons(
          lessonsForUnitRaw.map((l) => ({ ...l, guid: l.guid }))
        );

        if (
          lessonsForUnitRaw.length === 0 ||
          (permittedStudents.length === 0 && !isLoadingStudents)
        ) {
          setIsLoadingClassProgress(false);
          setDisplayableClassProgress([]);
          return;
        }

        const studentIdsToFetchFor = permittedStudents.map(
          (s) => s.studentId as UserId
        );
        const classProgressResponse =
          await apiService.getInstructorClassUnitProgress(
            idToken!,
            apiGatewayUrl!,
            selectedUnitId,
            studentIdsToFetchFor
          );

        const computedProgress: DisplayableStudentUnitProgress[] =
          classProgressResponse.studentProgressData.map((studentData) => {
            const studentInfo = permittedStudents.find(
              (ps) => ps.studentId === studentData.studentId
            );
            let totalCompletedInUnit = 0;
            let totalRequiredInUnit = 0;

            const lessonsProgress: StudentLessonProgressItem[] =
              lessonsForUnitRaw.map((lesson) => {
                const requiredSections = getRequiredSectionsForLesson(lesson);
                const totalRequiredInLesson = requiredSections.length;
                const completedSectionsMapForLesson =
                  studentData.completedSectionsInUnit[lesson.guid] || {};
                const completedInLessonCount = Object.keys(
                  completedSectionsMapForLesson
                ).length;
                const cappedCompletedCount = Math.min(
                  completedInLessonCount,
                  totalRequiredInLesson
                );

                totalCompletedInUnit += cappedCompletedCount;
                totalRequiredInUnit += totalRequiredInLesson;
                const completionPercent =
                  totalRequiredInLesson > 0
                    ? (cappedCompletedCount / totalRequiredInLesson) * 100
                    : requiredSections.length === 0
                    ? 100
                    : 0;

                return {
                  lessonId: lesson.guid,
                  lessonTitle: lesson.title,
                  completionPercent: parseFloat(completionPercent.toFixed(1)),
                  isCompleted: completionPercent >= 100,
                  completedSectionsCount: cappedCompletedCount,
                  totalRequiredSectionsInLesson: totalRequiredInLesson,
                };
              });
            const overallUnitCompletionPercent =
              totalRequiredInUnit > 0
                ? (totalCompletedInUnit / totalRequiredInUnit) * 100
                : currentUnitData.lessons.length === 0
                ? 100
                : 0;

            return {
              studentId: studentData.studentId as UserId,
              studentName: studentInfo?.studentName,
              lessonsProgress,
              overallUnitCompletionPercent: parseFloat(
                overallUnitCompletionPercent.toFixed(1)
              ),
            };
          });
        setDisplayableClassProgress(computedProgress);
      } catch (err) {
        console.error(
          `Failed to fetch class progress for unit ${selectedUnitId}:`,
          err
        );
        if (err instanceof apiService.ApiError) {
          setClassProgressError(`Error: ${err.data.message || err.message}`);
        } else if (err instanceof Error) {
          setClassProgressError(`Error: ${err.message}`);
        } else {
          setClassProgressError("An unknown error occurred.");
        }
        setSelectedUnitLessons([]);
        setSelectedUnitObject(null);
        setDisplayableClassProgress([]);
      } finally {
        setIsLoadingClassProgress(false);
      }
    };

    if (
      selectedUnitId &&
      units.length > 0 &&
      (permittedStudents.length > 0 || isLoadingStudents) &&
      idToken &&
      apiGatewayUrl
    ) {
      fetchUnitAndProgressDetails();
    } else if (
      selectedUnitId &&
      permittedStudents.length === 0 &&
      !isLoadingStudents
    ) {
      setDisplayableClassProgress([]);
      setIsLoadingClassProgress(false);
    }
  }, [
    selectedUnitId,
    permittedStudents,
    isLoadingStudents,
    isAuthenticated,
    idToken,
    apiGatewayUrl,
    units,
  ]);

  const classLessonSummaries: ClientClassLessonSummary[] = useMemo(() => {
    if (!selectedUnitLessons.length || !displayableClassProgress.length)
      return [];
    return selectedUnitLessons.map((lesson) => {
      let totalPercentSum = 0;
      let attemptedCount = 0;
      let completedCount = 0;
      let validStudentProgressCount = 0;
      displayableClassProgress.forEach((studentDisplayProgress) => {
        const lessonProg = studentDisplayProgress.lessonsProgress.find(
          (lp) => lp.lessonId === lesson.guid
        );
        if (lessonProg) {
          totalPercentSum += lessonProg.completionPercent;
          validStudentProgressCount++;
          if (
            lessonProg.completionPercent > 0 ||
            lessonProg.completedSectionsCount > 0
          ) {
            attemptedCount++;
          }
          if (lessonProg.isCompleted) {
            completedCount++;
          }
        }
      });
      return {
        lessonId: lesson.guid,
        lessonTitle: lesson.title,
        averageCompletionPercent:
          validStudentProgressCount > 0
            ? parseFloat(
                (totalPercentSum / validStudentProgressCount).toFixed(1)
              )
            : 0,
        numStudentsAttempted: attemptedCount,
        numStudentsCompleted: completedCount,
      };
    });
  }, [selectedUnitLessons, displayableClassProgress]);

  const getCellBackgroundColor = (percent: number): string => {
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    const baseOpacity = 0.1;
    const safePercent = percent === null ? 0 : percent;
    const opacity =
      safePercent > 0
        ? baseOpacity + (safePercent / 100) * 0.6
        : safePercent === 0
        ? 0.05
        : 0;
    if (safePercent === 0 && safePercent !== null)
      return `rgba(255, 100, 100, ${baseOpacity})`;
    return `rgba(70, 180, 70, ${opacity})`;
  };

  const renderProgressTableView = () => {
    if (isLoadingClassProgress && displayableClassProgress.length === 0)
      return <LoadingSpinner message="Loading class progress..." />;
    if (classProgressError)
      return <p className={styles.errorMessage}>{classProgressError}</p>;
    if (!selectedUnitId && units.length > 0)
      return (
        <p className={styles.placeholderMessage}>
          Please select a unit to view progress.
        </p>
      );
    if (isLoadingUnits && units.length === 0)
      return <LoadingSpinner message="Loading units..." />; // Changed from allUnits
    if (!isLoadingUnits && units.length === 0)
      return <p className={styles.placeholderMessage}>No units available.</p>;
    if (permittedStudents.length === 0 && !isLoadingStudents)
      return (
        <p className={styles.placeholderMessage}>
          No students assigned to view.
        </p>
      );
    if (
      selectedUnitLessons.length === 0 &&
      !isLoadingClassProgress &&
      !classProgressError &&
      selectedUnitId
    )
      return (
        <p className={styles.placeholderMessage}>
          Selected unit has no lessons defined.
        </p>
      );
    if (
      displayableClassProgress.length === 0 &&
      !isLoadingClassProgress &&
      !classProgressError &&
      permittedStudents.length > 0 &&
      selectedUnitId
    )
      return (
        <p className={styles.placeholderMessage}>
          No progress data available for students in this unit.
        </p>
      );
    if (displayableClassProgress.length === 0 && isLoadingClassProgress)
      return <LoadingSpinner message="Loading class progress..." />;

    return (
      <div className={styles.progressTableContainer}>
        <table className={styles.progressTable}>
          <thead>
            <tr>
              <th>Student</th>
              {selectedUnitLessons.map((lesson) => (
                <th key={lesson.guid} title={lesson.guid}>
                  {lesson.title}
                </th>
              ))}
              <th>Unit Avg.</th>
            </tr>
          </thead>
          <tbody>
            {displayableClassProgress.map((studentProgress) => (
              <tr key={studentProgress.studentId}>
                <td className={styles.studentNameCell}>
                  {studentProgress.studentName || studentProgress.studentId}
                </td>
                {selectedUnitLessons.map((lesson) => {
                  const lessonProg = studentProgress.lessonsProgress.find(
                    (lp) => lp.lessonId === lesson.guid
                  );
                  const percent = lessonProg ? lessonProg.completionPercent : 0;
                  const cellTitle = lessonProg
                    ? `${lessonProg.completedSectionsCount}/${
                        lessonProg.totalRequiredSectionsInLesson
                      } sections (${percent.toFixed(0)}%)`
                    : "0% completed";
                  return (
                    <td
                      key={`${studentProgress.studentId}-${lesson.guid}`}
                      style={{
                        backgroundColor: getCellBackgroundColor(percent),
                      }}
                      title={cellTitle}
                      className={
                        lessonProg?.isCompleted ? styles.completedCell : ""
                      }
                    >
                      {percent.toFixed(0)}%
                    </td>
                  );
                })}
                <td
                  style={{
                    fontWeight: "bold",
                    backgroundColor: getCellBackgroundColor(
                      studentProgress.overallUnitCompletionPercent
                    ),
                  }}
                >
                  {studentProgress.overallUnitCompletionPercent.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderClassSummaryView = () => {
    if (
      !selectedUnitId ||
      isLoadingClassProgress ||
      classProgressError ||
      classLessonSummaries.length === 0
    )
      return null;
    const unitTitle = selectedUnitObject?.title || selectedUnitId;
    return (
      <div className={styles.classSummarySection}>
        <h4>
          Unit Summary: {unitTitle} ({displayableClassProgress.length}{" "}
          student(s) in view)
        </h4>
        <ul className={styles.summaryList}>
          {classLessonSummaries.map((summary) => (
            <li key={summary.lessonId}>
              <strong>{summary.lessonTitle}:</strong> Avg.{" "}
              {summary.averageCompletionPercent}% completion (
              {summary.numStudentsCompleted} of {summary.numStudentsAttempted}{" "}
              attempted completed)
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      <section className={styles.controlSection}>
        <h2>Class Progress Overview</h2>
        {isLoadingStudents && units.length === 0 && (
          <LoadingSpinner message="Loading initial data..." />
        )}
        {studentsError && (
          <p className={styles.errorMessage}>{studentsError}</p>
        )}

        {!isLoadingStudents && !studentsError && (
          <div className={styles.unitSelectorContainer}>
            <label htmlFor="unit-select">Select Unit: </label>
            <select
              id="unit-select"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value as UnitId)}
              className={styles.unitSelect}
              disabled={units.length === 0 || isLoadingUnits}
            >
              <option value="" disabled={selectedUnitId !== ""}>
                -- Choose a Unit --
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>
      {isLoadingUnits && !selectedUnitId && (
        <LoadingSpinner message="Loading units..." />
      )}
      {renderClassSummaryView()}
      {renderProgressTableView()}
    </>
  );
};

export default ReviewClassProgressView;
