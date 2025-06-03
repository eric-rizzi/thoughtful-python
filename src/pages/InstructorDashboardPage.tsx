// src/pages/InstructorDashboardPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import * as apiService from "../lib/apiService";
import { useAuthStore } from "../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../config";
import type {
  InstructorStudentInfo,
  StudentLessonProgressItem, // This will be a computed display model client-side
  // DisplayableStudentUnitProgress, // This will be computed client-side
} from "../types/apiServiceTypes";
import type { Unit, Lesson, LessonId, UserId, UnitId } from "../types/data";
import {
  fetchUnitsData,
  fetchLessonData,
  getRequiredSectionsForLesson,
} from "../lib/dataLoader";

import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./InstructorDashboardPage.module.css";

// Client-side computed structure for display
interface DisplayableStudentUnitProgress {
  studentId: UserId;
  studentName?: string | null;
  lessonsProgress: StudentLessonProgressItem[];
  overallUnitCompletionPercent: number;
}

interface ClientClassLessonSummary {
  lessonId: LessonId;
  lessonTitle: string;
  averageCompletionPercent: number;
  numStudentsAttempted: number;
  numStudentsCompleted: number;
}

const InstructorDashboardPage: React.FC = () => {
  const { idToken, isAuthenticated, user } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const [permittedStudents, setPermittedStudents] = useState<
    InstructorStudentInfo[]
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<UnitId>("" as UnitId);
  const [selectedUnitObject, setSelectedUnitObject] = useState<Unit | null>(
    null
  ); // Store the whole unit object
  const [selectedUnitLessons, setSelectedUnitLessons] = useState<Lesson[]>([]); // Store full lesson objects

  // This will store the computed data ready for display
  const [displayableClassProgress, setDisplayableClassProgress] = useState<
    DisplayableStudentUnitProgress[]
  >([]);
  const [isLoadingClassProgress, setIsLoadingClassProgress] =
    useState<boolean>(false);
  const [classProgressError, setClassProgressError] = useState<string | null>(
    null
  );

  // Fetch permitted students (remains the same)
  const fetchPermittedStudents = useCallback(async () => {
    if (!isAuthenticated || !idToken || !apiGatewayUrl) {
      setStudentsError("Authentication required or API not configured.");
      setIsLoadingStudents(false);
      return;
    }
    setIsLoadingStudents(true);
    setStudentsError(null);
    try {
      const response = await apiService.getInstructorPermittedStudents(
        idToken,
        apiGatewayUrl
      );
      setPermittedStudents(response.students);
    } catch (err) {
      console.error("Failed to fetch permitted students:", err);
      if (err instanceof apiService.ApiError) {
        setStudentsError(
          `Error fetching students: ${err.data.message || err.message}${
            err.status === 403
              ? " (Forbidden - You may not have instructor privileges or permissions configured)"
              : ` (Status: ${err.status})`
          }`
        );
      } else if (err instanceof Error) {
        setStudentsError(`Error fetching students: ${err.message}`);
      } else {
        setStudentsError("An unknown error occurred while fetching students.");
      }
    } finally {
      setIsLoadingStudents(false);
    }
  }, [isAuthenticated, idToken, apiGatewayUrl]);

  useEffect(() => {
    fetchPermittedStudents();
  }, [fetchPermittedStudents]);

  // Fetch all units for the dropdown
  useEffect(() => {
    fetchUnitsData()
      .then((data) => {
        setAllUnits(data.units);
        if (data.units.length > 0 && !selectedUnitId) {
          setSelectedUnitId(data.units[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch units data:", err);
        setClassProgressError("Could not load unit list for selection.");
      });
  }, []); // Removed selectedUnitId from deps as it's set here initially

  // Fetch lessons for the selected unit AND then fetch class progress
  useEffect(() => {
    if (!selectedUnitId || !isAuthenticated || !idToken || !apiGatewayUrl) {
      setDisplayableClassProgress([]);
      setSelectedUnitLessons([]);
      setSelectedUnitObject(null);
      return;
    }

    const fetchUnitAndProgressDetails = async () => {
      setIsLoadingClassProgress(true);
      setClassProgressError(null);
      setDisplayableClassProgress([]);

      try {
        // 1. Fetch Unit and its Lesson structures (client-side)
        const currentUnitData = allUnits.find((u) => u.id === selectedUnitId);
        if (!currentUnitData) {
          throw new Error(`Unit details not found for ${selectedUnitId}`);
        }
        setSelectedUnitObject(currentUnitData);

        const lessonPromises = currentUnitData.lessons.map((lessonReference) =>
          fetchLessonData(lessonReference.guid)
        );
        const lessonsForUnit = (await Promise.all(lessonPromises)).filter(
          (l) => l !== null
        ) as Lesson[];
        setSelectedUnitLessons(lessonsForUnit);

        if (lessonsForUnit.length === 0) {
          setIsLoadingClassProgress(false);
          return; // No lessons in this unit to fetch progress for
        }
        if (permittedStudents.length === 0 && !isLoadingStudents) {
          // Don't fetch if no students
          setIsLoadingClassProgress(false);
          return;
        }

        // 2. Fetch batch progress data from the server for this unit
        // The server uses the instructor's token to determine permitted students
        const studentIdsToFetchFor = permittedStudents.map((s) => s.studentId); // For the mock
        const classProgressResponse =
          await apiService.getInstructorClassUnitProgress(
            idToken!,
            apiGatewayUrl!,
            selectedUnitId,
            studentIdsToFetchFor // studentIdsToFetchFor helps mock
          );

        // 3. Merge server progress data with client-side lesson structure
        const computedProgress: DisplayableStudentUnitProgress[] =
          classProgressResponse.studentProgressData.map((studentData) => {
            const studentInfo = permittedStudents.find(
              (ps) => ps.studentId === studentData.studentId
            );
            let totalCompletedInUnit = 0;
            let totalRequiredInUnit = 0;

            const lessonsProgress: StudentLessonProgressItem[] =
              lessonsForUnit.map((lesson) => {
                const requiredSections = getRequiredSectionsForLesson(lesson); // Client-side knowledge
                const totalRequiredInLesson = requiredSections.length;

                const completedSectionsMapForLesson =
                  studentData.completedSectionsInUnit[lesson.guid] || {};
                const completedInLessonCount = Object.keys(
                  completedSectionsMapForLesson
                ).length;

                // Ensure we don't count more completed than required if data is ever inconsistent
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
                    : 0; // If no required sections, consider it 100%

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
                : 0; // If unit has no lessons, 100%

            return {
              studentId: studentData.studentId,
              studentName: studentInfo?.studentName,
              unitId: classProgressResponse.unitId, // Use unitId from response
              unitTitle: currentUnitData.title, // Use title from client-side data
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
          setClassProgressError(
            `Error loading class progress: ${
              err.data.message || err.message
            } (Status: ${err.status})`
          );
        } else if (err instanceof Error) {
          setClassProgressError(`Error loading class progress: ${err.message}`);
        } else {
          setClassProgressError(
            "An unknown error occurred while fetching class progress data."
          );
        }
        setSelectedUnitLessons([]);
        setSelectedUnitObject(null);
      } finally {
        setIsLoadingClassProgress(false);
      }
    };

    if (
      selectedUnitId &&
      (permittedStudents.length > 0 || isLoadingStudents) &&
      idToken &&
      apiGatewayUrl
    ) {
      // Fetch if we have students or are still loading them (to catch the case where students load after unit selection)
      fetchUnitAndProgressDetails();
    } else if (
      selectedUnitId &&
      permittedStudents.length === 0 &&
      !isLoadingStudents
    ) {
      // If a unit is selected, but we know there are no students, clear progress
      setDisplayableClassProgress([]);
      setIsLoadingClassProgress(false); // Ensure loading stops
    }
  }, [
    selectedUnitId,
    permittedStudents,
    isLoadingStudents,
    isAuthenticated,
    idToken,
    apiGatewayUrl,
    allUnits,
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
          (lp) => lp.lessonId === lesson.title
        );
        if (lessonProg) {
          totalPercentSum += lessonProg.completionPercent;
          validStudentProgressCount++; // Count students for whom we have this lesson's progress
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
    const baseOpacity = 0.1; // Minimum opacity for non-zero
    const opacity =
      percent > 0
        ? baseOpacity + (percent / 100) * 0.6
        : percent === 0
        ? 0.05
        : 0; // Max opacity 0.7 for green

    if (percent === 0) return `rgba(255, 100, 100, ${baseOpacity})`; // Light red for 0
    return `rgba(70, 180, 70, ${opacity})`; // Green tint based on %
  };

  const renderProgressTable = () => {
    if (isLoadingClassProgress && displayableClassProgress.length === 0)
      return <LoadingSpinner message="Loading class progress..." />;
    if (classProgressError)
      return <p className={styles.errorMessage}>{classProgressError}</p>;
    if (!selectedUnitId) return <p>Please select a unit to view progress.</p>;
    if (permittedStudents.length === 0 && !isLoadingStudents)
      return <p>No students assigned to view.</p>;
    if (selectedUnitLessons.length === 0 && !isLoadingClassProgress)
      return <p>Selected unit has no lessons defined.</p>;
    if (displayableClassProgress.length === 0 && !isLoadingClassProgress)
      return <p>No progress data available for students in this unit.</p>;

    return (
      <div className={styles.progressTableContainer}>
        <table className={styles.progressTable}>
          <thead>
            <tr>
              <th>Student</th>
              {selectedUnitLessons.map((lesson) => (
                <th key={lesson.title} title={lesson.title}>
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
                    (lp) => lp.lessonId === lesson.title
                  );
                  const percent = lessonProg ? lessonProg.completionPercent : 0;
                  const cellTitle = lessonProg
                    ? `${lessonProg.completedSectionsCount}/${
                        lessonProg.totalRequiredSectionsInLesson
                      } sections (${percent.toFixed(0)}%)`
                    : "0% completed";
                  return (
                    <td
                      key={`${studentProgress.studentId}-${lesson.title}`}
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

  const renderClassSummary = () => {
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
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Instructor Dashboard</h1>
        {isAuthenticated && user && (
          <p>Viewing as: {user.name || user.email}</p>
        )}
      </header>

      <div className={styles.dashboardLayout}>
        <nav className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Navigation</h3>
          <ul>
            <li>
              <Link to="/instructor-dashboard" className={styles.activeLink}>
                Class Progress
              </Link>
            </li>
            <li>
              <span className={styles.placeholderLink}>
                Student Details (Soon)
              </span>
            </li>
          </ul>
        </nav>
        <main className={styles.mainContent}>
          <section className={styles.controlSection}>
            <h2>Class Progress Overview</h2>
            {isLoadingStudents && !selectedUnitId && (
              <LoadingSpinner message="Loading student list..." />
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
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className={styles.unitSelect}
                  disabled={allUnits.length === 0}
                >
                  <option value="" disabled={selectedUnitId !== ""}>
                    -- Choose a Unit --
                  </option>
                  {allUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {renderClassSummary()}
          {renderProgressTable()}
        </main>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
