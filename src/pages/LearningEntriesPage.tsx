import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./LearningEntriesPage.module.css";
import type { ReflectionHistoryEntry, AssessmentLevel } from "../types/data";

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
  feedback?: string; // Keep in type, but won't render
}

const REFLECTION_KEY_REGEX = /^reflectState_(.+)_([^_]+)$/;

const LearningEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntriesFromLocalStorage = () => {
      setIsLoading(true);
      setError(null);
      const allEntries: DisplayEntry[] = [];
      console.log("Scanning localStorage for reflection entries...");

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);

          if (key) {
            const match = key.match(REFLECTION_KEY_REGEX);

            if (match) {
              const lessonPath = match[1];
              const sectionId = match[2];
              const savedStateJson = localStorage.getItem(key);
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
                      )
                      .forEach((historyEntry, index) => {
                        const lessonNumMatch =
                          lessonPath.match(/lesson_(\d+)$/);
                        const lessonDisplayNumber = lessonNumMatch
                          ? lessonNumMatch[1]
                          : lessonPath;

                        allEntries.push({
                          id: `${lessonPath}-${sectionId}-${index}-${historyEntry.submission.timestamp}`,
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
                    `Error parsing localStorage key ${key}:`,
                    parseError
                  );
                }
              }
            }
          }
        }

        allEntries.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(allEntries);
        console.log(`Found ${allEntries.length} submitted reflection entries.`);
      } catch (scanError) {
        console.error("Error scanning localStorage:", scanError);
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
  }, []);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };
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
          <p>You haven't submitted any learning entries yet.</p>
          <p>
            Go to a Reflection or PRIMM section in a lesson and use the "Submit
            Entry" or equivalent button to add entries here.
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
                  <span className={styles.entryLesson}>
                    <Link to={`/lesson/${entry.lessonPath}`}>{`Lesson ${
                      entry.lessonDisplayNumber || entry.lessonPath
                    }`}</Link>
                  </span>
                  <span className={styles.entryDate}>
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                <h3 className={styles.entryTopic}>
                  {entry.topic
                    ? entry.topic.charAt(0).toUpperCase() + entry.topic.slice(1)
                    : "Untitled Entry"}
                </h3>
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
                {entry.assessment && ( // Only show this block if there's an assessment
                  <div className={styles.entryFeedback}>
                    <h4>AI Assessment:</h4> {/* Changed title */}
                    <div
                      className={`${styles.assessmentBadge} ${getBadgeClass(
                        entry.assessment
                      )}`}
                    >
                      {entry.assessment}
                    </div>
                    {/* The detailed entry.feedback paragraph is now removed */}
                  </div>
                )}
                {/* --- END MODIFIED SECTION --- */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningEntriesPage;
