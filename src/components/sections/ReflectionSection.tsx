// src/components/sections/ReflectionSection.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  ReflectionSection as ReflectionSectionData,
  ReflectionSubmission,
  ReflectionResponse,
  ReflectionHistoryEntry,
  SavedReflectionState,
  AssessmentLevel,
} from "../../types/data";
import styles from "./Section.module.css";
import { saveProgress, loadProgress } from "../../lib/localStorageUtils";
import CodeEditor from "../CodeEditor";

interface ReflectionSectionProps {
  section: ReflectionSectionData;
  lessonId: string;
  onSectionComplete: (sectionId: string) => void;
}

// --- Simulated API Call ---
// Replace this with your actual API call logic later
async function getSimulatedFeedback(
  submission: ReflectionSubmission,
  rubric?: ReflectionSectionData["rubric"]
): Promise<ReflectionResponse> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 1000)
  );

  // Simulate simple analysis based on length and keywords
  let assessment: AssessmentLevel = "developing";
  let feedback = "";
  const codeLower = submission.code.toLowerCase();
  const explanationLower = submission.explanation.toLowerCase();

  const topicKeywords: { [key: string]: string[] } = {
    variables: ["variable", "type", "assign", "integer", "string", "boolean"],
    functions: ["def", "return", "parameter", "argument", "call"],
    loops: ["for", "while", "iterate", "loop", "range"],
    conditions: ["if", "else", "elif", "condition", "boolean"],
    datastructures: [
      "list",
      "dictionary",
      "set",
      "tuple",
      "append",
      "key",
      "value",
    ],
    turtle: ["turtle", "forward", "left", "right", "penup", "pendown"],
  };

  const relevantKeywords = topicKeywords[submission.topic] || [];
  const keywordMatch = relevantKeywords.some(
    (kw) => codeLower.includes(kw) || explanationLower.includes(kw)
  );

  if (submission.code.length < 20 || submission.explanation.length < 40) {
    assessment = "developing";
    feedback =
      rubric?.developing ||
      "Your code example or explanation seems a bit brief. Try elaborating more on the concept and how your code demonstrates it.";
  } else if (
    submission.explanation.length > 100 &&
    keywordMatch &&
    submission.code.length > 30
  ) {
    assessment = "exceeds";
    feedback =
      rubric?.exceeds ||
      "Excellent! Your code is clear, and your explanation thoroughly demonstrates a strong understanding of the topic. You've connected the code well to the concept.";
  } else {
    assessment = "meets";
    feedback =
      rubric?.meets ||
      "Good job! Your code example works and your explanation covers the main points of the topic.";
  }

  // Simulate occasional "error" for testing
  // if (Math.random() < 0.1) { throw new Error("Simulated API error"); }

  return {
    feedback,
    assessment,
    timestamp: Date.now(),
  };
}
// --- End Simulated API Call ---

