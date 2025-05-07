// src/pages/LearningEntriesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./LearningEntriesPage.module.css";
import type { ReflectionHistoryEntry, AssessmentLevel } from "../types/data";

// DisplayEntry interface remains mostly the same
interface DisplayEntry {
  id: string;
  timestamp: number;
  lessonPath: string; // Store the full path found in the key
  lessonDisplayNumber?: string; // Optional display number extracted from path
  sectionId: string; // Store the section ID found in the key
  topic: string;
  code: string;
  explanation: string;
  assessment?: AssessmentLevel;
  feedback?: string;
}

// Regex to match the keys used by ReflectionSection and capture parts
// Pattern: starts with 'reflectState_', then captures lessonPath (non-greedy), ends with '_', captures sectionId
// Note: This assumes lessonPath and sectionId don't contain underscores themselves in a problematic way.
// If they can, the regex might need refinement (e.g., matching known section ID patterns at the end).
const REFLECTION_KEY_REGEX = /^reflectState_(.+)_([^_]+)$/;

const LearningEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Keep error state

  useEffect(() => {
    const loadEntriesFromLocalStorage = () => {
      setIsLoading(true);
      setError(null);
      const allEntries: DisplayEntry[] = [];
      console.log("Scanning localStorage for reflection entries...");

      try {
        // Iterate through all keys in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);

          if (key) {
            // Check if the key matches our reflection state pattern
            const match = key.match(REFLECTION_KEY_REGEX);

            if (match) {
              const lessonPath = match[1]; // Captured lesson path (e.g., "lesson_7", "strings/lesson_11")
              const sectionId = match[2]; // Captured section ID (e.g., "python-reflection")
              // console.log(`Found potential reflection key: ${key}, Path: ${lessonPath}, Section: ${sectionId}`);

              const savedStateJson = localStorage.getItem(key);
              if (savedStateJson) {
                try {
                  // Parse the stored JSON
                  const savedState: { history: ReflectionHistoryEntry[] } =
                    JSON.parse(savedStateJson);

                  if (
                    savedState?.history &&
                    Array.isArray(savedState.history)
                  ) {
                    // Filter for entries formally submitted
                    savedState.history
                      .filter(
                        (historyEntry) =>
                          historyEntry.submission.submitted === true
                      )
                      .forEach((historyEntry, index) => {
                        // Attempt to extract a simple lesson number for display
                        const lessonNumMatch =
                          lessonPath.match(/lesson_(\d+)$/);
                        const lessonDisplayNumber = lessonNumMatch
                          ? lessonNumMatch[1]
                          : lessonPath; // Fallback to full path

                        allEntries.push({
                          id: `${lessonPath}-${sectionId}-${index}-${historyEntry.submission.timestamp}`, // Unique key
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
                  // Decide how to handle parse errors: skip key, show error?
                  // For now, we just log it and continue.
                }
              }
            }
          }
        }

        // Sort entries by timestamp, newest first
        allEntries.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(allEntries);
        console.log(`Found ${allEntries.length} submitted reflection entries.`);
      } catch (scanError) {
        // Catch potential errors during the scan itself (less likely)
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
  }, []); // Run only on mount

  // ... (Helper functions: formatDate, getTopicName, getAssessmentClass, getBadgeClass remain the same) ...
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

  // --- Render Logic (remains the same as previous version) ---
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
        explanations from the lessons.
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
                {(entry.feedback || entry.assessment) && (
                  <div className={styles.entryFeedback}>
                    <h4>Feedback:</h4>
                    {entry.assessment && (
                      <div
                        className={`${styles.assessmentBadge} ${getBadgeClass(
                          entry.assessment
                        )}`}
                      >
                        {entry.assessment}
                      </div>
                    )}
                    {entry.feedback && <p>{entry.feedback}</p>}
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
