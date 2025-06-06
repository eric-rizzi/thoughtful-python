// src/pages/LearningEntriesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./LearningEntriesPage.module.css";
import { useAuthStore } from "../stores/authStore";
import * as apiService from "../lib/apiService";
import { ReflectionVersionItem } from "../types/apiServiceTypes";
import { API_GATEWAY_BASE_URL } from "../config";
import LoadingSpinner from "../components/LoadingSpinner";
import { IsoTimestamp } from "../types/data";

const LearningEntriesPage: React.FC = () => {
  const [finalEntries, setFinalEntries] = useState<ReflectionVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { idToken, isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  useEffect(() => {
    if (!isAuthenticated || !idToken || !apiGatewayUrl) {
      if (isAuthenticated) {
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

  const formatDate = (timestamp: IsoTimestamp | undefined): string =>
    timestamp ? new Date(timestamp).toLocaleString() : "N/A";

  const getTopicNameForDisplay = (topicValue: string | undefined): string => {
    if (!topicValue || !topicValue.trim()) return "Untitled Entry";
    const trimmedTopic = topicValue.trim();
    return trimmedTopic.charAt(0).toUpperCase() + trimmedTopic.slice(1);
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className={styles.learningEntriesSection}>
        <h2>Your Learning Entries</h2>
        <div className={styles.noEntriesMessage}>
          <p>Please log in to view your learning journal.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.learningEntriesSection}>
        <LoadingSpinner message="Loading your learning entries..." />
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
          {finalEntries.map((entry) => (
            <div key={entry.versionId} className={`${styles.entryCard}`}>
              <div className={styles.entryHeader}>
                <div className={styles.entryMeta}>
                  <span className={styles.entryTopic}>
                    {getTopicNameForDisplay(entry.userTopic)}
                  </span>
                  <span className={styles.entryDate}>
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {entry.userExplanation}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningEntriesPage;
