import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom"; // Import routing components
import { googleLogout } from "@react-oauth/google";

import * as apiService from "../lib/apiService";
import { useAuthStore, useAuthActions } from "../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../config";
import type { InstructorStudentInfo } from "../types/apiServiceTypes";
import type { Unit } from "../types/data";
import { fetchUnitsData } from "../lib/dataLoader";

// Import the page/view components
import ReviewClassProgressView from "../components/instructor/ReviewClassProgressView";
import ReviewByAssignmentView from "../components/instructor/ReviewByAssignmentView";
import ReviewStudentDetailView from "../components/instructor/shared/ReviewStudentDetailView";
import LoadingSpinner from "../components/LoadingSpinner";
import Footer from "../components/Footer";
import ReviewByStudentView from "../components/instructor/ReviewByStudentView";
import styles from "./InstructorDashboardPage.module.css";
import ReviewLearningEntriesView from "../components/instructor/ReviewLearningEntriesView";

const navLinks = [
  { path: "/instructor-dashboard/progress", label: "Class Progress" },
  { path: "/instructor-dashboard/assignments", label: "By Assignment" },
  { path: "/instructor-dashboard/students", label: "By Student" },
  {
    path: "/instructor-dashboard/learning-entries",
    label: "Final Learning Entries",
  },
];

const InstructorDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { logout } = useAuthActions();
  const navigate = useNavigate();

  // States to fetch shared data now live here
  const [permittedStudents, setPermittedStudents] = useState<
    InstructorStudentInfo[]
  >([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { idToken, isAuthenticated } = useAuthStore();

  // Fetch data needed by multiple child pages
  useEffect(() => {
    const loadCommonData = async () => {
      if (!isAuthenticated || !idToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const [studentsResponse, unitsData] = await Promise.all([
          apiService.getInstructorPermittedStudents(
            idToken,
            API_GATEWAY_BASE_URL
          ),
          fetchUnitsData(),
        ]);
        setPermittedStudents(studentsResponse.students);
        setAllUnits(unitsData.units);
      } catch (err) {
        setError("Failed to load initial instructor data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCommonData();
  }, [idToken, isAuthenticated]);

  const handleLogout = () => {
    googleLogout();
    logout();
    navigate("/");
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return isActive
      ? `${styles.instructorNavLink} ${styles.instructorNavLinkActive}`
      : styles.instructorNavLink;
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.instructorHeader}>
        <h1>Thoughtful Dashboard</h1>
        <nav className={styles.instructorNav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={getNavLinkClass}
              end // Add the 'end' prop here
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className={styles.mainContentArea}>
        {isLoading ? (
          <LoadingSpinner message="Loading dashboard data..." />
        ) : error ? (
          <p className={styles.errorMessage}>{error}</p>
        ) : (
          <Routes>
            <Route
              index
              element={
                <ReviewClassProgressView
                  units={allUnits}
                  permittedStudents={permittedStudents}
                  isLoadingUnitsGlobal={isLoading}
                  isLoadingStudentsGlobal={isLoading}
                  studentsErrorGlobal={error}
                />
              }
            />
            <Route
              path="progress"
              element={
                <ReviewClassProgressView
                  units={allUnits}
                  permittedStudents={permittedStudents}
                  isLoadingUnitsGlobal={isLoading}
                  isLoadingStudentsGlobal={isLoading}
                  studentsErrorGlobal={error}
                />
              }
            />
            <Route
              path="assignments"
              element={
                <ReviewByAssignmentView
                  units={allUnits}
                  permittedStudents={permittedStudents}
                />
              }
            />
            <Route
              path="students"
              element={
                <ReviewByStudentView permittedStudents={permittedStudents} />
              }
            />
            <Route
              path="students/:studentId"
              element={<ReviewStudentDetailView />}
            />
            <Route
              path="learning-entries"
              element={
                <ReviewLearningEntriesView
                  units={allUnits}
                  permittedStudents={permittedStudents}
                />
              }
            />
          </Routes>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default InstructorDashboardPage;
