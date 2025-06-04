import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as apiService from "../lib/apiService";
import { useAuthStore } from "../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../config";
import type {
  InstructorStudentInfo,
  StudentLessonProgressItem,
  ClassUnitProgressResponse,
} from "../types/apiServiceTypes";
import type {
  Unit,
  Lesson,
  LessonId,
  UserId,
  UnitId,
  LessonReference,
  AnyLessonSectionData,
} from "../types/data";
import {
  fetchUnitsData,
  fetchLessonData,
  getRequiredSectionsForLesson,
} from "../lib/dataLoader";

import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./InstructorDashboardPage.module.css";

// Import the view components
import ReviewByAssignmentView from "../components/instructor/ReviewByAssignmentView";
import ReviewByStudentView from "../components/instructor/ReviewByStudentView";

// Client-side computed structure for display (for progress tab)
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

type InstructorDashboardTab = "progress" | "byAssignment" | "byStudent";

const InstructorDashboardPage: React.FC = () => {
  const { idToken, isAuthenticated, user } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromHash = (): InstructorDashboardTab => {
    const hash = location.hash.replace("#", "");
    if (
      hash === "byAssignment" ||
      hash === "byStudent" ||
      hash === "progress"
    ) {
      return hash as InstructorDashboardTab;
    }
    return "progress"; // Default tab
  };

  const [activeTab, setActiveTab] = useState<InstructorDashboardTab>(
    getActiveTabFromHash()
  );

  // Update URL hash when tab changes, but only if it's different
  useEffect(() => {
    if (`#${activeTab}` !== location.hash) {
      navigate(`#${activeTab}`, { replace: true });
    }
  }, [activeTab, navigate, location.hash]);

  // Listen to hash changes to update tab state (e.g., browser back/forward)
  // Also set initial tab based on hash when component mounts
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getActiveTabFromHash());
    };
    // Set initial tab correctly when component mounts
    setActiveTab(getActiveTabFromHash());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []); // Removed location from deps, as getActiveTabFromHash uses it internally

  // --- State and logic for "Class Progress" tab & shared data ---
  const [permittedStudents, setPermittedStudents] = useState<
    InstructorStudentInfo[]
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState<boolean>(true); // Loading state for units

  const [selectedUnitId, setSelectedUnitId] = useState<UnitId>("" as UnitId);
  const [selectedUnitObject, setSelectedUnitObject] = useState<Unit | null>(
    null
  );
  // Store Lessons augmented with their GUID for easier use in progress tab
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
            err.status === 403 ? " (Forbidden)" : ` (Status: ${err.status})`
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

  // Fetch initial data: permitted students and all units
  useEffect(() => {
    if (isAuthenticated) {
      fetchPermittedStudents();
      setIsLoadingUnits(true);
      fetchUnitsData()
        .then((data) => {
          setAllUnits(data.units);
          if (data.units.length > 0 && !selectedUnitId) {
            // Only set default if selectedUnitId isn't already set (e.g., by URL hash restoration)
            const hashTab = getActiveTabFromHash(); // Check current tab intention
            if (hashTab === "progress") {
              // Only default select unit if progress tab is intended
              setSelectedUnitId(data.units[0].id);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch units data:", err);
          setClassProgressError("Could not load unit list for selection.");
        })
        .finally(() => setIsLoadingUnits(false));
    } else {
      setIsLoadingStudents(false);
      setIsLoadingUnits(false);
    }
  }, [fetchPermittedStudents, isAuthenticated]); // Removed selectedUnitId from here

  // Fetch lessons for the selected unit AND then fetch class progress (for "progress" tab)
  useEffect(() => {
    if (
      activeTab !== "progress" ||
      !selectedUnitId ||
      !isAuthenticated ||
      !idToken ||
      !apiGatewayUrl ||
      allUnits.length === 0
    ) {
      // If not progress tab, or no unit selected, or not auth, or units not loaded, do nothing or clear.
      if (activeTab === "progress" && !selectedUnitId && allUnits.length > 0) {
        // If progress tab is active but no unit selected (e.g. after clearing selection), clear progress data
        setDisplayableClassProgress([]);
        setSelectedUnitLessons([]);
        setSelectedUnitObject(null);
      }
      return;
    }

    const fetchUnitAndProgressDetails = async () => {
      setIsLoadingClassProgress(true);
      setClassProgressError(null);
      // setDisplayableClassProgress([]); // Optionally keep old data visible while loading new

      try {
        const currentUnitData = allUnits.find((u) => u.id === selectedUnitId);
        if (!currentUnitData) {
          // This can happen if allUnits hasn't populated yet, or selectedUnitId is invalid
          if (allUnits.length > 0)
            throw new Error(`Unit details not found for ${selectedUnitId}`);
          else {
            setIsLoadingClassProgress(false);
            return;
          }
        }
        setSelectedUnitObject(currentUnitData);

        // currentUnitData.lessons is LessonReference[]: { guid: LessonId, path: string }[]
        // fetchLessonData now takes GUID (which is lessonRef.id)
        const lessonPromises = currentUnitData.lessons.map(
          (lessonRef: LessonReference) => fetchLessonData(lessonRef.path)
        );
        const lessonsForUnitRaw = (await Promise.all(lessonPromises)).filter(
          (l): l is Lesson => l !== null
        );
        // Ensure the lessonsForUnit state has the GUID readily available (it's lesson.guid from your type)
        setSelectedUnitLessons(lessonsForUnitRaw);

        if (
          lessonsForUnitRaw.length === 0 ||
          (permittedStudents.length === 0 && !isLoadingStudents)
        ) {
          setIsLoadingClassProgress(false);
          setDisplayableClassProgress([]); // Clear if no lessons or students
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
                // lesson here has .guid
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
      activeTab === "progress" &&
      selectedUnitId &&
      allUnits.length > 0 &&
      (permittedStudents.length > 0 || isLoadingStudents) &&
      idToken &&
      apiGatewayUrl
    ) {
      fetchUnitAndProgressDetails();
    } else if (
      activeTab === "progress" &&
      selectedUnitId &&
      permittedStudents.length === 0 &&
      !isLoadingStudents
    ) {
      // If a unit is selected for progress view, but we know there are no students, clear progress
      setDisplayableClassProgress([]);
      setIsLoadingClassProgress(false); // Ensure loading stops
    }
  }, [
    activeTab,
    selectedUnitId,
    permittedStudents,
    isLoadingStudents,
    isAuthenticated,
    idToken,
    apiGatewayUrl,
    allUnits,
  ]);

  const classLessonSummaries: ClientClassLessonSummary[] = useMemo(() => {
    if (
      activeTab !== "progress" ||
      !selectedUnitLessons.length ||
      !displayableClassProgress.length
    )
      return [];
    return selectedUnitLessons.map((lesson) => {
      // lesson has .guid
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
  }, [activeTab, selectedUnitLessons, displayableClassProgress]);

  const getCellBackgroundColor = (percent: number): string => {
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    const baseOpacity = 0.1;
    // Ensure percent is not null before calculation
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
    // Renamed to avoid conflict with table itself
    if (isLoadingClassProgress && displayableClassProgress.length === 0)
      return <LoadingSpinner message="Loading class progress..." />;
    if (classProgressError)
      return <p className={styles.errorMessage}>{classProgressError}</p>;
    if (!selectedUnitId && allUnits.length > 0)
      return (
        <p className={styles.placeholderMessage}>
          Please select a unit to view progress.
        </p>
      );
    if (isLoadingUnits && allUnits.length === 0)
      return <LoadingSpinner message="Loading units..." />;
    if (!isLoadingUnits && allUnits.length === 0)
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
      return <LoadingSpinner message="Loading class progress..." />; // Catch all for loading state

    return (
      <div className={styles.progressTableContainer}>
        <table className={styles.progressTable}>
          <thead>
            <tr>
              <th>Student</th>
              {selectedUnitLessons.map(
                (
                  lesson // lesson has .guid
                ) => (
                  <th key={lesson.guid} title={lesson.guid}>
                    {lesson.title}
                  </th>
                )
              )}
              <th>Unit Avg.</th>
            </tr>
          </thead>
          <tbody>
            {displayableClassProgress.map((studentProgress) => (
              <tr key={studentProgress.studentId}>
                <td className={styles.studentNameCell}>
                  {/* Future: Link to /instructor-dashboard/student/${studentProgress.studentId}#overview */}
                  {studentProgress.studentName || studentProgress.studentId}
                </td>
                {selectedUnitLessons.map((lesson) => {
                  // lesson has .guid
                  const lessonProg = studentProgress.lessonsProgress.find(
                    (lp) => lp.lessonId === lesson.guid // Match by GUID
                  );
                  const percent = lessonProg ? lessonProg.completionPercent : 0;
                  const cellTitle = lessonProg
                    ? `${lessonProg.completedSectionsCount}/${
                        lessonProg.totalRequiredSectionsInLesson
                      } sections (${percent.toFixed(0)}%)`
                    : "0% completed";
                  return (
                    <td
                      key={`${studentProgress.studentId}-${lesson.guid}`} // Use GUID in key
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
    // Renamed to avoid conflict
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
          {classLessonSummaries.map(
            (
              summary // summary.lessonId is GUID
            ) => (
              <li key={summary.lessonId}>
                <strong>{summary.lessonTitle}:</strong> Avg.{" "}
                {summary.averageCompletionPercent}% completion (
                {summary.numStudentsCompleted} of {summary.numStudentsAttempted}{" "}
                attempted completed)
              </li>
            )
          )}
        </ul>
      </div>
    );
  };

  const renderCurrentTab = () => {
    switch (activeTab) {
      case "progress":
        return (
          <>
            <section className={styles.controlSection}>
              <h2>Class Progress Overview</h2>
              {isLoadingStudents && allUnits.length === 0 && (
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
                    onChange={(e) =>
                      setSelectedUnitId(e.target.value as UnitId)
                    }
                    className={styles.unitSelect}
                    disabled={allUnits.length === 0 || isLoadingUnits}
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
            {isLoadingUnits && !selectedUnitId && (
              <LoadingSpinner message="Loading units..." />
            )}
            {renderClassSummaryView()}
            {renderProgressTableView()}
          </>
        );
      case "byAssignment":
        return (
          <ReviewByAssignmentView
            units={allUnits}
            permittedStudents={permittedStudents}
          />
        );
      case "byStudent":
        return <ReviewByStudentView permittedStudents={permittedStudents} />;
      default:
        return <p>Select a view from the sidebar.</p>;
    }
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
          <h3 className={styles.sidebarTitle}>Review Options</h3>
          <ul>
            <li>
              <Link
                to="#progress"
                onClick={() => setActiveTab("progress")}
                className={activeTab === "progress" ? styles.activeLink : ""}
              >
                Class Progress
              </Link>
            </li>
            <li>
              <Link
                to="#byAssignment"
                onClick={() => setActiveTab("byAssignment")}
                className={
                  activeTab === "byAssignment" ? styles.activeLink : ""
                }
              >
                By Assignment
              </Link>
            </li>
            <li>
              <Link
                to="#byStudent"
                onClick={() => setActiveTab("byStudent")}
                className={activeTab === "byStudent" ? styles.activeLink : ""}
              >
                By Student
              </Link>
            </li>
          </ul>
        </nav>
        <main className={styles.mainContent}>
          {isAuthenticated ? (
            renderCurrentTab()
          ) : (
            <p className={styles.placeholderMessage}>
              Please log in to access instructor features.
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
