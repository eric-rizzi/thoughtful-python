// src/components/sections/ReflectionSection.tsx
import React, { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReflectionSectionData, AssessmentLevel } from "../../types/data";
import styles from "./Section.module.css";
import CodeEditor from "../CodeEditor";
import { useAuthStore } from "../../stores/authStore";
import * as apiService from "../../lib/apiService";
// Import useProgressActions and useProgressStore directly to get the isSectionComplete function
import {
  useProgressActions,
  useProgressStore,
} from "../../stores/progressStore";
import {
  ReflectionInteractionInput,
  ReflectionVersionItem,
} from "../../types/apiServiceTypes";
import { API_GATEWAY_BASE_URL } from "../../config";

const QUALIFYING_ASSESSMENTS_FOR_FINAL: AssessmentLevel[] = [
  "achieves",
  "mostly",
];

interface ReflectionSectionProps {
  section: ReflectionSectionData;
  lessonId: string;
}

const ReflectionSection: React.FC<ReflectionSectionProps> = ({
  section,
  lessonId,
}) => {
  const { id: sectionId, title, content } = section;
  const { isTopicPredefined, isCodePredefined, isExplanationPredefined } =
    section;

  // Local state for current user inputs
  const [currentTopic, setCurrentTopic] = useState<string>(() =>
    isTopicPredefined ? section.topic : ""
  );
  const [currentCode, setCurrentCode] = useState<string>(() =>
    isCodePredefined ? section.code : section.code || ""
  );
  const [currentExplanation, setCurrentExplanation] = useState<string>(() =>
    isExplanationPredefined ? section.explanation : ""
  );

  const [draftHistory, setDraftHistory] = useState<ReflectionVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { idToken, isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const { completeSection } = useProgressActions();

  // Get the isSectionComplete function from the progressStore's actions
  // (or directly from the store's state if you prefer to select it)
  const isSectionMarkedCompleteInStore = useProgressStore((state) =>
    state.actions.isSectionComplete(lessonId, sectionId)
  );
  // Alternatively, if isSectionComplete is part of the state, not actions:
  // const isSectionMarkedCompleteInStore = useProgressStore(state =>
  //   (state.completion[lessonId] && state.completion[lessonId][sectionId]) ? true : false
  // );
  // Let's assume your isSectionComplete function from actions is the correct one to use.

  // Fetch draft history on load or when relevant params change
  useEffect(() => {
    if (
      !isAuthenticated ||
      !idToken ||
      !apiGatewayUrl ||
      !lessonId ||
      !sectionId
    ) {
      setDraftHistory([]);
      return;
    }
    // ... (fetchHistory logic remains the same) ...
    const fetchHistory = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await apiService.getReflectionDraftVersions(
          idToken,
          apiGatewayUrl,
          lessonId,
          sectionId
        );
        const sortedVersions = response.versions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setDraftHistory(sortedVersions);
      } catch (err) {
        console.error("Failed to fetch reflection draft history:", err);
        setFetchError(
          err instanceof Error ? err.message : "Failed to load draft history."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [idToken, apiGatewayUrl, lessonId, sectionId, isAuthenticated]);

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

  const handleGetFeedback = useCallback(async () => {
    // ... (logic remains the same) ...
    if (!isAuthenticated || !idToken || !apiGatewayUrl) {
      setSubmitError("User not authenticated or API not configured.");
      return;
    }
    const finalTopic = (
      isTopicPredefined ? section.topic : currentTopic
    ).trim();
    const finalCode = isCodePredefined ? section.code : currentCode;
    const finalExplanation = (
      isExplanationPredefined ? section.explanation : currentExplanation
    ).trim();

    if (!finalTopic || !finalCode.trim() || !finalExplanation) {
      alert("Please ensure topic, code, and explanation have content.");
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    const submissionData: ReflectionInteractionInput = {
      userTopic: finalTopic,
      userCode: finalCode,
      userExplanation: finalExplanation,
      isFinal: false,
    };

    try {
      const response = (await apiService.submitReflectionInteraction(
        idToken,
        apiGatewayUrl,
        lessonId,
        sectionId,
        submissionData
      )) as ReflectionVersionItem;

      setDraftHistory((prevHistory) => [response, ...prevHistory]);
      alert("Feedback received and draft saved!");
    } catch (err) {
      console.error("Error getting AI feedback:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to get feedback."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    idToken,
    apiGatewayUrl,
    lessonId,
    sectionId,
    currentTopic,
    currentCode,
    currentExplanation,
    isTopicPredefined,
    isCodePredefined,
    isExplanationPredefined,
    section.topic,
    section.code,
    section.explanation,
  ]);

  const handleFinalSubmit = useCallback(async () => {
    // ... (logic remains largely the same) ...
    if (!isAuthenticated || !idToken || !apiGatewayUrl) {
      setSubmitError("User not authenticated or API not configured.");
      return;
    }

    const latestDraft = draftHistory.length > 0 ? draftHistory[0] : null;
    if (
      !latestDraft ||
      !latestDraft.aiAssessment ||
      !QUALIFYING_ASSESSMENTS_FOR_FINAL.includes(latestDraft.aiAssessment)
    ) {
      alert(
        "Please get feedback first, and ensure the latest assessment is 'achieves' or 'mostly' before final submission."
      );
      return;
    }

    const finalTopic = (
      isTopicPredefined ? section.topic : currentTopic
    ).trim();
    const finalCode = isCodePredefined ? section.code : currentCode;
    const finalExplanation = (
      isExplanationPredefined ? section.explanation : currentExplanation
    ).trim();

    if (!finalTopic || !finalCode.trim() || !finalExplanation) {
      alert(
        "Please ensure topic, code, and explanation have content for final submission."
      );
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    const submissionData: ReflectionInteractionInput = {
      userTopic: finalTopic,
      userCode: finalCode,
      userExplanation: finalExplanation,
      isFinal: true,
      sourceVersionId: latestDraft.versionId,
    };

    try {
      const finalEntryResponse = (await apiService.submitReflectionInteraction(
        idToken,
        apiGatewayUrl,
        lessonId,
        sectionId,
        submissionData
      )) as ReflectionVersionItem;

      alert(
        `Learning entry submitted successfully! Entry ID: ${finalEntryResponse.versionId}`
      );
      completeSection(lessonId, sectionId);
    } catch (err) {
      console.error("Error submitting final learning entry:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit final entry."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    idToken,
    apiGatewayUrl,
    lessonId,
    sectionId,
    draftHistory,
    currentTopic,
    currentCode,
    currentExplanation,
    completeSection,
    isTopicPredefined,
    isCodePredefined,
    isExplanationPredefined,
    section.topic,
    section.code,
    section.explanation,
  ]);

  const canAttemptInteraction =
    (isTopicPredefined || !!currentTopic.trim()) &&
    (isCodePredefined || !!currentCode.trim()) &&
    (isExplanationPredefined || !!currentExplanation.trim());

  const latestAssessment =
    draftHistory.length > 0 ? draftHistory[0].aiAssessment : null;
  const canSubmitToJournal =
    draftHistory.length > 0 &&
    latestAssessment &&
    QUALIFYING_ASSESSMENTS_FOR_FINAL.includes(latestAssessment);

  const formatDate = (timestamp: string | undefined): string =>
    timestamp ? new Date(timestamp).toLocaleString() : "N/A";

  const getTopicNameForDisplay = (topicValue: string | undefined): string => {
    if (!topicValue || !topicValue.trim()) return "Untitled Entry";
    const trimmedTopic = topicValue.trim();
    return trimmedTopic.charAt(0).toUpperCase() + trimmedTopic.slice(1);
  };

  return (
    <section id={sectionId} className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>

      <div className={styles.reflectionContainer}>
        {/* ... (input fields remain the same) ... */}
        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${sectionId}-topic`}
            className={styles.reflectionLabel}
          >
            Title of Journal Entry
          </label>
          <input
            type="text"
            id={`${sectionId}-topic`}
            className={styles.topicInput}
            value={currentTopic}
            onChange={
              isTopicPredefined
                ? undefined
                : (e) => setCurrentTopic(e.target.value)
            }
            readOnly={isTopicPredefined || isLoading}
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
              readOnly={isLoading || isCodePredefined}
              minHeight="150px"
            />
          </div>
        </div>

        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${sectionId}-explanation`}
            className={styles.reflectionLabel}
          >
            Explanation
          </label>
          <textarea
            id={`${sectionId}-explanation`}
            className={styles.reflectionExplanation}
            value={currentExplanation}
            onChange={
              isExplanationPredefined
                ? undefined
                : (e) => setCurrentExplanation(e.target.value)
            }
            readOnly={isLoading || isExplanationPredefined}
            placeholder={
              isExplanationPredefined ? undefined : section.explanation
            }
            rows={4}
          />
        </div>

        <div className={styles.reflectionButtons}>
          <button
            onClick={handleGetFeedback}
            disabled={isLoading || !canAttemptInteraction || !isAuthenticated}
            className={styles.reflectionFeedbackBtn}
            title={
              !canAttemptInteraction
                ? "Please fill in all fields"
                : !isAuthenticated
                ? "Please log in"
                : "Get AI feedback"
            }
          >
            {isLoading ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={handleFinalSubmit}
            disabled={
              isLoading ||
              !canAttemptInteraction ||
              !canSubmitToJournal ||
              !isAuthenticated ||
              isSectionMarkedCompleteInStore
            }
            className={styles.reflectionSubmitBtn}
            title={
              !isAuthenticated
                ? "Please log in"
                : !canAttemptInteraction
                ? "Please fill in all fields"
                : !canSubmitToJournal
                ? "Get qualifying AI feedback first ('achieves' or 'mostly')"
                : isSectionMarkedCompleteInStore
                ? "Section already completed"
                : "Submit to Journal"
            }
          >
            {isLoading
              ? "Submitting..."
              : isSectionMarkedCompleteInStore
              ? "Submitted ✓"
              : "Submit to Journal"}
          </button>
        </div>
        {submitError && <p className={styles.apiError}>{submitError}</p>}
        {fetchError && <p className={styles.apiError}>{fetchError}</p>}

        <div className={styles.reflectionHistory}>
          <h4>
            Feedback History{" "}
            {isSectionMarkedCompleteInStore ? "(Section Complete ✓)" : ""}
          </h4>
          {/* ... (history rendering logic remains the same) ... */}
          {isLoading && draftHistory.length === 0 && <p>Loading history...</p>}
          {!isLoading && draftHistory.length === 0 && !fetchError && (
            <p className={styles.noHistory}>
              No feedback history yet. Fill out the fields and click "Get
              Feedback".
            </p>
          )}
          {draftHistory.map((entry) => (
            <div key={entry.versionId} className={`${styles.reflectionCard}`}>
              <div className={styles.reflectionSubmission}>
                <div className={styles.reflectionHeader}>
                  <span className={styles.reflectionDate}>
                    {formatDate(entry.createdAt)}
                  </span>
                  <span
                    className={`${styles.submissionBadge} ${styles.feedbackOnlyBadge}`}
                  >
                    Feedback Cycle
                  </span>
                </div>
                <h5>{getTopicNameForDisplay(entry.userTopic)}</h5>
                <details>
                  <summary>Show Submitted Content & AI Feedback</summary>
                  <div className={styles.reflectionCodeDisplay}>
                    <pre>
                      <code>{entry.userCode}</code>
                    </pre>
                  </div>
                  <div className={styles.reflectionExplanationDisplay}>
                    <p>{entry.userExplanation}</p>
                  </div>
                  {entry.aiFeedback && entry.aiAssessment && (
                    <div className={styles.reflectionResponse}>
                      <h5>AI Feedback ({formatDate(entry.createdAt)}):</h5>
                      {entry.aiAssessment && (
                        <div
                          className={`${styles.assessmentBadge} ${
                            styles[
                              `assessmentBadge${
                                entry.aiAssessment.charAt(0).toUpperCase() +
                                entry.aiAssessment.slice(1)
                              }`
                            ] || ""
                          }`}
                        >
                          AI Assessment:{" "}
                          {entry.aiAssessment.charAt(0).toUpperCase() +
                            entry.aiAssessment.slice(1)}
                        </div>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {entry.aiFeedback}
                      </ReactMarkdown>
                    </div>
                  )}
                </details>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReflectionSection;
