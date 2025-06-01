// src/pages/InstructorDashboardPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import * as apiService from "../lib/apiService";
import { useAuthStore } from "../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../config";
import type {
  InstructorStudentInfo,
  StudentUnitProgressResponse,
  StudentLessonProgressItem,
  // ClassLessonSummaryItem, // For client-side computed summary
} from "../types/apiServiceTypes";
import type { Unit, Lesson } from "../types/data"; // For unit/lesson structure
import { fetchUnitsData, fetchLessonData } from "../lib/dataLoader"; // To get unit/lesson info

import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./InstructorDashboardPage.module.css";

// Client-side computed class summary type
interface ClientClassLessonSummary {
  lessonId: string;
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
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedUnitLessons, setSelectedUnitLessons] = useState<Lesson[]>([]);

  const [classProgressData, setClassProgressData] = useState<
    StudentUnitProgressResponse[]
  >([]);
  const [isLoadingClassProgress, setIsLoadingClassProgress] =
    useState<boolean>(false);
  const [classProgressError, setClassProgressError] = useState<string | null>(
    null
  );

  // Fetch permitted students
  const fetchPermittedStudents = useCallback(async () => {
    // ... (same as your existing fetchPermittedStudents logic) ...
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
      /* ... error handling ... */
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

  // Fetch all units for the dropdown
  useEffect(() => {
    fetchUnitsData()
      .then((data) => {
        setAllUnits(data.units);
        if (data.units.length > 0 && !selectedUnitId) {
          setSelectedUnitId(data.units[0].id); // Select first unit by default
        }
      })
      .catch((err) => {
        console.error("Failed to fetch units data:", err);
        setClassProgressError("Could not load unit list for selection.");
      });
  }, [selectedUnitId]); // Re-run if selectedUnitId was reset (though not typical here)

  useEffect(() => {
    fetchPermittedStudents();
  }, [fetchPermittedStudents]);

  // Fetch lessons for the selected unit AND progress for all students for that unit
  useEffect(() => {
    if (
      !selectedUnitId ||
      permittedStudents.length === 0 ||
      !isAuthenticated ||
      !idToken ||
      !apiGatewayUrl
    ) {
      setClassProgressData([]);
      setSelectedUnitLessons([]);
      return;
    }

    const fetchUnitDetailsAndProgress = async () => {
      setIsLoadingClassProgress(true);
      setClassProgressError(null);
      setClassProgressData([]); // Clear previous unit's data

      try {
        // 1. Fetch Lesson structures for the selected unit
        const currentUnit = allUnits.find((u) => u.id === selectedUnitId);
        if (!currentUnit) {
          throw new Error(`Unit details not found for ${selectedUnitId}`);
        }
        const lessonPromises = currentUnit.lessons.map((lessonPath) =>
          fetchLessonData(lessonPath)
        );
        const lessonsForUnit = (await Promise.all(lessonPromises)).filter(
          (l) => l !== null
        ) as Lesson[];
        setSelectedUnitLessons(lessonsForUnit);

        // 2. Fetch progress for each student for this unit
        const progressPromises = permittedStudents.map((student) =>
          apiService.getInstructorStudentUnitProgress(
            idToken!,
            apiGatewayUrl!,
            student.studentId,
            selectedUnitId
          )
        );
        const studentProgressResults = await Promise.all(progressPromises);
        setClassProgressData(studentProgressResults);
      } catch (err) {
        console.error(
          `Failed to fetch progress for unit ${selectedUnitId}:`,
          err
        );
        if (err instanceof apiService.ApiError) {
          setClassProgressError(
            `Error: ${err.data.message || err.message} (Status: ${err.status})`
          );
        } else if (err instanceof Error) {
          setClassProgressError(`Error: ${err.message}`);
        } else {
          setClassProgressError(
            "An unknown error occurred while fetching class progress."
          );
        }
        setSelectedUnitLessons([]); // Clear lessons on error
      } finally {
        setIsLoadingClassProgress(false);
      }
    };

    fetchUnitDetailsAndProgress();
  }, [
    selectedUnitId,
    permittedStudents,
    isAuthenticated,
    idToken,
    apiGatewayUrl,
    allUnits,
  ]);

  // Client-side calculation for "At-a-Glance" summary
  const classLessonSummaries: ClientClassLessonSummary[] = useMemo(() => {
    if (!selectedUnitLessons.length || !classProgressData.length) return [];

    return selectedUnitLessons.map((lesson) => {
      let totalPercent = 0;
      let attemptedCount = 0;
      let completedCount = 0;

      classProgressData.forEach((studentProgress) => {
        const lessonProg = studentProgress.lessonsProgress.find(
          (lp) => lp.lessonId === lesson.path
        );
        if (lessonProg) {
          totalPercent += lessonProg.completionPercent;
          if (
            lessonProg.completionPercent > 0 ||
            lessonProg.completedSectionsCount > 0
          ) {
            // Consider attempted if any progress
            attemptedCount++;
          }
          if (lessonProg.isCompleted) {
            completedCount++;
          }
        }
      });
      return {
        lessonId: lesson.path,
        lessonTitle: lesson.title,
        averageCompletionPercent:
          classProgressData.length > 0
            ? parseFloat((totalPercent / classProgressData.length).toFixed(1))
            : 0,
        numStudentsAttempted: attemptedCount,
        numStudentsCompleted: completedCount,
      };
    });
  }, [selectedUnitLessons, classProgressData]);

  const getCellBackgroundColor = (percent: number): string => {
    const greenIntensity = Math.min(200, Math.max(50, Math.round(percent * 2))); // Cap green for visibility
    const redIntensity = Math.min(
      200,
      Math.max(50, Math.round((100 - percent) * 1.5))
    );
    if (percent === 0) return "rgba(255, 100, 100, 0.1)"; // Light red for 0
    if (percent === 100) return "rgba(70, 200, 70, 0.7)"; // Darker green for 100
    return `rgba(${redIntensity * 0.3}, ${greenIntensity}, ${
      redIntensity * 0.3
    }, 0.4)`; // Green tint based on %
  };

  const renderProgressTable = () => {
    if (isLoadingClassProgress)
      return <LoadingSpinner message="Loading class progress..." />;
    if (classProgressError)
      return <p className={styles.errorMessage}>{classProgressError}</p>;
    if (!selectedUnitId || selectedUnitLessons.length === 0)
      return <p>Select a unit to view progress.</p>;
    if (permittedStudents.length === 0)
      return <p>No students to display progress for.</p>;
    if (classProgressData.length === 0 && !isLoadingClassProgress)
      return <p>No progress data found for students in this unit.</p>;

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
            {classProgressData.map((studentProgress) => (
              <tr key={studentProgress.studentId}>
                <td className={styles.studentNameCell}>
                  {studentProgress.studentName || studentProgress.studentId}
                  {/* <Link to={`/instructor-dashboard/student/${studentProgress.studentId}`}>
                    {studentProgress.studentName || studentProgress.studentId}
                  </Link> */}
                </td>
                {selectedUnitLessons.map((lesson) => {
                  const lessonProg = studentProgress.lessonsProgress.find(
                    (lp) => lp.lessonId === lesson.title
                  );
                  const percent = lessonProg ? lessonProg.completionPercent : 0;
                  return (
                    <td
                      key={`${studentProgress.studentId}-${lesson.title}`}
                      style={{
                        backgroundColor: getCellBackgroundColor(percent),
                        fontWeight: lessonProg?.isCompleted ? "bold" : "normal",
                      }}
                      title={`${percent.toFixed(0)}% completed`}
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
    return (
      <div className={styles.classSummarySection}>
        <h4>
          Unit Summary:{" "}
          {allUnits.find((u) => u.id === selectedUnitId)?.title ||
            selectedUnitId}
        </h4>
        <ul className={styles.summaryList}>
          {classLessonSummaries.map((summary) => (
            <li key={summary.lessonId}>
              <strong>{summary.lessonTitle}:</strong> Avg. Completion:{" "}
              {summary.averageCompletionPercent}% (
              {summary.numStudentsCompleted}/{summary.numStudentsAttempted}{" "}
              students completed/attempted)
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
            {/* ... other future links ... */}
          </ul>
        </nav>
        <main className={styles.mainContent}>
          <section className={styles.studentListSection}>
            {" "}
            {/* Reused for general section title */}
            <h2>Class Progress Overview</h2>
            {isLoadingStudents && (
              <LoadingSpinner message="Loading student list..." />
            )}
            {studentsError && (
              <p className={styles.errorMessage}>{studentsError}</p>
            )}
            {!isLoadingStudents &&
              !studentsError &&
              permittedStudents.length > 0 && (
                <div className={styles.unitSelectorContainer}>
                  <label htmlFor="unit-select">Select Unit: </label>
                  <select
                    id="unit-select"
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className={styles.unitSelect}
                  >
                    <option value="" disabled>
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
          {renderClassSummary()} {/* At-a-glance summary */}
          {renderProgressTable()} {/* Detailed progress table */}
        </main>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
