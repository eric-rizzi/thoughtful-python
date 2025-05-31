// src/pages/InstructorDashboardPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // If you plan to link to student details later
import * as apiService from "../lib/apiService";
import { useAuthStore } from "../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../config";
import type { InstructorStudentInfo } from "../types/apiServiceTypes";
import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./InstructorDashboardPage.module.css"; // Create this CSS module

const InstructorDashboardPage: React.FC = () => {
  const { idToken, isAuthenticated, user } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const [permittedStudents, setPermittedStudents] = useState<
    InstructorStudentInfo[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermittedStudents = useCallback(async () => {
    if (!isAuthenticated || !idToken || !apiGatewayUrl) {
      setError("Authentication required or API not configured.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getInstructorPermittedStudents(
        idToken,
        apiGatewayUrl
      );
      setPermittedStudents(response.students);
    } catch (err) {
      console.error("Failed to fetch permitted students:", err);
      if (err instanceof apiService.ApiError) {
        setError(
          `Error fetching students: ${err.data.message || err.message}${
            err.status === 403
              ? " (Forbidden - You may not have instructor privileges or permissions configured)"
              : ` (Status: ${err.status})`
          }`
        );
      } else if (err instanceof Error) {
        setError(`Error fetching students: ${err.message}`);
      } else {
        setError("An unknown error occurred while fetching students.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, idToken, apiGatewayUrl]);

  useEffect(() => {
    fetchPermittedStudents();
  }, [fetchPermittedStudents]);

  // Placeholder for future navigation or layout
  const renderMainContent = () => {
    if (isLoading) {
      return <LoadingSpinner message="Loading instructor data..." />;
    }
    if (error) {
      return <div className={styles.errorMessage}>{error}</div>;
    }
    return (
      <section className={styles.studentListSection}>
        <h2>Permitted Students</h2>
        {permittedStudents.length > 0 ? (
          <ul className={styles.studentList}>
            {permittedStudents.map((student) => (
              <li key={student.studentId} className={styles.studentListItem}>
                {/* For POC, just show ID. Later, link to student detail page. */}
                <span className={styles.studentId}>{student.studentId}</span>
                {student.studentName && (
                  <span className={styles.studentName}>
                    {" "}
                    ({student.studentName})
                  </span>
                )}
                {student.studentEmail && (
                  <span className={styles.studentEmail}>
                    {" "}
                    - {student.studentEmail}
                  </span>
                )}
                {/* Example for future link:
                  <Link to={`/instructor-dashboard/student/${student.studentId}`}>
                    {student.studentName || student.studentId}
                  </Link> 
                */}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            You do not have permission to view any students yet, or no students
            are assigned.
          </p>
        )}
      </section>
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Instructor Dashboard</h1>
        {/* Basic user info if available */}
        {isAuthenticated && user && <p>Welcome, {user.name || user.email}!</p>}
      </header>

      {/* Basic layout for future expansion */}
      <div className={styles.dashboardLayout}>
        <nav className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Navigation</h3>
          <ul>
            {/* Add links here as you build out more features */}
            <li>
              <Link to="/instructor-dashboard" className={styles.activeLink}>
                My Students
              </Link>
            </li>
            <li>
              <span className={styles.placeholderLink}>
                Class Progress (Soon)
              </span>
            </li>
            <li>
              <span className={styles.placeholderLink}>Settings (Soon)</span>
            </li>
          </ul>
        </nav>
        <main className={styles.mainContent}>{renderMainContent()}</main>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