const ReflectionSection: React.FC<ReflectionSectionProps> = ({
  section,
  lessonId,
  onSectionComplete,
}) => {
  const [topic, setTopic] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [history, setHistory] = useState<ReflectionHistoryEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = `reflectState_${lessonId}_${section.id}`;

  // Load saved history on mount
  useEffect(() => {
    const savedState = loadProgress<SavedReflectionState>(storageKey);
    if (savedState?.history) {
      setHistory(savedState.history);
      // Check if already completed based on loaded history
      const alreadyComplete = savedState.history.some(
        (entry) =>
          entry.response?.assessment &&
          ["meets", "exceeds"].includes(entry.response.assessment)
      );
      if (alreadyComplete) {
        // Optionally call onSectionComplete directly if loaded state shows completion
        // onSectionComplete(section.id);
      }
    }
  }, [storageKey /*, section.id, onSectionComplete*/]); // Avoid running onSectionComplete in initial load effect

  const handleSubmit = useCallback(
    async (isFormalSubmission: boolean) => {
      // Basic validation
      if (!topic || !code.trim() || !explanation.trim()) {
        alert(
          "Please select a topic, write some code, and provide an explanation."
        );
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const submission: ReflectionSubmission = {
        topic,
        code,
        explanation,
        timestamp: Date.now(),
        submitted: isFormalSubmission,
      };

      try {
        const response = await getSimulatedFeedback(submission, section.rubric);

        const newHistoryEntry: ReflectionHistoryEntry = {
          submission,
          response,
        };

        // Update history state and save
        setHistory((prevHistory) => {
          const updatedHistory = [newHistoryEntry, ...prevHistory]; // Add to front
          const stateToSave: SavedReflectionState = { history: updatedHistory };
          saveProgress(storageKey, stateToSave);
          return updatedHistory;
        });

        // Clear inputs after successful submission
        // setTopic(''); // Keep topic maybe?
        setCode("");
        setExplanation("");

        // Check for completion
        if (
          response.assessment === "meets" ||
          response.assessment === "exceeds"
        ) {
          onSectionComplete(section.id);
        }

        if (isFormalSubmission) {
          alert("Your entry has been submitted and saved!"); // Inform user
        }
      } catch (err) {
        console.error("Feedback submission error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to get feedback. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      topic,
      code,
      explanation,
      section.rubric,
      section.id,
      history,
      onSectionComplete,
      storageKey,
    ]
  ); // Added history dependency

  // Helper to get topic display name
  const getTopicName = (topicValue: string): string => {
    const optionElement = document.querySelector(
      `#${section.id}-topic option[value="${topicValue}"]`
    );
    return optionElement?.textContent || topicValue;
  };

  // Format date utility
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Adjust format as needed
  };

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      <div className={styles.reflectionContainer}>
        {/* Input Fields */}
        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${section.id}-topic`}
            className={styles.reflectionLabel}
          >
            {section.prompts.topic || "Choose a topic:"}
          </label>
          <select
            id={`${section.id}-topic`}
            className={styles.topicSelector}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isSubmitting}
          >
            {/* TODO: Populate options dynamically or ensure they match JSON */}
            <option value="">Select a topic...</option>
            <option value="variables">Variables and Data Types</option>
            <option value="functions">Functions</option>
            <option value="loops">Loops and Iteration</option>
            <option value="conditions">Conditional Statements</option>
            <option value="datastructures">
              Data Structures (Lists, Dictionaries)
            </option>
            <option value="turtle">Turtle Graphics</option>
            <option value="testing">Testing</option>
            <option value="prediction">Prediction</option>
            {/* Add more based on your lessons */}
          </select>
        </div>

        <div className={styles.reflectionInputGroup}>
          <label className={styles.reflectionLabel}>
            {section.prompts.code || "Code Example:"}
          </label>
          <div className={styles.reflectionCodeEditorWrapper}>
            <CodeEditor
              value={code}
              onChange={setCode}
              readOnly={isSubmitting}
              // Set height/minHeight if needed
              minHeight="150px"
            />
          </div>
        </div>

        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${section.id}-explanation`}
            className={styles.reflectionLabel}
          >
            {section.prompts.explanation || "Explanation:"}
          </label>
          <textarea
            id={`${section.id}-explanation`}
            className={styles.reflectionExplanation}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            disabled={isSubmitting}
            placeholder="Explain your code example here (3-4 sentences)..."
          />
        </div>

        {/* Buttons */}
        <div className={styles.reflectionButtons}>
          <button
            onClick={() => handleSubmit(false)}
            disabled={
              isSubmitting || !topic || !code.trim() || !explanation.trim()
            }
            className={styles.reflectionFeedbackBtn}
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={
              isSubmitting || !topic || !code.trim() || !explanation.trim()
            }
            className={styles.reflectionSubmitBtn}
          >
            {isSubmitting ? "Processing..." : "Submit Entry"}
          </button>
        </div>

        {/* API Error Display */}
        {error && <p className={styles.apiError}>Error: {error}</p>}

        {/* History Display */}
        <div className={styles.reflectionHistory}>
          <h4>Submission History</h4>
          {history.length === 0 ? (
            <p className={styles.noHistory}>No submissions yet.</p>
          ) : (
            history.map((entry, index) => (
              <div
                key={entry.submission.timestamp + "-" + index} // Combine for more uniqueness
                className={`${styles.reflectionCard} ${
                  entry.response?.assessment
                    ? styles[
                        `cardAssessment${
                          entry.response.assessment.charAt(0).toUpperCase() +
                          entry.response.assessment.slice(1)
                        }`
                      ]
                    : ""
                }`}
              >
                <div className={styles.reflectionSubmission}>
                  <div className={styles.reflectionHeader}>
                    <span className={styles.reflectionDate}>
                      {formatDate(entry.submission.timestamp)}
                    </span>
                    {entry.submission.submitted && (
                      <span className={styles.submissionBadge}>
                        Submitted to Journal
                      </span>
                    )}
                  </div>
                  <h5>Topic: {getTopicName(entry.submission.topic)}</h5>
                  <details>
                    {" "}
                    {/* Use details/summary for collapsibility */}
                    <summary style={{ cursor: "pointer", fontWeight: "500" }}>
                      Show Code & Explanation
                    </summary>
                    <div className={styles.reflectionCodeDisplay}>
                      <pre>
                        <code>{entry.submission.code}</code>
                      </pre>
                    </div>
                    <div className={styles.reflectionExplanationDisplay}>
                      <p>{entry.submission.explanation}</p>
                    </div>
                  </details>
                </div>
                {entry.response && (
                  <div className={styles.reflectionResponse}>
                    <h5>Feedback ({formatDate(entry.response.timestamp)}):</h5>
                    <div
                      className={
                        styles[
                          `assessmentBadge${
                            entry.response.assessment.charAt(0).toUpperCase() +
                            entry.response.assessment.slice(1)
                          }`
                        ]
                      }
                    >
                      {entry.response.assessment}
                    </div>
                    <p>{entry.response.feedback}</p>
                  </div>
                )}
                {!entry.response &&
                  isSubmitting &&
                  index === 0 && ( // Show loading only for the latest if still submitting
                    <div className={styles.reflectionResponse}>
                      <p>
                        <i>Getting feedback...</i>
                      </p>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ReflectionSection;
