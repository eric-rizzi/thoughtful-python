// src/components/sections/ReflectionSection.tsx
import React, { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ReflectionSection as ReflectionSectionData,
  ReflectionSubmission,
  ReflectionResponse,
  ReflectionHistoryEntry,
  SavedReflectionState,
  AssessmentLevel,
} from "../../types/data";
import styles from "./Section.module.css"; // Main section styles
// Make sure you have specific reflection styles or integrate them into Section.module.css
// For example: import reflectionStyles from './ReflectionSection.module.css';
// And then use reflectionStyles.topicInput, etc. or ensure styles.topicInput exists.
// For this example, I'll assume relevant styles like styles.topicInput, styles.reflectionContainer etc. exist.

import CodeEditor from "../CodeEditor";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import { useAuthStore } from "../../stores/authStore";
import {
  loadProgress,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../../lib/localStorageUtils";

// Define the type for ChatBotConfig expected from localStorage
interface ChatBotConfig {
  chatbotVersion: string;
  chatbotApiKey: string;
}
const CONFIG_STORAGE_KEY = "chatbot_config";

const STABLE_INITIAL_REFLECTION_STATE: SavedReflectionState = { history: [] };

// sendFeedbackToChatBot function (assuming it's defined in this file or imported)
// For brevity, I'm not redefining it here if it's unchanged from your working version.
// Ensure it correctly returns: Promise<ReflectionResponse>
// where ReflectionResponse = { feedback: string, assessment: AssessmentLevel, timestamp: number }
async function sendFeedbackToChatBot(
  submission: ReflectionSubmission,
  chatbotVersion: string,
  chatbotApiKey: string
): Promise<ReflectionResponse> {
  // ... (Your existing sendFeedbackToChatBot implementation)
  // Ensure it parses and returns an 'assessment' field of type AssessmentLevel
  // Example (ensure your actual parsing logic is robust):
  if (!chatbotVersion || !chatbotApiKey) {
    throw new Error("ChatBot version or API Key not configured.");
  }
  const API_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/";
  const modelId = chatbotVersion;
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
    | Objective | Requirements/Specifications | Achieves | Mostly | Developing | Insufficient |
    | :---- | :---- | :---- | :---- | :---- | :---- |
    | Well-written: Entry is well-written and displays level of care expected in other, writing-centered classes | Entry is brief and to the point: it is no longer than it has to be. Entry uses proper terminology. Entry has no obvious spelling mistakes Entry uses proper grammar  | Entry is of high quality without any obvious errors or extraneous information | Entry contains one or two errors and could only be shortened a little | Entry contains many errors and has a lot of unnecessary, repetitive information. |  |
    | Thoughtful: Entry includes analysis that is easy to understand and could prove useful in the future | Analysis is about a topic that could conceivably come up in a future CS class. Analysis identifies single possible point of confusion. Analysis eliminates all possible confusion on the topic. Analysis references example. The phrase “as seen in the example” present in entry. | All requirements met. | Entry contains all but one of the requirements. | Entry's analysis is superficial an unfocused. |  |
    | Grounded: Entry includes a pertinent example that gets to the heart of the topic being discussed. | Example highlights issue being discussed. Example doesn't include unnecessary, extraneous details or complexity. Example is properly formatted. Example doesn't include any obvious programming errors. | All requirements met | Entry contains all but one or two of the requirements. | Entry's example is difficult to understand or doesn't relate to the topic being discussed. |  | 
    **Provide your response in a concise format. Start with the assessment level, then provide the feedback. For example:
    Assessment: Mostly
    Feedback: Your code is clear...**`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message ||
        `ChatBot API request failed: ${response.statusText}`
    );
  }
  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let assessment: AssessmentLevel = "developing";
  let feedbackMessage = generatedText.trim();
  const assessmentMatch = generatedText.match(
    /Assessment:\s*(achieves|mostly there|mostly|developing|insufficient)/i
  );
  if (assessmentMatch?.[1]) {
    const level = assessmentMatch[1].toLowerCase();
    assessment = (
      level === "mostly there" ? "mostly" : level
    ) as AssessmentLevel;
  }
  const feedbackMatch = generatedText.match(/Feedback:\s*([\s\S]*)/i);
  if (feedbackMatch?.[1]) feedbackMessage = feedbackMatch[1].trim();
  else if (assessmentMatch)
    feedbackMessage = generatedText.substring(assessmentMatch[0].length).trim();
  return { feedback: feedbackMessage, assessment, timestamp: Date.now() };
}

interface ReflectionSectionProps {
  section: ReflectionSectionData;
  lessonId: string;
}

const ReflectionSection: React.FC<ReflectionSectionProps> = ({
  section,
  lessonId,
}) => {
  const [topic, setTopic] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [chatbotVersion, setChatbotVersion] = useState<string>("");
  const [chatbotApiKey, setChatbotApiKey] = useState<string>("");

  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const currentStorageUserId =
      isAuthenticated && authUser ? authUser.id : ANONYMOUS_USER_ID_PLACEHOLDER;
    const savedConfig = loadProgress<ChatBotConfig>(
      currentStorageUserId,
      CONFIG_STORAGE_KEY
    );
    if (savedConfig) {
      setChatbotVersion(savedConfig.chatbotVersion || "");
      setChatbotApiKey(savedConfig.chatbotApiKey || "");
    } else {
      setChatbotVersion("");
      setChatbotApiKey("");
    }
  }, [isAuthenticated, authUser]);

  const storageKey = `reflectState_${lessonId}_${section.id}`;

  const checkReflectionCompletion = useCallback(
    (currentHookState: SavedReflectionState): boolean => {
      return currentHookState.history.some(
        (entry) =>
          entry.submission.submitted === true &&
          entry.response?.assessment &&
          ["achieves", "mostly"].includes(entry.response.assessment)
      );
    },
    []
  );

  const [reflectionState, setReflectionState, isSectionComplete] =
    useSectionProgress<SavedReflectionState>(
      lessonId,
      section.id,
      storageKey,
      STABLE_INITIAL_REFLECTION_STATE,
      checkReflectionCompletion
    );

  const handleSubmit = useCallback(
    async (isFormalSubmission: boolean) => {
      if (!topic.trim() || !code.trim() || !explanation.trim()) {
        alert(
          "Please provide a topic/title, code example, and an explanation."
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

      if (isFormalSubmission) {
        // Logic for "Submit Entry to Journal"
        const latestEntry =
          reflectionState.history.length > 0
            ? reflectionState.history[0]
            : null;
        const currentAssessment = latestEntry?.response?.assessment;
        const qualifiesForJournal =
          currentAssessment &&
          ["achieves", "mostly"].includes(currentAssessment);

        if (!qualifiesForJournal) {
          alert(
            "To submit to the journal, your latest reflection feedback must have an assessment of 'achieves' or 'mostly'.\nPlease use the 'Get Feedback' button to get an assessment on your current entry. If the assessment is adequate, you can then submit that version to the journal."
          );
          setIsSubmitting(false);
          return;
        }

        const journalSubmission: ReflectionSubmission = {
          topic: topic.trim(),
          code,
          explanation,
          timestamp: Date.now(),
          submitted: true, // Mark as formally submitted
        };

        // Re-use the latest qualifying feedback for this journal entry
        const journalEntry: ReflectionHistoryEntry = {
          submission: journalSubmission,
          response: latestEntry!.response, // We know latestEntry and response exist due to qualifiesForJournal
        };

        setReflectionState((prevState) => ({
          history: [journalEntry, ...prevState.history],
        }));
        alert("Your entry has been submitted and saved to your journal!");
        setIsSubmitting(false);
      } else {
        // Logic for "Get Feedback"
        const currentSubmissionForFeedback: ReflectionSubmission = {
          topic: topic.trim(),
          code,
          explanation,
          timestamp: Date.now(),
          submitted: false, // This is just a feedback cycle
        };
        try {
          console.log(
            "[ReflectionSection] Getting feedback from ChatBot for:",
            currentSubmissionForFeedback
          );
          const response = await sendFeedbackToChatBot(
            currentSubmissionForFeedback,
            chatbotVersion,
            chatbotApiKey
          );
          console.log("[ReflectionSection] ChatBot Response:", response);
          const newHistoryEntry: ReflectionHistoryEntry = {
            submission: currentSubmissionForFeedback,
            response,
          };
          setReflectionState((prevState) => ({
            history: [newHistoryEntry, ...prevState.history],
          }));
        } catch (err) {
          console.error("[ReflectionSection] Feedback submission error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to get feedback. Please try again."
          );
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [
      topic,
      code,
      explanation,
      chatbotVersion,
      chatbotApiKey,
      setReflectionState,
      reflectionState.history, // reflectionState.history is crucial here
    ]
  );

  const canAttemptInteraction =
    !!topic.trim() && !!code.trim() && !!explanation.trim();
  const history = reflectionState.history;
  const latestFeedbackEntry = history.length > 0 ? history[0] : null;
  const latestAssessment = latestFeedbackEntry?.response?.assessment;
  const canSubmitToJournalCondition = !!(
    latestAssessment && ["achieves", "mostly"].includes(latestAssessment)
  );
  const hasEverReceivedAnyFeedback = history.some((entry) => entry.response);

  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.preventDefault();
    alert("Pasting is disabled for this field.");
  };

  const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleString();
  const getTopicNameForDisplay = (topicValue: string): string => {
    if (!topicValue) return "Untitled Entry";
    return topicValue.charAt(0).toUpperCase() + topicValue.slice(1);
  };

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

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
            placeholder="Enter a descriptive title..."
            onPaste={handlePaste}
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
              preventPaste={true}
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
            onPaste={handlePaste}
            rows={4}
          />
        </div>

        <div className={styles.reflectionButtons}>
          <button
            onClick={() => handleSubmit(false)} // Get Feedback button
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
                : "Get AI feedback on your current entry"
            }
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={() => handleSubmit(true)} // Submit to Journal button
            disabled={
              isSubmitting ||
              !canAttemptInteraction ||
              !chatbotVersion ||
              !chatbotApiKey ||
              !canSubmitToJournalCondition // Use the derived condition
            }
            className={styles.reflectionSubmitBtn}
            title={
              !canAttemptInteraction
                ? "Please fill in all fields first"
                : !chatbotVersion || !chatbotApiKey
                ? "Please configure ChatBot API Key and Version in settings"
                : !hasEverReceivedAnyFeedback
                ? "Please click 'Get Feedback' at least once before submitting."
                : !canSubmitToJournalCondition
                ? "The latest AI feedback assessment needs to be 'achieves' or 'mostly'. Click 'Get Feedback' again on your current content if you've changed it."
                : "Submit this entry (with its latest qualifying feedback) to your journal"
            }
          >
            {isSubmitting ? "Processing..." : "Submit Entry to Journal"}
          </button>
        </div>

        {error && <p className={styles.apiError}>{error}</p>}

        <div className={styles.reflectionHistory}>
          <h4>
            Submission History {isSectionComplete ? "(Section Complete ✓)" : ""}
          </h4>
          {history.length === 0 ? (
            <p className={styles.noHistory}>
              No submissions yet. Fill out the fields and click "Get Feedback"
              to start.
            </p>
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
                      ] || ""
                    : ""
                }`}
              >
                <div className={styles.reflectionSubmission}>
                  <div className={styles.reflectionHeader}>
                    <span className={styles.reflectionDate}>
                      {formatDate(entry.submission.timestamp)}
                    </span>
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
                        AI Prediction:{" "}
                        {entry.response.assessment.charAt(0).toUpperCase() +
                          entry.response.assessment.slice(1)}
                      </div>
                    )}
                    <p>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {entry.response.feedback}
                      </ReactMarkdown>
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
