// src/pages/LearningEntriesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./LearningEntriesPage.module.css";
import type { ReflectionHistoryEntry, AssessmentLevel } from "../types/data";
import { useAuthStore } from "../stores/authStore";
import { ANONYMOUS_USER_ID_PLACEHOLDER } from "../lib/localStorageUtils";

interface DisplayEntry {
  id: string;
  timestamp: number;
  lessonPath: string;
  lessonDisplayNumber?: string;
  sectionId: string;
  topic: string;
  code: string;
  explanation: string;
  assessment?: AssessmentLevel;
  feedback?: string;
}

const REFLECTION_SUBKEY_PATTERN = /^reflectState_(.+)_([^_]+)$/;

// getTopicNameForDisplay and formatDate functions remain the same
const getTopicNameForDisplay = (topicValue: string): string => {
  if (!topicValue || !topicValue.trim()) return "Untitled Entry";
  const trimmedTopic = topicValue.trim();
  return trimmedTopic.charAt(0).toUpperCase() + trimmedTopic.slice(1);
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const LearningEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const loadEntriesFromLocalStorage = () => {
      setIsLoading(true);
      setError(null);
      const allEntries: DisplayEntry[] = [];

      // Determine the prefix for the keys based on current auth state
      const currentKeyPrefix =
        (isAuthenticated && authUser
          ? authUser.id
          : ANONYMOUS_USER_ID_PLACEHOLDER) + "_";

      console.log(
        `[LearningEntriesPage] Scanning localStorage for keys starting with prefix: "${currentKeyPrefix}" and matching reflection pattern.`
      );

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const fullKey = localStorage.key(i);

          if (fullKey && fullKey.startsWith(currentKeyPrefix)) {
            const subKey = fullKey.substring(currentKeyPrefix.length);
            const match = subKey.match(REFLECTION_SUBKEY_PATTERN);

            if (match) {
              console.log(
                `[LearningEntriesPage] Matched key: ${fullKey}, subKey: ${subKey}`
              );
              const lessonPath = match[1];
              const sectionId = match[2];
              const savedStateJson = localStorage.getItem(fullKey); // Use the fullKey to get item

              if (savedStateJson) {
                try {
                  const savedState: { history: ReflectionHistoryEntry[] } =
                    JSON.parse(savedStateJson);

                  if (
                    savedState?.history &&
                    Array.isArray(savedState.history)
                  ) {
                    savedState.history
                      .filter(
                        (historyEntry) =>
                          historyEntry.submission.submitted === true
                      ) // Only formally submitted
                      .forEach((historyEntry, index) => {
                        const lessonNumMatch =
                          lessonPath.match(/lesson_(\d+)$/);
                        const lessonDisplayNumber = lessonNumMatch
                          ? lessonNumMatch[1]
                          : lessonPath;

                        allEntries.push({
                          id: `${fullKey}-${index}-${historyEntry.submission.timestamp}`, // Ensure unique ID for React key
                          timestamp: historyEntry.submission.timestamp,
                          lessonPath: lessonPath,
                          lessonDisplayNumber: lessonDisplayNumber,
                          sectionId: sectionId,
                          topic: historyEntry.submission.topic,
                          code: historyEntry.submission.code,
                          explanation: historyEntry.submission.explanation,
                          assessment: historyEntry.response?.assessment,
                          feedback: historyEntry.response?.feedback,
                        });
                      });
                  }
                } catch (parseError) {
                  console.error(
                    `[LearningEntriesPage] Error parsing JSON for key ${fullKey}:`,
                    parseError
                  );
                }
              }
            }
          }
        }

        allEntries.sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
        setEntries(allEntries);
        console.log(
          `[LearningEntriesPage] Found ${allEntries.length} submitted reflection entries for current user/session.`
        );
      } catch (scanError) {
        console.error(
          "[LearningEntriesPage] Error scanning localStorage:",
          scanError
        );
        setError(
          scanError instanceof Error
            ? scanError.message
            : "Failed to scan learning entries."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadEntriesFromLocalStorage();
  }, [isAuthenticated, authUser]);

  // ... (rest of the component: getAssessmentClass, getBadgeClass, render logic)
  const getAssessmentClass = (assessment?: AssessmentLevel): string => {
    if (!assessment) return "";
    const className = `assessment${
      assessment.charAt(0).toUpperCase() + assessment.slice(1)
    }`;
    return styles[className] || "";
  };
  const getBadgeClass = (assessment?: AssessmentLevel): string => {
    if (!assessment) return "";
    return styles[assessment] || "";
  };

  if (isLoading) {
    return (
      <div className={styles.learningEntriesSection}>
        <div className={styles.loadingMessage}>
          <p>Scanning for your learning entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.learningEntriesSection}>
        <div className={styles.errorFeedback}>
          {" "}
          {/* Ensure this class exists or use a generic error style */}
          Error loading entries: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.learningEntriesSection}>
      <h2>Your Learning Entries</h2>
      <p className={styles.introText}>
        This page collects all your formally submitted reflections and
        explanations from the lessons, along with the AI's assessment level.
      </p>

      {entries.length === 0 ? (
        <div className={styles.noEntriesMessage}>
          <p>You haven't submitted any learning entries in this session yet.</p>
          <p>
            Go to a Reflection section in a lesson and use the "Submit Entry to
            Journal" button to add entries here.
          </p>
          <Link to="/" className={styles.primaryButton}>
            Go to Home
          </Link>
        </div>
      ) : (
        <div className={styles.entriesList}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.entryCard} ${getAssessmentClass(
                entry.assessment
              )}`}
            >
              <div className={styles.entryHeader}>
                <div className={styles.entryMeta}>
                  <span className={styles.entryTopic}>
                    {getTopicNameForDisplay(entry.topic)}
                  </span>
                  {entry.assessment && (
                    <h3
                      className={`${styles.assessmentBadge} ${getBadgeClass(
                        entry.assessment
                      )}`}
                    >
                      AI Prediction:{" "}
                      {entry.assessment.charAt(0).toUpperCase() +
                        entry.assessment.slice(1)}
                    </h3>
                  )}
                  <span className={styles.entryDate}>
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
              </div>
              <div className={styles.entryContent}>
                {entry.code && (
                  <div className={styles.entryCode}>
                    <h4>Code Example:</h4>
                    <pre>
                      <code>{entry.code}</code>
                    </pre>
                  </div>
                )}
                {entry.explanation && (
                  <div className={styles.entryExplanation}>
                    <h4>Explanation:</h4>
                    <p>{entry.explanation}</p>
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
