// src/components/sections/ReflectionSection.tsx
import React, { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ReflectionSectionData, // Using the simplified version
  ReflectionSubmission,
  ReflectionResponse,
  ReflectionHistoryEntry,
  SavedReflectionState,
  AssessmentLevel,
} from "../../types/data"; // Adjust path as necessary
import styles from "./Section.module.css"; // Assuming general styles are here
// You might have specific reflection styles, e.g., import reflectionStyles from './ReflectionSection.module.css';
import CodeEditor from "../CodeEditor";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import { useAuthStore } from "../../stores/authStore";
import {
  loadProgress,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../../lib/localStorageUtils";
import * as apiService from "../../lib/apiService"; // For submitLearningEntry
import { useApiSettingsStore } from "../../stores/apiSettingsStore";

// --- Helper Types & Constants ---
interface ChatBotConfig {
  chatbotVersion: string;
  chatbotApiKey: string;
}
const CONFIG_STORAGE_KEY = "chatbot_config"; // Key for user-specific chatbot settings in LS
const STABLE_INITIAL_REFLECTION_STATE: SavedReflectionState = { history: [] };
const ALLOW_PASTE_FOR_TESTING = true;

// This function should be your working version that calls the Google Generative AI API
// or your backend proxy for it.
async function sendFeedbackToChatBot(
  submission: ReflectionSubmission,
  chatbotVersion: string,
  chatbotApiKey: string
): Promise<ReflectionResponse> {
  if (!chatbotVersion || !chatbotApiKey) {
    throw new Error(
      "ChatBot version or API Key not configured in application settings."
    );
  }
  // This is a placeholder for your actual API call logic.
  // Ensure it matches the implementation that was working for you.
  console.log("[sendFeedbackToChatBot] Sending to AI:", submission);
  const API_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/";
  const modelId = chatbotVersion; // e.g., "gemini-1.5-flash-latest" or your fine-tuned model
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
    Feedback: Your code is clear and accurately demonstrates the concept. Consider adding comments for better readability.**`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to parse error, fallback to empty obj
      throw new Error(
        errorData.error?.message ||
          `ChatBot API request failed: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let assessment: AssessmentLevel = "developing"; // Default assessment
    let feedbackMessage =
      generatedText.trim() || "No specific feedback provided by AI.";

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
    if (feedbackMatch?.[1]) {
      feedbackMessage = feedbackMatch[1].trim();
    } else if (assessmentMatch) {
      // If only assessment found, take rest as feedback
      feedbackMessage = generatedText
        .substring(assessmentMatch[0].length)
        .trim();
    }
    return { feedback: feedbackMessage, assessment, timestamp: Date.now() };
  } catch (error) {
    console.error("Error in sendFeedbackToChatBot:", error);
    // Return a default error response structure
    return {
      feedback:
        error instanceof Error
          ? `Error contacting AI: ${error.message}`
          : "Unknown error contacting AI.",
      assessment: "insufficient", // Or a specific error assessment level
      timestamp: Date.now(),
    };
  }
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

  const [currentTopic, setCurrentTopic] = useState<string>(() =>
    isTopicPredefined ? section.topic : ""
  );
  const [currentCode, setCurrentCode] = useState<string>(
    () => (isCodePredefined ? section.code : section.code || "") // section.code is placeholder if not predefined
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
  const idTokenFromStore = useAuthStore((state) => state.idToken); // For API calls
  const apiGatewayUrlFromStore = useApiSettingsStore(
    (state) => state.progressApiGateway
  );

  useEffect(() => {
    setCurrentTopic(isTopicPredefined ? section.topic : "");
    setCurrentCode(isCodePredefined ? section.code : section.code || "");
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
      const finalTopic = (
        isTopicPredefined ? section.topic : currentTopic
      ).trim();
      const finalCode = isCodePredefined ? section.code : currentCode; // Don't trim code, whitespace is significant
      const finalExplanation = (
        isExplanationPredefined ? section.explanation : currentExplanation
      ).trim();

      if (
        !finalTopic ||
        (!isCodePredefined && !finalCode.trim()) ||
        !finalExplanation
      ) {
        // For code, if it's user-editable, it must not be empty after trim.
        // If it's predefined, it's taken as is.
        // If it's user-editable and the placeholder IS the intended 'empty' code, this check might be too strict.
        // However, usually, an empty code block isn't a meaningful reflection.
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
        const qualifyingResponse = latestEntry!.response!; // Known to exist due to qualifiesForJournal

        // Prepare data for the API
        const learningEntryData: apiService.LearningEntrySubmissionData = {
          lessonId: lessonId,
          sectionId: section.id,
          sectionTitle: section.title, // Overall title of the ReflectionSection
          submission: journalSubmission,
          assessmentResponse: qualifyingResponse,
        };

        try {
          if (idTokenFromStore && apiGatewayUrlFromStore) {
            console.log(
              "[ReflectionSection] Attempting to submit learning entry to API..."
            );
            const apiResult = await apiService.submitLearningEntry(
              idTokenFromStore,
              apiGatewayUrlFromStore,
              learningEntryData
            );
            if (apiResult.success) {
              console.log(
                "[ReflectionSection] Learning entry submitted successfully to API. Entry ID:",
                apiResult.entryId
              );
              // Add to local history
              const journalEntry: ReflectionHistoryEntry = {
                submission: journalSubmission,
                response: qualifyingResponse,
              };
              setReflectionState((prevState) => ({
                history: [journalEntry, ...prevState.history],
              }));
              alert("Your entry has been submitted and saved to your journal!");
            } else {
              setError(
                "Failed to save learning entry to server. It's saved locally for now."
              );
              const journalEntry: ReflectionHistoryEntry = {
                submission: journalSubmission,
                response: qualifyingResponse,
              };
              setReflectionState((prevState) => ({
                history: [journalEntry, ...prevState.history],
              }));
            }
          } else {
            setError(
              "Cannot save learning entry: Missing auth token or API URL. Saved locally."
            );
            const journalEntry: ReflectionHistoryEntry = {
              submission: journalSubmission,
              response: qualifyingResponse,
            };
            setReflectionState((prevState) => ({
              history: [journalEntry, ...prevState.history],
            }));
          }
        } catch (apiError) {
          console.error(
            "[ReflectionSection] Error submitting learning entry to API:",
            apiError
          );
          setError(
            `Error saving to server: ${
              apiError instanceof Error ? apiError.message : String(apiError)
            }. Saved locally.`
          );
          const journalEntry: ReflectionHistoryEntry = {
            submission: journalSubmission,
            response: qualifyingResponse,
          };
          setReflectionState((prevState) => ({
            history: [journalEntry, ...prevState.history],
          }));
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // "Get Feedback" path
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
      section.explanation,
      section.id,
      section.title,
      lessonId,
      chatbotVersion,
      chatbotApiKey,
      setReflectionState,
      reflectionState.history,
      idTokenFromStore,
      apiGatewayUrlFromStore, // Added dependencies for API call
    ]
  );

  const canAttemptInteraction =
    (isTopicPredefined || !!currentTopic.trim()) &&
    (isCodePredefined ||
      !!currentCode.trim() ||
      (currentCode === section.code && !!section.code)) && // Allow placeholder if that's the initial code
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
        {/* Topic, Code, Explanation input groups ... (same as before) ... */}
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
          />
        </div>

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
              preventPaste={false && !isCodePredefined}
            />
          </div>
        </div>

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
            rows={4}
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
                ? "Please fill in all fields (topic, code, explanation)"
                : !chatbotVersion || !chatbotApiKey
                ? "Please configure ChatBot API Key and Version in settings"
                : "Get AI feedback on your current entry"
            }
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}{" "}
            {/* Simplified loading text */}
          </button>
          <button
            onClick={() => handleSubmit(true)} // Submit to Journal
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
            {isSubmitting ? "Processing..." : "Submit Entry to Journal"}{" "}
            {/* Simplified loading text */}
          </button>
        </div>
        {error && <p className={styles.apiError}>{error}</p>}

        {/* History rendering ... (same as before) ... */}
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {entry.response.feedback}
                    </ReactMarkdown>
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
