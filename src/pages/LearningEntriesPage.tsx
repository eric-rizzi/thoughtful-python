import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./LearningEntriesPage.module.css";
import type { ReflectionHistoryEntry, AssessmentLevel } from "../types/data";

// Define interface for the combined entry data needed for display
interface DisplayEntry {
  id: string; // Unique ID for React key
  timestamp: number;
  lessonId: string;
  topic: string;
  code: string;
  explanation: string;
  assessment?: AssessmentLevel;
  feedback?: string;
}

const LearningEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadEntries = () => {
      setIsLoading(true);
      const allEntries: DisplayEntry[] = [];
      try {
        // Define which lessons might have reflection sections
        // For now, assuming only lesson_7 based on original structure, but you can loop 1 to TOTAL_LESSONS if needed
        const reflectionLessonIds = ["lesson_7"];

        reflectionLessonIds.forEach((lessonId) => {
          // Construct the storage key used by ReflectionSection.tsx
          const storageKey = `reflectState_${lessonId}_python-reflection`; // Matches key in ReflectionSection
          const savedStateJson = localStorage.getItem(storageKey);

          if (savedStateJson) {
            const savedState: { history: ReflectionHistoryEntry[] } =
              JSON.parse(savedStateJson);
            if (savedState?.history) {
              // Filter for entries explicitly submitted to the journal
              savedState.history
                .filter((historyEntry) => historyEntry.submission.submitted)
                .forEach((historyEntry, index) => {
                  allEntries.push({
                    id: `${lessonId}-reflection-${index}-${historyEntry.submission.timestamp}`,
                    timestamp: historyEntry.submission.timestamp,
                    lessonId: lessonId,
                    topic: historyEntry.submission.topic,
                    code: historyEntry.submission.code,
                    explanation: historyEntry.submission.explanation,
                    assessment: historyEntry.response?.assessment,
                    feedback: historyEntry.response?.feedback,
                  });
                });
            }
          }
        });

        // Sort entries by timestamp, newest first
        allEntries.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(allEntries);
      } catch (error) {
        console.error("Error loading learning entries:", error);
        // Optionally set an error state to display to the user
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, []); // Empty dependency array ensures this runs once on mount

  // Helper function to format timestamp
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Helper function to get display name for topic
  const getTopicName = (topicValue: string): string => {
    const topicMap: { [key: string]: string } = {
      variables: "Variables and Data Types",
      functions: "Functions",
      loops: "Loops and Iteration",
      conditions: "Conditional Statements",
      datastructures: "Data Structures",
      turtle: "Turtle Graphics",
      testing: "Testing",
      prediction: "Prediction",
      // Add other topics if needed
    };
    return topicMap[topicValue] || topicValue; // Return value or capitalized value if not mapped
  };

  // Helper function to get the CSS module class for assessment
  const getAssessmentClass = (assessment?: AssessmentLevel): string => {
    if (!assessment) return "";
    // Converts 'developing' to 'assessmentDeveloping', 'meets' to 'assessmentMeets', etc.
    const className = `assessment${
      assessment.charAt(0).toUpperCase() + assessment.slice(1)
    }`;
    return styles[className] || "";
  };

  // Helper function to get the CSS module class for the assessment badge
  const getBadgeClass = (assessment?: AssessmentLevel): string => {
    if (!assessment) return "";
    // Assumes badge styles are named e.g., styles.developing, styles.meets
    return styles[assessment] || "";
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className={styles.learningEntriesSection}>
        <div className={styles.loadingMessage}>
          <p>Loading your learning entries...</p>
          {/* Optional: Add a spinner component */}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.learningEntriesSection}>
      <h2>Your Learning Entries</h2>
      <p className={styles.introText}>
        This page collects all your submitted reflections from the lessons.
      </p>

      {entries.length === 0 ? (
        <div className={styles.noEntriesMessage}>
          <p>You haven't submitted any learning entries yet.</p>
          <p>
            Go to a reflection section in a lesson and use the "Submit Entry"
            button to add entries here.
          </p>
          <Link to="/" className={styles.primaryButton}>
            Go to Home
          </Link>{" "}
        </div>
      ) : (
        <div className={styles.entriesList}>
          {entries.map((entry) => (
            // Use the helper function to apply the assessment class to the card
            <div
              key={entry.id}
              className={`${styles.entryCard} ${getAssessmentClass(
                entry.assessment
              )}`}
            >
              <div className={styles.entryHeader}>
                <div className={styles.entryMeta}>
                  <span className={styles.entryLesson}>
                    From:{" "}
                    <Link to={`/lesson/${entry.lessonId}`}>{`Lesson ${
                      entry.lessonId.split("_")[1]
                    }`}</Link>
                  </span>
                  <span className={styles.entryDate}>
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                <h3 className={styles.entryTopic}>
                  {getTopicName(entry.topic)}
                </h3>
              </div>
              <div className={styles.entryContent}>
                <div className={styles.entryCode}>
                  <h4>Code Example:</h4>
                  <pre>
                    <code>{entry.code}</code>
                  </pre>
                </div>
                <div className={styles.entryExplanation}>
                  <h4>Explanation:</h4>
                  <p>{entry.explanation}</p>
                </div>
                {/* Conditionally render feedback section */}
                {(entry.feedback || entry.assessment) && (
                  <div className={styles.entryFeedback}>
                    <h4>Feedback:</h4>
                    {/* Conditionally render assessment badge */}
                    {entry.assessment && (
                      <div
                        className={`${styles.assessmentBadge} ${getBadgeClass(
                          entry.assessment
                        )}`}
                      >
                        {entry.assessment}
                      </div>
                    )}
                    {/* Conditionally render feedback text */}
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
