import React from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AssessmentLevel } from "../../../types/data";
import styles from "../InstructorViews.module.css";
import { ReflectionVersionItem } from "../../../types/apiServiceTypes";

interface RenderFinalLearningEntryProps {
  entry: ReflectionVersionItem;
  studentName?: string | null;
  lessonTitle?: string;
}

const RenderFinalLearningEntry: React.FC<RenderFinalLearningEntryProps> = ({
  entry,
  studentName,
  lessonTitle,
}) => {
  if (!entry || !entry.isFinal) {
    // This component should ideally only be passed final entries
    return (
      <p className={styles.placeholderMessage}>
        Not a valid final learning entry.
      </p>
    );
  }

  const getAssessmentClass = (assessment?: AssessmentLevel | null): string => {
    if (!assessment) return "";
    const capitalizedAssessment =
      assessment.charAt(0).toUpperCase() + assessment.slice(1);
    return styles[`assessment${capitalizedAssessment}`] || "";
  };

  const lessonLinkPath = `/lesson/${entry.lessonId}`; // Assuming entry.lessonId is the GUID

  return (
    <div className={styles.submissionDetailCard}>
      <h4>Learning Entry: {entry.userTopic || "Untitled"}</h4>
      {studentName && (
        <p>
          <strong>Student:</strong> {studentName}
        </p>
      )}
      <p>
        <strong>Submitted:</strong> {new Date(entry.createdAt).toLocaleString()}
      </p>
      <p>
        <strong>Context:</strong> Lesson:{" "}
        {lessonTitle || entry.lessonId.substring(0, 12) + "..."} / Section:{" "}
        {entry.sectionId}
      </p>
      <Link
        to={`${lessonLinkPath}#${entry.sectionId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.contextLink}
      >
        View Original Section in Lesson
      </Link>

      <div style={{ marginTop: "1rem" }}>
        <div className={styles.infoEntry}>
          <span className={styles.infoLabel}>Code Submitted:</span>
          <pre>
            <code>{entry.userCode || "(No code provided)"}</code>
          </pre>
        </div>
        <div className={styles.infoEntry}>
          <span className={styles.infoLabel}>Student's Explanation:</span>
          <div className={styles.infoText}>
            {" "}
            {/* Use a div for block content from markdown */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {entry.userExplanation || "(No explanation provided)"}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {entry.aiAssessment && ( // AI feedback for the final entry often comes from its source draft
        <div className={styles.aiFeedbackBlock}>
          <h5>AI Assessment (from qualifying draft):</h5>
          <div className={styles.evaluationItem}>
            <strong>Assessment:</strong>
            <span
              className={`${styles.assessmentLabel} ${getAssessmentClass(
                entry.aiAssessment
              )}`}
            >
              {entry.aiAssessment.toUpperCase()}
            </span>
          </div>
          {entry.aiFeedback && (
            <div
              className={`${styles.evaluationItem} ${styles.aiOverallComment}`}
            >
              <strong>Feedback:</strong>
              <p>
                <em>{entry.aiFeedback}</em>
              </p>
            </div>
          )}
        </div>
      )}
      {!entry.aiAssessment && entry.isFinal && (
        <p className={styles.feedbackText} style={{ marginTop: "1rem" }}>
          <em>
            No specific AI assessment recorded for this final entry (feedback
            was on drafts).
          </em>
        </p>
      )}
    </div>
  );
};

export default RenderFinalLearningEntry;
