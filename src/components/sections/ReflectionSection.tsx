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
import { loadProgress } from "../../lib/localStorageUtils";

interface ChatBotConfig {
  progressApiGateway: string;
  chatbotVersion: string;
  chatbotApiKey: string;
}

const CONFIG_STORAGE_KEY = "chatbot_config";

async function sendFeedbackToChatBot(
  submission: ReflectionSubmission,
  rubric: ReflectionSectionData["rubric"] | undefined,
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

    | Objective | Requirements/Specifications | Achieves | Mostly There | Developing | Not Demonstrated |
    | :---- | :---- | :---- | :---- | :---- | :---- |
    | Well-written: Entry is well-written and displays level of care expected in other, writing-centered classes | Entry is brief and to the point: it is no longer than it has to be. Entry uses proper terminology. Entry has no obvious spelling mistakes Entry uses proper grammar  | Entry is of high quality without any obvious errors or extraneous information | Entry contains one or two errors and could only be shortened a little | Entry contains many errors and has a lot of unnecessary, repetitive information. |  |
    | Thoughtful: Entry includes analysis that is easy to understand and could prove useful in the future | Analysis is about a topic that could conceivably come up in a future CS class. Analysis identifies single possible point of confusion. Analysis eliminates all possible confusion on the topic. Analysis references example. The phrase “as seen in the example” present in entry. | All requirements met. | Entry contains all but one of the requirements. | Entry's analysis is superficial an unfocused. |  |
    | Grounded: Entry includes a pertinent example that gets to the heart of the topic being discussed. | Example highlights issue being discussed. Example doesn't include unnecessary, extraneous details or complexity. Example is properly formatted. Example doesn't include any obvious programming errors. | All requirements met | Entry contains all but one or two of the requirements. | Entry's example is difficult to understand or doesn't relate to the topic being discussed. |  | 

    **Provide your response in a concise format. Start with the assessment level, then provide the feedback. For example:
    Assessment: Mostly There
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

    let assessment: AssessmentLevel = "developing";
    let feedbackMessage = generatedText.trim();

    const lowerCaseText = generatedText.toLowerCase();
    if (lowerCaseText.includes("assessment: achieves")) {
      assessment = "achieves";
    } else if (lowerCaseText.includes("assessment: mostly there")) {
      assessment = "mostly there";
    } else if (lowerCaseText.includes("assessment: developing")) {
      assessment = "developing";
    } else if (lowerCaseText.includes("assessment: not demonstrated")) {
      assessment = "not demonstrated";
    }

    const feedbackMatch = generatedText.match(/Feedback:\s*([\s\S]*)/i);
    if (feedbackMatch && feedbackMatch[1]) {
      feedbackMessage = feedbackMatch[1].trim();
    } else {
      feedbackMessage = generatedText.trim();
    }

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
          ["achieves"].includes(entry.response.assessment)
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
        const response = await sendFeedbackToChatBot(
          submission,
          section.rubric,
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
      chatbotVersion,
      chatbotApiKey,
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

  const handlePaste = (event: React.ClipboardEvent) => {
    // console.log("Paste event intercepted in textarea");
    event.preventDefault();
    alert("Pasting is disabled for this text area.");
  };

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
            onPaste={handlePaste} // Prevent paste
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
              preventPaste={false} // Prevent paste in CodeEditor
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
            // onPaste={handlePaste} // Prevent paste in textarea
          />
        </div>

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
                ? "Please fill in all fields first"
                : !chatbotVersion || !chatbotApiKey
                ? "Please configure ChatBot API Key and Version in settings"
                : ""
            }
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={
              isSubmitting ||
              !canAttemptInteraction ||
              !hasEverReceivedFeedback ||
              !chatbotVersion ||
              !chatbotApiKey
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
