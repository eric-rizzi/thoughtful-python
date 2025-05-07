// src/components/sections/ReflectionSection.tsx
import React, { useState, useCallback } from "react"; // Removed useEffect no longer needed for hasFeedback flag
import type {
  ReflectionSection as ReflectionSectionData,
  ReflectionSubmission,
  ReflectionResponse,
  ReflectionHistoryEntry,
  SavedReflectionState,
  AssessmentLevel,
} from "../../types/data";
import styles from "./Section.module.css";
import CodeEditor from "../CodeEditor";
import { useSectionProgress } from "../../hooks/useSectionProgress";

// --- Simulated API Call ---
async function getSimulatedFeedback(
  submission: ReflectionSubmission,
  rubric?: ReflectionSectionData["rubric"]
): Promise<ReflectionResponse> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 100)
  );

  let assessment: AssessmentLevel = "developing";
  let feedback = "";

  if (submission.code.length < 20 || submission.explanation.length < 40) {
    assessment = "developing";
    feedback =
      rubric?.developing ||
      "Your code example or explanation seems a bit brief. Try elaborating more on the concept and how your code demonstrates it.";
  } else if (
    submission.explanation.length > 100 &&
    submission.code.length > 30 &&
    submission.topic.length > 3 // Check if topic is somewhat descriptive
  ) {
    assessment = "exceeds";
    feedback =
      rubric?.exceeds ||
      "Excellent! Your code is clear, and your explanation thoroughly demonstrates a strong understanding of the topic described in your title. You've connected the code well to the concept.";
  } else {
    assessment = "meets";
    feedback =
      rubric?.meets ||
      "Good job! Your code example works and your explanation covers the main points of the topic described in your title.";
  }
  return { feedback, assessment, timestamp: Date.now() };
}
// --- End Simulated API Call ---

interface ReflectionSectionProps {
  section: ReflectionSectionData;
  lessonId: string;
}

const ReflectionSection: React.FC<ReflectionSectionProps> = ({
  section,
  lessonId,
}) => {
  // Input field state remains local
  const [topic, setTopic] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");

  // Runtime state remains local
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // REMOVED hasFeedbackForCurrentContent state and associated useEffect

  const storageKey = `reflectState_${lessonId}_${section.id}`;
  const initialState: SavedReflectionState = { history: [] };

  // Completion check still requires a formally submitted entry with good assessment
  const checkReflectionCompletion = useCallback(
    (currentHookState: SavedReflectionState): boolean => {
      return currentHookState.history.some(
        (entry) =>
          entry.submission.submitted === true &&
          entry.response?.assessment &&
          ["meets", "exceeds"].includes(entry.response.assessment)
      );
    },
    []
  );

  const [reflectionState, setReflectionState, isSectionComplete] =
    useSectionProgress<SavedReflectionState>(
      lessonId,
      section.id,
      storageKey,
      initialState,
      checkReflectionCompletion
    );

  // Get history directly from the hook state
  const history = reflectionState.history;
  const hasEverReceivedFeedback = history.length > 0;

  const handleSubmit = useCallback(
    async (isFormalSubmission: boolean) => {
      if (!topic.trim() || !code.trim() || !explanation.trim()) {
        alert(
          "Please provide a topic/title, code example, and an explanation."
        );
        return;
      }

      if (isFormalSubmission && !hasEverReceivedFeedback) {
        alert(
          "Please click 'Get Feedback' at least once before submitting to the journal."
        );
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const submission: ReflectionSubmission = {
        topic: topic.trim(),
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

        setReflectionState((prevState) => ({
          history: [newHistoryEntry, ...prevState.history],
        }));

        if (isFormalSubmission) {
          // Optional: Clear inputs? Maybe better not to, let user decide.
          // setTopic("");
          // setCode("");
          // setExplanation("");
          alert("Your entry has been submitted and saved to your journal!");
        } else {
          alert(
            "Feedback received! Review the feedback below. You can now submit this version (or an edited one) to your journal."
          );
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
      setReflectionState,
      hasEverReceivedFeedback,
    ]
  );

  // ... (getTopicNameForDisplay, formatDate functions remain the same) ...
  const getTopicNameForDisplay = (topicValue: string): string => {
    if (!topicValue) return "Untitled Entry";
    return topicValue.charAt(0).toUpperCase() + topicValue.slice(1);
  };
  const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleString();

  // Determine if base requirements for enabling *any* button are met
  const canAttemptInteraction =
    !!topic.trim() && !!code.trim() && !!explanation.trim();

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      <div className={styles.reflectionContainer}>
        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${section.id}-topic`}
            className={styles.reflectionLabel}
          >
            {section.prompts.topic || "Entry Topic/Title:"}
          </label>
          <input
            type="text"
            id={`${section.id}-topic`}
            className={styles.topicInput}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter a descriptive title (e.g., Using Loops for Lists)"
          />
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

        <div className={styles.reflectionButtons}>
          <button
            onClick={() => handleSubmit(false)} // Get Feedback
            disabled={isSubmitting || !canAttemptInteraction}
            className={styles.reflectionFeedbackBtn}
            title={
              !canAttemptInteraction ? "Please fill in all fields first" : ""
            }
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={() => handleSubmit(true)} // Submit Entry
            disabled={
              isSubmitting || // Disable if submitting
              !canAttemptInteraction || // Disable if fields empty
              !hasEverReceivedFeedback // Disable if no feedback cycle ever completed
            }
            className={styles.reflectionSubmitBtn}
            title={
              !canAttemptInteraction
                ? "Please fill in all fields first"
                : !hasEverReceivedFeedback
                ? "Please click 'Get Feedback' at least once first"
                : "Submit this entry to your journal"
            }
          >
            {isSubmitting ? "Processing..." : "Submit Entry to Journal"}
          </button>
        </div>

        {error && <p className={styles.apiError}>Error: {error}</p>}

        <div className={styles.reflectionHistory}>
          <h4>
            Submission History {isSectionComplete ? "(Section Complete ✓)" : ""}
          </h4>
          {history.length === 0 ? (
            <p className={styles.noHistory}>No submissions yet.</p>
          ) : (
            history.map((entry, index) => (
              <div
                key={entry.submission.timestamp + "-" + index}
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
                    {/* Display distinct visual cue for "Get Feedback" vs "Submitted to Journal" */}
                    {entry.submission.submitted ? (
                      <span className={styles.submissionBadge}>
                        Submitted to Journal
                      </span>
                    ) : (
                      <span
                        className={`${styles.submissionBadge} ${styles.feedbackOnlyBadge}`}
                      >
                        Feedback Cycle
                      </span>
                    )}
                  </div>
                  <h5>{getTopicNameForDisplay(entry.submission.topic)}</h5>
                  <details>
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
                    {entry.response.assessment && (
                      <div
                        className={`${styles.assessmentBadge} ${
                          styles[
                            `assessmentBadge${
                              entry.response.assessment
                                .charAt(0)
                                .toUpperCase() +
                              entry.response.assessment.slice(1)
                            }`
                          ] || ""
                        }`}
                      >
                        {entry.response.assessment}
                      </div>
                    )}
                    <p>{entry.response.feedback}</p>
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
