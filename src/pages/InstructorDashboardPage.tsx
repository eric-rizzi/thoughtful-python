import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as apiService from "../lib/apiService";
import { useAuthStore } from "../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../config";
import type { InstructorStudentInfo } from "../types/apiServiceTypes";
import type { Unit } from "../types/data";
import { fetchUnitsData } from "../lib/dataLoader";

import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./InstructorDashboardPage.module.css";

// Import the view components that will render the content for each tab
import ReviewClassProgressView from "../components/instructor/ReviewClassProgressView";
import ReviewByAssignmentView from "../components/instructor/ReviewByAssignmentView";
import ReviewByStudentView from "../components/instructor/ReviewByStudentView";
import ReviewLearningEntriesView from "../components/instructor/ReviewLearningEntriesView";

// Define the possible tabs for the dashboard
type InstructorDashboardTab =
  | "progress"
  | "byAssignment"
  | "byStudent"
  | "learningEntries";

const InstructorDashboardPage: React.FC = () => {
  const { idToken, isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromHash = (): InstructorDashboardTab => {
    const hash = location.hash.replace("#", "");
    if (
      hash === "byAssignment" ||
      hash === "byStudent" ||
      hash === "progress" ||
      hash === "learningEntries"
    ) {
      return hash as InstructorDashboardTab;
    }
    return "progress"; // Default tab
  };

  const [activeTab, setActiveTab] = useState<InstructorDashboardTab>(
    getActiveTabFromHash()
  );

  useEffect(() => {
    if (`#${activeTab}` !== location.hash) {
      navigate(`#${activeTab}`, { replace: true });
    }
  }, [activeTab, navigate, location.hash]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getActiveTabFromHash());
    };
    setActiveTab(getActiveTabFromHash());

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const [permittedStudents, setPermittedStudents] = useState<
    InstructorStudentInfo[]
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState<boolean>(true);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  const fetchPermittedStudents = useCallback(async () => {
    if (!isAuthenticated || !idToken) {
      setStudentsError("Authentication required to view student data.");
      setIsLoadingStudents(false);
      setPermittedStudents([]);
      return;
    }
    setIsLoadingStudents(true);
    setStudentsError(null);
    try {
      const response = await apiService.getInstructorPermittedStudents(
        idToken,
        API_GATEWAY_BASE_URL
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
      setPermittedStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [isAuthenticated, idToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPermittedStudents();

      setIsLoadingUnits(true);
      setUnitsError(null);
      fetchUnitsData()
        .then((data) => {
          setAllUnits(data.units);
        })
        .catch((err) => {
          console.error("Failed to fetch units data for dashboard:", err);
          setUnitsError("Could not load unit information for the dashboard.");
          setAllUnits([]);
        })
        .finally(() => {
          setIsLoadingUnits(false);
        });
    } else {
      setIsLoadingStudents(false);
      setIsLoadingUnits(false);
      setPermittedStudents([]);
      setAllUnits([]);
      setStudentsError(null);
      setUnitsError(null);
    }
  }, [fetchPermittedStudents, isAuthenticated]);

  const renderCurrentTab = () => {
    if (
      (isLoadingStudents || isLoadingUnits) &&
      !studentsError &&
      !unitsError
    ) {
      return (
        <div className={styles.loadingStateContainer}>
          <LoadingSpinner message="Loading instructor dashboard data..." />
        </div>
      );
    }
    if (studentsError)
      return <p className={styles.errorMessage}>{studentsError}</p>;
    if (unitsError) return <p className={styles.errorMessage}>{unitsError}</p>;

    if (!isAuthenticated) {
      return (
        <p className={styles.placeholderMessage}>
          Please log in to access instructor features.
        </p>
      );
    }

    const commonViewProps = {
      units: allUnits,
      permittedStudents: permittedStudents,
    };

    switch (activeTab) {
      case "progress":
        return (
          <ReviewClassProgressView
            {...commonViewProps}
            isLoadingUnitsGlobal={isLoadingUnits}
            isLoadingStudentsGlobal={isLoadingStudents}
            studentsErrorGlobal={studentsError}
          />
        );
      case "byAssignment":
        return <ReviewByAssignmentView {...commonViewProps} />;
      case "byStudent":
        return <ReviewByStudentView {...commonViewProps} />;
      case "learningEntries":
        return <ReviewLearningEntriesView {...commonViewProps} />;
      default:
        return (
          <ReviewClassProgressView
            {...commonViewProps}
            isLoadingUnitsGlobal={isLoadingUnits}
            isLoadingStudentsGlobal={isLoadingStudents}
            studentsErrorGlobal={studentsError}
          />
        );
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

      <nav className={styles.topTabNav}>
        <ul>
          <li>
            <Link
              to="#progress"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("progress");
              }}
              className={
                activeTab === "progress" ? styles.activeTabLink : styles.tabLink
              }
            >
              Class Progress
            </Link>
          </li>
          <li>
            <Link
              to="#byAssignment"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("byAssignment");
              }}
              className={
                activeTab === "byAssignment"
                  ? styles.activeTabLink
                  : styles.tabLink
              }
            >
              By Assignment
            </Link>
          </li>
          <li>
            <Link
              to="#byStudent"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("byStudent");
              }}
              className={
                activeTab === "byStudent"
                  ? styles.activeTabLink
                  : styles.tabLink
              }
            >
              Student Full View
            </Link>
          </li>
          <li>
            <Link
              to="#learningEntries"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("learningEntries");
              }}
              className={
                activeTab === "learningEntries"
                  ? styles.activeTabLink
                  : styles.tabLink
              }
            >
              Final Learning Entries
            </Link>
          </li>
        </ul>
      </nav>

      <main className={styles.mainContentArea}>{renderCurrentTab()}</main>
    </div>
  );
};

export default InstructorDashboardPage;
