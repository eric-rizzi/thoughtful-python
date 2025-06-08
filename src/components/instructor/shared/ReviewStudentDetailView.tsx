import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import router hooks
import * as apiService from "../../../lib/apiService";
import { useAuthStore } from "../../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../../config";
import type {
  StudentDetailedProgressResponse,
  SectionStatusItem,
} from "../../../types/apiServiceTypes";
import type { UserId } from "../../../types/data";
import LoadingSpinner from "../../LoadingSpinner";
import styles from "./ReviewStudentDetailView.module.css";
import instructorStyles from "../InstructorViews.module.css";
import RenderReflectionVersions from "../shared/RenderReflectionVersions";
import RenderPrimmActivity from "../shared/RenderPrimmActivity";

// This component no longer needs props
const ReviewStudentDetailView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>(); // Get studentId from URL
  const navigate = useNavigate(); // Get the navigate function for the back button

  const [studentProfile, setStudentProfile] =
    useState<StudentDetailedProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] =
    useState<SectionStatusItem | null>(null);

  const { idToken } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!idToken) {
        setError("Not authenticated.");
        setIsLoading(false);
        return;
      }
      if (!studentId) {
        setError("Student ID not found in URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const profileData = await apiService.getStudentDetailedProgress(
          idToken,
          API_GATEWAY_BASE_URL,
          studentId as UserId
        );
        setStudentProfile(profileData);
      } catch (err) {
        if (err instanceof apiService.ApiError) {
          setError(`Error: ${err.data.message || err.message}`);
        } else {
          setError(
            "An unknown error occurred while fetching the student profile."
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [studentId, idToken]);

  const handleBack = () => {
    navigate("/instructor-dashboard/students"); // Always navigate back to the main student list page
  };

  // ... (renderStatusBadge and renderSubmissionModal functions remain the same)
  const renderStatusBadge = (
    status: "completed" | "submitted" | "not_started"
  ) => {
    const statusClassMap = {
      completed: styles.statusCompleted,
      submitted: styles.statusSubmitted,
      not_started: styles.statusNotStarted,
    };
    const statusText = status.replace("_", " ");
    return (
      <span className={`${styles.statusBadge} ${statusClassMap[status]}`}>
        {statusText}
      </span>
    );
  };

  const renderSubmissionModal = () => {
    if (!viewingSubmission || !viewingSubmission.submissionDetails) return null;

    const { sectionKind, submissionDetails, sectionTitle, sectionId } =
      viewingSubmission;

    return (
      <div
        className={styles.modalBackdrop}
        onClick={() => setViewingSubmission(null)}
      >
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          {sectionKind === "Reflection" && Array.isArray(submissionDetails) && (
            <RenderReflectionVersions versions={submissionDetails} />
          )}
          {sectionKind === "PRIMM" && !Array.isArray(submissionDetails) && (
            <RenderPrimmActivity
              submission={submissionDetails}
              lessonTitle={sectionTitle}
              sectionId={sectionId}
            />
          )}
          <button
            onClick={() => setViewingSubmission(null)}
            className={styles.closeButton}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  if (isLoading)
    return <LoadingSpinner message="Loading student's detailed progress..." />;
  if (error) return <p className={instructorStyles.errorMessage}>{error}</p>;
  if (!studentProfile)
    return (
      <p className={instructorStyles.placeholderMessage}>
        No profile data available for this student.
      </p>
    );

  return (
    <div className={styles.viewContainer}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          &larr; Back to Student List
        </button>
        <h3>{studentProfile.studentName || studentProfile.studentId}</h3>
      </div>
      {/* ... rest of the rendering logic remains the same ... */}
      {studentProfile.profile.map((unit) => (
        <details key={unit.unitId} className={styles.unitAccordion} open>
          <summary className={styles.unitSummary}>
            <span>{unit.unitTitle}</span>
          </summary>
          <div className={styles.unitDetails}>
            {unit.lessons.map((lesson) => (
              <div key={lesson.lessonId} className={styles.lessonBlock}>
                <h5>{lesson.lessonTitle}</h5>
                <ul className={styles.sectionList}>
                  {lesson.sections.map((section) => (
                    <li key={section.sectionId} className={styles.sectionItem}>
                      <span className={styles.sectionTitle}>
                        {section.sectionTitle}
                      </span>
                      <div>
                        {renderStatusBadge(section.status)}
                        {section.status === "submitted" && (
                          <button
                            className={styles.viewSubmissionButton}
                            onClick={() => setViewingSubmission(section)}
                          >
                            View Submission
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      ))}
      {renderSubmissionModal()}
    </div>
  );
};

export default ReviewStudentDetailView;
