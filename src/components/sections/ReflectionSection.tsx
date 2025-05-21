// src/components/sections/ReflectionSection.tsx
import React, { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ReflectionSectionData, // Uses the NEW simplified type
  ReflectionSubmission,
  ReflectionResponse,
  ReflectionHistoryEntry,
  SavedReflectionState,
  AssessmentLevel,
} from "../../types/data"; // Ensure path is correct
import styles from "./Section.module.css"; // Or your specific ReflectionSection.module.css
import CodeEditor from "../CodeEditor";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import { useAuthStore } from "../../stores/authStore";
import {
  loadProgress,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../../lib/localStorageUtils";

// --- Helper Types & Constants ---
interface ChatBotConfig {
  chatbotVersion: string;
  chatbotApiKey: string;
}
const CONFIG_STORAGE_KEY = "chatbot_config";
const STABLE_INITIAL_REFLECTION_STATE: SavedReflectionState = { history: [] };

async function sendFeedbackToChatBot(
  submission: ReflectionSubmission,
  chatbotVersion: string,
  chatbotApiKey: string
): Promise<ReflectionResponse> {
  // --- Your existing sendFeedbackToChatBot implementation ---
  // This function remains the same as your working version.
  // For brevity, its full code is omitted here but assumed to be present and correct.
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
// --- End of sendFeedbackToChatBot ---

interface ReflectionSectionProps {
  section: ReflectionSectionData;
  lessonId: string;
}

const ReflectionSection: React.FC<ReflectionSectionProps> = ({
  section,
  lessonId,
}) => {
  const { isTopicPredefined, isCodePredefined, isExplanationPredefined } =
    section;

  // Initialize state based on whether the field is predefined or user-editable
  const [currentTopic, setCurrentTopic] = useState<string>(() =>
    isTopicPredefined ? section.topic : ""
  );
  const [currentCode, setCurrentCode] = useState<string>(
    () =>
      // If code is not predefined, section.code serves as the initial content/placeholder for the editor
      section.code || ""
  );
  const [currentExplanation, setCurrentExplanation] = useState<string>(() =>
    isExplanationPredefined ? section.explanation : ""
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatbotVersion, setChatbotVersion] = useState<string>("");
  const [chatbotApiKey, setChatbotApiKey] = useState<string>("");

  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Effect to update local state if the section prop (or its predefined values) changes.
  useEffect(() => {
    setCurrentTopic(isTopicPredefined ? section.topic : "");
    setCurrentCode(section.code || ""); // Use section.code as initial for editable too
    setCurrentExplanation(isExplanationPredefined ? section.explanation : "");
  }, [
    section.id,
    section.topic,
    section.code,
    section.explanation,
    isTopicPredefined,
    isCodePredefined,
    isExplanationPredefined,
  ]);

  // Load ChatBot config (remains the same)
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
      const finalTopic = isTopicPredefined
        ? section.topic
        : currentTopic.trim();
      const finalCode = isCodePredefined ? section.code : currentCode; // Don't trim code
      const finalExplanation = isExplanationPredefined
        ? section.explanation
        : currentExplanation.trim();

      if (!finalTopic.trim() || !finalCode.trim() || !finalExplanation.trim()) {
        alert(
          "Please ensure the topic, code example, and explanation have content."
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
        const latestEntry =
          reflectionState.history.length > 0
            ? reflectionState.history[0]
            : null;
        const currentAssessmentVal = latestEntry?.response?.assessment;
        const qualifiesForJournal =
          currentAssessmentVal &&
          ["achieves", "mostly"].includes(currentAssessmentVal);

        if (!qualifiesForJournal) {
          alert(
            "To submit to the journal, your latest reflection feedback must have an assessment of 'achieves' or 'mostly'.\nPlease use the 'Get Feedback' button to get an assessment on your current entry. If the assessment is adequate, you can then submit that version to the journal."
          );
          setIsSubmitting(false);
          return;
        }
        const journalSubmission: ReflectionSubmission = {
          topic: finalTopic,
          code: finalCode,
          explanation: finalExplanation,
          timestamp: Date.now(),
          submitted: true,
        };
        const journalEntry: ReflectionHistoryEntry = {
          submission: journalSubmission,
          response: latestEntry!.response,
        };
        setReflectionState((prevState) => ({
          history: [journalEntry, ...prevState.history],
        }));
        alert("Your entry has been submitted and saved to your journal!");
        setIsSubmitting(false);
      } else {
        const submissionForFeedback: ReflectionSubmission = {
          topic: finalTopic,
          code: finalCode,
          explanation: finalExplanation,
          timestamp: Date.now(),
          submitted: false,
        };
        try {
          const response = await sendFeedbackToChatBot(
            submissionForFeedback,
            chatbotVersion,
            chatbotApiKey
          );
          const newHistoryEntry: ReflectionHistoryEntry = {
            submission: submissionForFeedback,
            response,
          };
          setReflectionState((prevState) => ({
            history: [newHistoryEntry, ...prevState.history],
          }));
        } catch (err) {
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
      currentTopic,
      currentCode,
      currentExplanation,
      isTopicPredefined,
      isCodePredefined,
      isExplanationPredefined,
      section.topic,
      section.code,
      section.explanation, // For accessing original predefined/placeholder values
      chatbotVersion,
      chatbotApiKey,
      setReflectionState,
      reflectionState.history,
    ]
  );

  const canAttemptInteraction =
    (isTopicPredefined || !!currentTopic.trim()) &&
    (isCodePredefined || !!currentCode.trim()) && // For code, even a placeholder/comment might be non-empty
    (isExplanationPredefined || !!currentExplanation.trim());

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
        {/* Topic Field */}
        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${section.id}-topic`}
            className={styles.reflectionLabel}
          >
            Title of Journal Entry
          </label>
          <input
            type="text"
            id={`${section.id}-topic`}
            className={styles.topicInput}
            value={currentTopic}
            onChange={
              isTopicPredefined
                ? undefined
                : (e) => setCurrentTopic(e.target.value)
            }
            readOnly={isTopicPredefined || isSubmitting}
            placeholder={isTopicPredefined ? undefined : section.topic}
            onPaste={isTopicPredefined ? undefined : handlePaste}
          />
        </div>

        {/* Code Field */}
        <div className={styles.reflectionInputGroup}>
          <label className={styles.reflectionLabel}>
            Simple code example that demonstrates this topic
          </label>
          <div className={styles.reflectionCodeEditorWrapper}>
            <CodeEditor
              value={currentCode}
              onChange={isCodePredefined ? () => {} : setCurrentCode}
              readOnly={isSubmitting || isCodePredefined}
              minHeight="150px"
              // `section.code` acts as placeholder/initial content if `isCodePredefined` is false
              preventPaste={!isCodePredefined}
            />
          </div>
        </div>

        {/* Explanation Field */}
        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${section.id}-explanation`}
            className={styles.reflectionLabel}
          >
            Explanation
          </label>
          <textarea
            id={`${section.id}-explanation`}
            className={styles.reflectionExplanation}
            value={currentExplanation}
            onChange={
              isExplanationPredefined
                ? undefined
                : (e) => setCurrentExplanation(e.target.value)
            }
            readOnly={isSubmitting || isExplanationPredefined}
            placeholder={
              isExplanationPredefined ? undefined : section.explanation
            }
            onPaste={isExplanationPredefined ? undefined : handlePaste}
            rows={4}
          />
        </div>

        {/* Buttons and History (logic for disabled/title on buttons remains the same) */}
        <div className={styles.reflectionButtons}>
          <button
            onClick={() => handleSubmit(false)}
            disabled={
              isSubmitting ||
              !canAttemptInteraction ||
              !chatbotVersion ||
              !chatbotApiKey
            }
            className={styles.reflectionFeedbackBtn}
            title={
              !canAttemptInteraction
                ? "Please fill in all fields (topic, code, explanation)"
                : !chatbotVersion || !chatbotApiKey
                ? "Please configure ChatBot API Key and Version in settings"
                : "Get AI feedback on your current entry"
            }
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={
              isSubmitting ||
              !canAttemptInteraction ||
              !chatbotVersion ||
              !chatbotApiKey ||
              !canSubmitToJournalCondition
            }
            className={styles.reflectionSubmitBtn}
            title={
              !canAttemptInteraction
                ? "Please fill in all fields (topic, code, explanation)"
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
        {/* History rendering (same as before) */}
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
