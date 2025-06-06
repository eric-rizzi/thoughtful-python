import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { googleLogout } from "@react-oauth/google";

import * as apiService from "../lib/apiService";
import { useAuthStore, useAuthActions } from "../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../config";
import type { InstructorStudentInfo } from "../types/apiServiceTypes";
import type { Unit } from "../types/data";
import { fetchUnitsData } from "../lib/dataLoader";

import LoadingSpinner from "../components/LoadingSpinner";
import Footer from "../components/Footer"; // Import the standard footer
import styles from "./InstructorDashboardPage.module.css";

// Import the view components
import ReviewClassProgressView from "../components/instructor/ReviewClassProgressView";
import ReviewByAssignmentView from "../components/instructor/ReviewByAssignmentView";
import ReviewByStudentView from "../components/instructor/ReviewByStudentView";
import ReviewLearningEntriesView from "../components/instructor/ReviewLearningEntriesView";

type InstructorDashboardTab =
  | "progress"
  | "byAssignment"
  | "byStudent"
  | "learningEntries";

const navLinks: { key: InstructorDashboardTab; label: string }[] = [
  { key: "progress", label: "Class Progress" },
  { key: "byAssignment", label: "By Assignment" },
  { key: "byStudent", label: "By Student" },
  { key: "learningEntries", label: "Final Learning Entries" },
];

const InstructorDashboardPage: React.FC = () => {
  // --- All existing state and data fetching hooks remain unchanged ---
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<InstructorDashboardTab>("progress");
  // ... (rest of the existing state and useEffect hooks for data fetching are unchanged) ...
  const getActiveTabFromHash = (): InstructorDashboardTab => {
    const hash = location.hash.replace("#", "");
    const validTabs: InstructorDashboardTab[] = [
      "progress",
      "byAssignment",
      "byStudent",
      "learningEntries",
    ];
    if (validTabs.includes(hash as InstructorDashboardTab)) {
      return hash as InstructorDashboardTab;
    }
    return "progress"; // Default tab
  };

  useEffect(() => {
    // Sync URL hash when activeTab state changes
    if (`#${activeTab}` !== location.hash) {
      navigate(`#${activeTab}`, { replace: true });
    }
  }, [activeTab, navigate, location.hash]);

  useEffect(() => {
    // Listen for browser back/forward navigation
    const handleHashChange = () => setActiveTab(getActiveTabFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
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
    if (!isAuthenticated) {
      setStudentsError("Authentication required to view student data.");
      setIsLoadingStudents(false);
      setPermittedStudents([]);
      return;
    }
    setIsLoadingStudents(true);
    setStudentsError(null);
    try {
      const idToken = useAuthStore.getState().idToken;
      if (!idToken) throw new Error("ID Token not available");
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
  }, [isAuthenticated]);

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

  const handleLogout = () => {
    googleLogout();
    logout();
    navigate("/"); // Navigate to home after logout
  };

  const renderCurrentTab = () => {
    // ... (This function's internal logic is unchanged) ...
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
    <div className={styles.pageWrapper}>
      {/* NEW INSTRUCTOR HEADER with AUTH STATUS */}
      <header className={styles.instructorHeader}>
        <div className={styles.headerMain}>
          <div>
            <h1>Thoughtful Dashboard</h1>
            <Link to="/" className={styles.backToStudentLink}>
              &larr; back to student view
            </Link>
          </div>
          {/* Auth section copied from the main Header.tsx */}
          <div className={styles.authSection}>
            {isAuthenticated && user ? (
              <>
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                    className={styles.profileImage}
                  />
                )}
                <span className={styles.userName}>
                  {user.name || user.email}
                </span>
                <button onClick={handleLogout} className={styles.authButton}>
                  Logout
                </button>
              </>
            ) : (
              <p>Not logged in</p> // Should not be seen due to AuthenticatedRoute
            )}
          </div>
        </div>
        <nav className={styles.instructorNav}>
          {navLinks.map((link) => (
            <Link
              key={link.key}
              to={`#${link.key}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(link.key);
              }}
              className={
                activeTab === link.key
                  ? styles.instructorNavLinkActive
                  : styles.instructorNavLink
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className={styles.mainContentArea}>{renderCurrentTab()}</main>

      <Footer />
    </div>
  );
};

export default InstructorDashboardPage;
