// src/components/sections/ReflectionSection.tsx
import React, { useState, useCallback, useEffect } from "react";
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
import { loadProgress } from "../../lib/localStorageUtils"; // Import loadProgress

// Define the interface for ChatBot configuration as saved by ConfigurationPage
interface ChatBotConfig {
  progressApiGateway: string;
  chatbotVersion: string;
  chatbotApiKey: string;
}

const CONFIG_STORAGE_KEY = "chatbot_config";

// --- Refactored API Call Function ---
async function sendFeedbackToChatBot(
  submission: ReflectionSubmission,
  rubric: ReflectionSectionData["rubric"] | undefined, // Pass rubric for context
  chatbotVersion: string,
  chatbotApiKey: string
): Promise<ReflectionResponse> {
  if (!chatbotVersion || !chatbotApiKey) {
    throw new Error(
      "ChatBot version or API Key not configured. Please go to the Configuration page."
    );
  }

  const API_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/";
  const modelId = chatbotVersion; // Use the configured version as the model ID
  const endpoint = `${API_BASE_URL}${modelId}:generateContent?key=${chatbotApiKey}`;

  const prompt = `
    You are an automated Python code assessor. Your task is to evaluate a student's Python code example and explanation based on a specified topic. Provide constructive feedback and an assessment level.

    **Topic:** ${submission.topic}

    **Student's Code:**
    \`\`\`python
    ${submission.code}
    \`\`\`

    **Student's Explanation:**
    ${submission.explanation}

    **Rubric for Assessment Levels:**
    - **developing**: The code is incomplete, has significant errors, or the explanation doesn't clearly show how requirements were met. Feedback should guide the student to address fundamental issues.
    - **meets**: The code is functional and the explanation adequately describes how the concept was implemented. Feedback should confirm understanding and suggest minor improvements.
    - **exceeds**: The code is well-structured, creative, and the explanation clearly and thoroughly details how multiple requirements were met, possibly highlighting clever solutions or insights. Feedback should commend strong understanding and suggest advanced considerations.

    **Provide your response in a concise format. Start with the assessment level, then provide the feedback. For example:
    Assessment: meets
    Feedback: Your code is clear and your explanation is accurate. Consider adding more comments to your code for readability.**

    Based on the provided submission and rubric, assess the student's work and provide feedback.
    `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("ChatBot API Error:", errorData);
      throw new Error(
        `ChatBot API request failed: ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("ChatBot did not return any content.");
    }

    // --- Simplified Parsing of LLM Response for Assessment ---
    // A more robust solution would involve more sophisticated NLP or a structured API response.
    let assessment: AssessmentLevel = "developing"; // Default
    let feedbackMessage = generatedText.trim(); // Use full text as feedback by default

    const lowerCaseText = generatedText.toLowerCase();
    if (lowerCaseText.includes("assessment: exceeds")) {
      assessment = "exceeds";
    } else if (lowerCaseText.includes("assessment: meets")) {
      assessment = "meets";
    } else if (lowerCaseText.includes("assessment: developing")) {
      assessment = "developing";
    }

    // Attempt to extract feedback by looking for "Feedback:" marker
    const feedbackMatch = generatedText.match(/Feedback:\s*([\s\S]*)/i);
    if (feedbackMatch && feedbackMatch[1]) {
      feedbackMessage = feedbackMatch[1].trim();
    } else {
      // If "Feedback:" marker not found, assume the whole text is feedback
      feedbackMessage = generatedText.trim();
    }
    // --- End Simplified Parsing ---

    return { feedback: feedbackMessage, assessment, timestamp: Date.now() };
  } catch (error) {
    console.error("Error communicating with ChatBot API:", error);
    throw new Error(
      `Failed to get feedback from ChatBot: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
// --- End Refactored API Call Function ---

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

  // State for ChatBot configuration
  const [chatbotVersion, setChatbotVersion] = useState<string>("");
  const [chatbotApiKey, setChatbotApiKey] = useState<string>("");

  // Load ChatBot configuration on mount
  useEffect(() => {
    const savedConfig = loadProgress<ChatBotConfig>(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      setChatbotVersion(savedConfig.chatbotVersion || "");
      setChatbotApiKey(savedConfig.chatbotApiKey || "");
    }
  }, []);

  const storageKey = `reflectState_${lessonId}_${section.id}`;
  const initialState: SavedReflectionState = { history: [] };

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

      if (!chatbotVersion || !chatbotApiKey) {
        setError(
          "ChatBot configuration missing. Please set the ChatBot Version and API Key on the Configuration page."
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
        // Use the refactored function to send feedback to the ChatBot
        const response = await sendFeedbackToChatBot(
          submission,
          section.rubric, // Pass rubric for context
          chatbotVersion,
          chatbotApiKey
        );
        const newHistoryEntry: ReflectionHistoryEntry = {
          submission,
          response,
        };

        setReflectionState((prevState) => ({
          history: [newHistoryEntry, ...prevState.history],
        }));

        if (isFormalSubmission) {
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
      chatbotVersion, // Add as dependency
      chatbotApiKey, // Add as dependency
    ]
  );

  const getTopicNameForDisplay = (topicValue: string): string => {
    if (!topicValue) return "Untitled Entry";
    return topicValue.charAt(0).toUpperCase() + topicValue.slice(1);
  };
  const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleString();

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
            disabled={
              isSubmitting ||
              !canAttemptInteraction ||
              !chatbotVersion ||
              !chatbotApiKey
            }
            className={styles.reflectionFeedbackBtn}
            title={
              !canAttemptInteraction
                ? "Please fill in all fields first"
                : !chatbotVersion || !chatbotApiKey
                ? "Please configure ChatBot API Key and Version in settings"
                : ""
            }
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={() => handleSubmit(true)} // Submit Entry
            disabled={
              isSubmitting || // Disable if submitting
              !canAttemptInteraction || // Disable if fields empty
              !hasEverReceivedFeedback || // Disable if no feedback cycle ever completed
              !chatbotVersion ||
              !chatbotApiKey // Disable if ChatBot not configured
            }
            className={styles.reflectionSubmitBtn}
            title={
              !canAttemptInteraction
                ? "Please fill in all fields first"
                : !hasEverReceivedFeedback
                ? "Please click 'Get Feedback' at least once first"
                : !chatbotVersion || !chatbotApiKey
                ? "Please configure ChatBot API Key and Version in settings"
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
