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

// Define the possible tabs for the dashboard
type InstructorDashboardTab = "progress" | "byAssignment" | "byStudent";

const InstructorDashboardPage: React.FC = () => {
  const { idToken, isAuthenticated, user } = useAuthStore();
  // const apiGatewayUrl = API_GATEWAY_BASE_URL; // apiService functions will use this from config

  const location = useLocation();
  const navigate = useNavigate();

  // Helper to determine the active tab from the URL hash
  const getActiveTabFromHash = (): InstructorDashboardTab => {
    const hash = location.hash.replace("#", "");
    if (
      hash === "byAssignment" ||
      hash === "byStudent" ||
      hash === "progress"
    ) {
      return hash as InstructorDashboardTab;
    }
    return "progress"; // Default tab if hash is missing or invalid
  };

  const [activeTab, setActiveTab] = useState<InstructorDashboardTab>(
    getActiveTabFromHash()
  );

  // Effect to update the URL hash when the activeTab state changes
  useEffect(() => {
    if (`#${activeTab}` !== location.hash) {
      // Only navigate if hash needs to change
      navigate(`#${activeTab}`, { replace: true });
    }
  }, [activeTab, navigate, location.hash]);

  // Effect to listen to browser hash changes (e.g., back/forward buttons)
  // and update the activeTab state accordingly. Also sets initial tab on mount.
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getActiveTabFromHash());
    };

    // Set initial tab based on current hash when component mounts
    setActiveTab(getActiveTabFromHash());

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // --- Shared state fetched by this parent dashboard component ---
  // This data is potentially used by multiple tabs.
  const [permittedStudents, setPermittedStudents] = useState<
    InstructorStudentInfo[]
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState<boolean>(true);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  // Callback to fetch the list of students the instructor is permitted to view
  const fetchPermittedStudents = useCallback(async () => {
    if (!isAuthenticated || !idToken) {
      setStudentsError("Authentication required to view student data.");
      setIsLoadingStudents(false);
      setPermittedStudents([]); // Clear students if not authenticated
      return;
    }
    setIsLoadingStudents(true);
    setStudentsError(null);
    try {
      // apiService functions use API_GATEWAY_BASE_URL from config internally
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
            err.status === 403
              ? " (Forbidden - You may not have permissions)"
              : ` (Status: ${err.status})`
          }`
        );
      } else if (err instanceof Error) {
        setStudentsError(`Error fetching students: ${err.message}`);
      } else {
        setStudentsError("An unknown error occurred while fetching students.");
      }
      setPermittedStudents([]); // Clear on error
    } finally {
      setIsLoadingStudents(false);
    }
  }, [isAuthenticated, idToken]); // apiGatewayUrl removed as it's in apiService

  // Effect to fetch initial shared data (students and units) when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPermittedStudents(); // Fetch students

      setIsLoadingUnits(true);
      setUnitsError(null);
      fetchUnitsData() // Fetch all unit definitions
        .then((data) => {
          setAllUnits(data.units);
        })
        .catch((err) => {
          console.error("Failed to fetch units data for dashboard:", err);
          setUnitsError("Could not load unit information for the dashboard.");
          setAllUnits([]); // Clear on error
        })
        .finally(() => {
          setIsLoadingUnits(false);
        });
    } else {
      // Clear data and stop loading if user is not authenticated
      setIsLoadingStudents(false);
      setIsLoadingUnits(false);
      setPermittedStudents([]);
      setAllUnits([]);
      setStudentsError(null); // Clear errors if logged out
      setUnitsError(null);
    }
  }, [fetchPermittedStudents, isAuthenticated]);

  // Function to render the content of the currently active tab
  const renderCurrentTab = () => {
    // Display a top-level loading spinner if essential shared data (students or units) is still loading
    if (
      (isLoadingStudents || isLoadingUnits) &&
      !studentsError &&
      !unitsError
    ) {
      return <LoadingSpinner message="Loading instructor dashboard data..." />;
    }
    // Display errors related to fetching shared data
    if (studentsError)
      return <p className={styles.errorMessage}>{studentsError}</p>;
    if (unitsError) return <p className={styles.errorMessage}>{unitsError}</p>;

    // If not authenticated after loading attempts (e.g., token expired during load), show prompt
    if (!isAuthenticated) {
      return (
        <p className={styles.placeholderMessage}>
          Please log in to access instructor features.
        </p>
      );
    }

    // Props to pass down to child tab components
    const sharedPropsForTabs = {
      units: allUnits,
      permittedStudents: permittedStudents,
      isLoadingUnits: isLoadingUnits, // Pass down the loading state for units
      isLoadingStudents: isLoadingStudents, // Pass down the loading state for students
      studentsError: studentsError, // Pass down student fetching error
    };

    switch (activeTab) {
      case "progress":
        return <ReviewClassProgressView {...sharedPropsForTabs} />;
      case "byAssignment":
        return <ReviewByAssignmentView {...sharedPropsForTabs} />;
      case "byStudent":
        // ReviewByStudentView primarily needs permittedStudents, but might use units for context later
        return (
          <ReviewByStudentView
            permittedStudents={permittedStudents}
            units={allUnits}
          />
        );
      default:
        // Fallback to progress tab or a placeholder message
        return <ReviewClassProgressView {...sharedPropsForTabs} />;
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
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("progress");
                }}
                className={activeTab === "progress" ? styles.activeLink : ""}
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
                  activeTab === "byAssignment" ? styles.activeLink : ""
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
                className={activeTab === "byStudent" ? styles.activeLink : ""}
              >
                By Student
              </Link>
            </li>
          </ul>
        </nav>
        <main className={styles.mainContent}>{renderCurrentTab()}</main>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
