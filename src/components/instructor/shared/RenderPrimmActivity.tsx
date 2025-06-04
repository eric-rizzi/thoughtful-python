import React from "react";
import type {
  AssessmentLevel,
  LessonPath,
  SectionId,
} from "../../../types/data";
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
      <h4>PRIMM Analysis: Example '{submission.primmExampleId}'</h4>
      <div className={styles.infoEntry}>
        <span className={styles.infoLabel}>Student:</span>
        <span className={styles.infoText}>
          {studentName || submission.userId}
        </span>
      </div>
      <div className={styles.infoEntry}>
        <span className={styles.infoLabel}>Submitted:</span>
        <span className={styles.infoText}>
          {new Date(submission.timestampIso).toLocaleString()}
        </span>
      </div>
      <div className={styles.infoEntry}>
        <span className={styles.infoLabel}>Context:</span>
        <span className={styles.infoText}>
          Lesson: {lessonTitle}, Section: {submission.sectionId}
        </span>
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
          <span className={styles.infoLabel}>Code Snippet Analyzed:</span>
          <pre>
            <code>{submission.codeSnippet}</code>
          </pre>
        </div>
        <div className={styles.infoEntry}>
          <span className={styles.infoLabel}>Prediction Prompt Given:</span>
          <p className={styles.infoText}>
            {submission.userPredictionPromptText}
          </p>
        </div>
        <div className={styles.infoEntry}>
          <span className={styles.infoLabel}>Student's Prediction:</span>
          <p className={styles.infoText}>{submission.userPredictionText}</p>
        </div>
        <div className={styles.infoEntry}>
          <span className={styles.infoLabel}>Confidence:</span>
          <span className={styles.infoText}>
            {submission.userPredictionConfidence}/3
          </span>{" "}
          {/* Assuming 1-3 scale */}
        </div>
        {submission.actualOutputSummary && (
          <div className={styles.infoEntry}>
            <span className={styles.infoLabel}>
              Actual Output Summary (User Reported):
            </span>
            <p className={styles.infoText}>{submission.actualOutputSummary}</p>
          </div>
        )}
        <div className={styles.infoEntry}>
          <span className={styles.infoLabel}>
            Student's Explanation/Reflection:
          </span>
          {/* Using div for infoText for ReactMarkdown to render block elements correctly if any */}
          <div className={styles.infoText}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {submission.userExplanationText || "(No explanation provided)"}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className={styles.aiFeedbackBlock}>
        <h5>AI Evaluation:</h5>
        <div className={styles.evaluationItem}>
          <strong>Prediction Assessment:</strong>
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
            <strong>Explanation Assessment:</strong>
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
            <strong>Overall Comment:</strong>
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
