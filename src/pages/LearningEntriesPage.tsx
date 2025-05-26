// src/pages/LearningEntriesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./LearningEntriesPage.module.css";
import { useAuthStore } from "../stores/authStore";
import { useApiSettingsStore } from "../stores/apiSettingsStore";
import * as apiService from "../lib/apiService";
import { ReflectionVersionItem } from "../types/apiServiceTypes";

const LearningEntriesPage: React.FC = () => {
  const [finalEntries, setFinalEntries] = useState<ReflectionVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { idToken, isAuthenticated, user } = useAuthStore();
  const apiGatewayUrl = useApiSettingsStore(
    (state) => state.progressApiGateway
  );

  useEffect(() => {
    if (!isAuthenticated || !idToken || !apiGatewayUrl) {
      if (isAuthenticated) {
        // Only set error if auth is expected but config is missing
        setError("API configuration is missing.");
      } else {
        setError("Please log in to view your learning entries.");
      }
      setIsLoading(false);
      setFinalEntries([]);
      return;
    }

    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getFinalizedLearningEntries(
          idToken,
          apiGatewayUrl
        );
        // Sort by createdAt descending (newest first) if not already sorted by API
        const sortedEntries = response.entries.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setFinalEntries(sortedEntries);
      } catch (err) {
        console.error("Failed to fetch finalized learning entries:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load learning entries."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [idToken, apiGatewayUrl, isAuthenticated]);

  const formatDate = (timestamp: string | undefined): string =>
    timestamp ? new Date(timestamp).toLocaleString() : "N/A";

  const getTopicNameForDisplay = (topicValue: string | undefined): string => {
    if (!topicValue || !topicValue.trim()) return "Untitled Entry";
    const trimmedTopic = topicValue.trim();
    return trimmedTopic.charAt(0).toUpperCase() + trimmedTopic.slice(1);
  };

  // Helper to get a displayable lesson number or ID
  const getLessonDisplayIdentifier = (lessonPath: string): string => {
    const match = lessonPath.match(/lesson_(\d+)$/);
    if (match && match[1]) {
      return `Lesson ${match[1]}`;
    }
    const parts = lessonPath.split("/");
    return parts[parts.length - 1] || lessonPath; // Fallback to last part or full path
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className={styles.learningEntriesSection}>
        <h2>Your Learning Entries</h2>
        <div className={styles.noEntriesMessage}>
          <p>Please log in to view your learning journal.</p>
          {/* Login button/functionality would typically be in the Header */}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.learningEntriesSection}>
        <div className={styles.loadingMessage}>
          <p>Loading your learning entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.learningEntriesSection}>
        <div
          className={styles.apiError}
          style={{ textAlign: "center", padding: "2rem" }}
        >
          {" "}
          {/* Re-using apiError style */}
          Error loading entries: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.learningEntriesSection}>
      <h2>Your Learning Journal</h2>
      <p className={styles.introText}>
        This page displays all your finalized reflection entries. The AI
        feedback that qualified these submissions can be found on the original
        draft versions within each lesson.
      </p>

      {finalEntries.length === 0 ? (
        <div className={styles.noEntriesMessage}>
          <p>You haven't submitted any finalized learning entries yet.</p>
          <p>
            Complete reflections in lessons and use the "Submit to Journal"
            button.
          </p>
          <Link to="/" className={styles.primaryButton}>
            Go to Home
          </Link>
        </div>
      ) : (
        <div className={styles.entriesList}>
          {finalEntries.map(
            (
              entry // entry is ReflectionVersionItem where isFinal=true
            ) => (
              <div key={entry.versionId} className={`${styles.entryCard}`}>
                <div className={styles.entryHeader}>
                  <div className={styles.entryMeta}>
                    <span className={styles.entryTopic}>
                      {getTopicNameForDisplay(entry.userTopic)}
                    </span>
                    {/* The qualifying assessment is on the sourceVersionId draft, not directly here */}
                    {/* We could show a generic "Finalized" badge or nothing */}
                    <span className={styles.entryDate}>
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  <span className={styles.entryLesson}>
                    From:{" "}
                    <Link to={`/lesson/${entry.lessonId}#${entry.sectionId}`}>
                      {getLessonDisplayIdentifier(entry.lessonId)} - Section:{" "}
                      {entry.sectionId}
                    </Link>
                    {entry.sourceVersionId && (
                      <small style={{ display: "block", color: "#777" }}>
                        (Based on draft: ...{entry.sourceVersionId.slice(-12)})
                      </small>
                    )}
                  </span>
                </div>
                <div className={styles.entryContent}>
                  {entry.userCode && (
                    <div className={styles.entryCode}>
                      <h4>Code Example:</h4>
                      <pre>
                        <code>{entry.userCode}</code>
                      </pre>
                    </div>
                  )}
                  {entry.userExplanation && (
                    <div className={styles.entryExplanation}>
                      <h4>Your Explanation:</h4>
                      <p>{entry.userExplanation}</p>
                    </div>
                  )}
                </div>
                {/* To show AI feedback here, you would need:
                1. API to return enriched data (which you opted against for this GET list).
                2. Client makes another call per entry using entry.sourceVersionId.
                3. Or, link to the draft in the lesson view where feedback is visible.
                For now, we display a note about where to find feedback.
               */}
                <div
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.85em",
                    color: "#555",
                    borderTop: "1px dashed #eee",
                    paddingTop: "0.75rem",
                  }}
                >
                  <em>
                    The qualifying AI feedback and assessment for this entry can
                    be found on the source draft within the lesson.
                  </em>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default LearningEntriesPage;
