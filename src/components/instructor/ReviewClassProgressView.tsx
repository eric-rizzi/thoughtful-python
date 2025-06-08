import React, { useState, useEffect, useMemo } from "react";
import * as apiService from "../../lib/apiService";
import { Link } from "react-router-dom";
import { hasReviewableAssignments } from "../../lib/dataLoader";
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
  fetchLessonData, // Assuming this fetches a single Lesson object by its GUID
  getRequiredSectionsForLesson,
} from "../../lib/dataLoader";

import LoadingSpinner from "../LoadingSpinner";
// Changed to use InstructorViews.module.css for consistent select styling
import styles from "./InstructorViews.module.css";

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
  isLoadingUnitsGlobal: boolean;
  isLoadingStudentsGlobal: boolean;
  studentsErrorGlobal: string | null;
}

const ReviewClassProgressView: React.FC<ReviewClassProgressViewProps> = ({
  units,
  permittedStudents,
  isLoadingUnitsGlobal,
  isLoadingStudentsGlobal,
  studentsErrorGlobal,
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
  const [isLoadingClassProgressLocal, setIsLoadingClassProgressLocal] =
    useState<boolean>(false);
  const [classProgressErrorLocal, setClassProgressErrorLocal] = useState<
    string | null
  >(null);

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
      if (units.length > 0 && !selectedUnitId)
        setIsLoadingClassProgressLocal(false);
      return;
    }

    const fetchUnitAndProgressDetails = async () => {
      setIsLoadingClassProgressLocal(true);
      setClassProgressErrorLocal(null);

      try {
        const currentUnitData = units.find((u) => u.id === selectedUnitId);
        if (!currentUnitData) {
          if (units.length > 0)
            throw new Error(`Unit details not found for ${selectedUnitId}`);
          else {
            setIsLoadingClassProgressLocal(false);
            return;
          }
        }
        setSelectedUnitObject(currentUnitData);

        const lessonPromises = currentUnitData.lessons.map(
          (lessonRef: LessonReference) => fetchLessonData(lessonRef.path)
        );
        const lessonsForUnitRaw = (await Promise.all(lessonPromises)).filter(
          (l): l is Lesson => l !== null
        );
        setSelectedUnitLessons(
          lessonsForUnitRaw.map((l) => ({ ...l, guid: l.guid }))
        );

        if (
          lessonsForUnitRaw.length === 0 ||
          (permittedStudents.length === 0 && !isLoadingStudentsGlobal)
        ) {
          setIsLoadingClassProgressLocal(false);
          setDisplayableClassProgress([]);
          return;
        }

        if (permittedStudents.length > 0) {
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
        } else {
          setDisplayableClassProgress([]);
        }
      } catch (err) {
        console.error(
          `Failed to fetch class progress for unit ${selectedUnitId}:`,
          err
        );
        if (err instanceof apiService.ApiError) {
          setClassProgressErrorLocal(
            `Error: ${err.data.message || err.message}`
          );
        } else if (err instanceof Error) {
          setClassProgressErrorLocal(`Error: ${err.message}`);
        } else {
          setClassProgressErrorLocal(
            "An unknown error occurred while fetching class progress."
          );
        }
        setSelectedUnitLessons([]);
        setSelectedUnitObject(null);
        setDisplayableClassProgress([]);
      } finally {
        setIsLoadingClassProgressLocal(false);
      }
    };

    if (
      selectedUnitId &&
      units.length > 0 &&
      isAuthenticated &&
      idToken &&
      apiGatewayUrl
    ) {
      if (!isLoadingStudentsGlobal || permittedStudents.length > 0) {
        fetchUnitAndProgressDetails();
      }
    } else if (
      selectedUnitId &&
      permittedStudents.length === 0 &&
      !isLoadingStudentsGlobal
    ) {
      setDisplayableClassProgress([]);
      setIsLoadingClassProgressLocal(false);
    }
  }, [
    selectedUnitId,
    permittedStudents,
    isLoadingStudentsGlobal,
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

  const getCellBackgroundColor = (
    percent: number | null | undefined
  ): string => {
    const safePercent =
      percent === null || typeof percent === "undefined"
        ? 0
        : Math.max(0, Math.min(100, percent));
    const baseOpacity = 0.1;
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
    if (isLoadingUnitsGlobal && units.length === 0)
      return <LoadingSpinner message="Loading units..." />;
    if (!isLoadingUnitsGlobal && units.length === 0)
      return (
        <p className={styles.placeholderMessage}>
          No units available to display progress.
        </p>
      );
    if (!selectedUnitId)
      return (
        <p className={styles.placeholderMessage}>
          Please select a unit to view progress.
        </p>
      );

    if (isLoadingStudentsGlobal)
      return <LoadingSpinner message="Loading student list..." />;
    if (studentsErrorGlobal)
      return <p className={styles.errorMessage}>{studentsErrorGlobal}</p>;
    if (permittedStudents.length === 0)
      return (
        <p className={styles.placeholderMessage}>
          No students assigned to view for this instructor.
        </p>
      );

    if (isLoadingClassProgressLocal)
      return (
        <LoadingSpinner message="Loading class progress for selected unit..." />
      );
    if (classProgressErrorLocal)
      return <p className={styles.errorMessage}>{classProgressErrorLocal}</p>;

    if (selectedUnitLessons.length === 0 && !isLoadingClassProgressLocal)
      return (
        <p className={styles.placeholderMessage}>
          Selected unit has no lessons defined.
        </p>
      );
    if (displayableClassProgress.length === 0 && !isLoadingClassProgressLocal)
      return (
        <p className={styles.placeholderMessage}>
          No progress data available for students in this unit.
        </p>
      );

    return (
      <div className={styles.progressTableContainer}>
        <table className={styles.progressTable}>
          <thead>
            <tr>
              <th>Student</th>
              {selectedUnitLessons.map((lesson) => {
                const hasAssignments = hasReviewableAssignments(lesson);
                const lessonLink = `/instructor-dashboard/assignments?unit=${selectedUnitId}&lesson=${lesson.guid}`;
                return (
                  <th key={lesson.guid} title={lesson.guid}>
                    {hasAssignments ? (
                      <Link
                        to={lessonLink}
                        title={`Review assignments for ${lesson.title}`}
                      >
                        {lesson.title} ↗
                      </Link>
                    ) : (
                      lesson.title
                    )}
                  </th>
                );
              })}
              <th>Unit Avg.</th>
            </tr>
          </thead>
          <tbody>
            {displayableClassProgress.map((studentProgress) => (
              <tr key={studentProgress.studentId}>
                <td className={styles.studentNameCell}>
                  <Link
                    to={`/instructor-dashboard/students/${studentProgress.studentId}`}
                  >
                    {studentProgress.studentName || studentProgress.studentId}
                  </Link>
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
      isLoadingClassProgressLocal ||
      classProgressErrorLocal ||
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
      <section className={styles.viewContainer}>
        <h3>Class Progress Overview</h3>
        <div className={styles.filters}>
          <select
            id="unit-select-progress-view"
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value as UnitId)}
            className={styles.filterSelect} // Apply the consistent select style
            disabled={units.length === 0 || isLoadingUnitsGlobal}
          >
            <option value="">-- Select Unit --</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      {renderClassSummaryView()}
      {renderProgressTableView()}
    </>
  );
};

export default ReviewClassProgressView;
