import React from "react";
import type { AssessmentLevel, SectionId } from "../../../types/data";
import styles from "../InstructorViews.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { StoredPrimmSubmissionItem } from "../../../types/apiServiceTypes";

interface RenderPrimmActivityProps {
  submission: StoredPrimmSubmissionItem;
  studentName?: string | null;
  lessonTitle: string;
  sectionId: SectionId;
}

const RenderPrimmActivity: React.FC<RenderPrimmActivityProps> = ({
  submission,
  studentName,
  lessonTitle,
  sectionId,
}) => {
  // Helper to get assessment class, ensuring assessment is defined
  const getAssessmentLabelClass = (
    assessment?: AssessmentLevel | null
  ): string => {
    if (!assessment) return styles.assessmentLabel; // Default or empty if no assessment
    // Ensure assessment is a string before calling string methods
    const assessmentStr = String(assessment);
    const capitalizedAssessment =
      assessmentStr.charAt(0).toUpperCase() + assessmentStr.slice(1);
    return (
      styles[`assessment${capitalizedAssessment}`] || styles.assessmentLabel
    );
  };

  // Construct lesson path for link.
  // This assumes your lesson routes are like /lesson/{lessonGuid}
  const lessonLinkPath = `/lesson/${"todo"}`;

  return (
    <div className={styles.submissionDetailCard}>
      <h4>
        Lesson/Section: {lessonTitle} / {sectionId}
      </h4>
      <div>
        {studentName && (
          <p>
            <strong>Student:</strong> {studentName}
          </p>
        )}
        <Link
          to={`${lessonLinkPath}#${sectionId}`} // Use sectionId from props for the hash
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contextLink}
          style={{ display: "block", marginTop: "0.25rem" }}
        >
          View Original Section & Example
        </Link>
      </div>
      <div style={{ marginTop: "1rem" }}>
        {" "}
        {/* Group for student's work */}
        <h5>Student's Work:</h5>
        <div className={styles.infoEntry}>
          <strong>Code Snippet Analyzed:</strong>
          <pre>
            <code>{submission.codeSnippet}</code>
          </pre>
        </div>
        <div className={styles.infoEntry}>
          <strong>Prediction Prompt Given:</strong>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {submission.userPredictionPromptText}
          </ReactMarkdown>
        </div>
        <div className={styles.infoEntry}>
          <strong>Student's Prediction:</strong>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {submission.userPredictionText}
          </ReactMarkdown>
        </div>
        <div className={styles.infoEntry}>
          <strong>Confidence: </strong>
          <span className={styles.infoText}>
            {submission.userPredictionConfidence}/3
          </span>
          {/* Assuming 1-3 scale */}
        </div>
        {submission.actualOutputSummary && (
          <div className={styles.infoEntry}>
            <strong>Actual Output Summary (User Reported):</strong>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {submission.actualOutputSummary}
            </ReactMarkdown>
          </div>
        )}
        <div className={styles.infoEntry}>
          <strong>Student's Explanation/Reflection:</strong>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {submission.userExplanationText || "(No explanation provided)"}
          </ReactMarkdown>
        </div>
      </div>
      <div className={styles.aiFeedbackBlock}>
        <h5>AI Evaluation:</h5>
        <div className={styles.evaluationItem}>
          <strong>Prediction Assessment: </strong>
          {submission.aiPredictionAssessment ? (
            <span
              className={`${styles.assessmentLabel} ${getAssessmentLabelClass(
                submission.aiPredictionAssessment
              )}`}
            >
              {String(submission.aiPredictionAssessment).toUpperCase()}
            </span>
          ) : (
            <span
              className={styles.assessmentLabel}
              style={{ fontStyle: "italic" }}
            >
              Not Assessed
            </span>
          )}
        </div>

        {/* Only show explanation assessment if it exists */}
        {submission.aiExplanationAssessment && (
          <div className={styles.evaluationItem}>
            <strong>Explanation Assessment: </strong>
            <span
              className={`${styles.assessmentLabel} ${getAssessmentLabelClass(
                submission.aiExplanationAssessment
              )}`}
            >
              {String(submission.aiExplanationAssessment).toUpperCase()}
            </span>
          </div>
        )}

        {submission.aiOverallComment && (
          <div
            className={`${styles.evaluationItem} ${styles.aiOverallComment}`}
          >
            <strong>Overall Comment: </strong>
            <p>
              <em>{submission.aiOverallComment}</em>
            </p>
          </div>
        )}
        {/* Message if no detailed textual feedback from AI */}
        {!submission.aiExplanationAssessment &&
          !submission.aiOverallComment &&
          submission.aiPredictionAssessment && (
            <p className={styles.feedbackText} style={{ marginTop: "0.5rem" }}>
              <em>
                No detailed textual feedback provided by AI beyond prediction
                assessment.
              </em>
            </p>
          )}
      </div>
    </div>
  );
};

export default RenderPrimmActivity;
