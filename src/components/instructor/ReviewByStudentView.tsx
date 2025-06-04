// src/components/instructor/ReviewByStudentView.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  InstructorStudentInfo,
  UserId,
  LessonId,
  SectionId,
  AssessmentLevel,
} from "../../types/data"; // Assuming these are in data.ts
import type {
  ReflectionVersionItem,
  StoredPrimmSubmissionItem,
} from "../../types/apiServiceTypes";
import * as apiService from "../../lib/apiService";
import { useAuthStore } from "../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../config";
import LoadingSpinner from "../LoadingSpinner";
import styles from "./InstructorViews.module.css"; // Reuse styles
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom"; // For contextual link-backs

interface ReviewByStudentViewProps {
  permittedStudents: InstructorStudentInfo[];
  // units and lessons might be needed for contextual links if not part of submission data
  // For now, assuming submission data has enough context or we link by IDs
}

const ReflectionEntryDetailModal: React.FC<{
  entryVersions: ReflectionVersionItem[]; // All versions for a specific reflection
  onClose: () => void;
  studentName?: string | null;
}> = ({ entryVersions, onClose, studentName }) => {
  if (!entryVersions || entryVersions.length === 0) return null;

  // Sort by createdAt descending (newest first) to show final/latest first
  const sortedVersions = [...entryVersions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const finalVersion =
    sortedVersions.find((v) => v.isFinal) || sortedVersions[0];

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Reflection Details: {finalVersion.userTopic}</h3>
        <p>
          <strong>Student:</strong> {studentName || finalVersion.userId}
        </p>
        <p>
          <strong>Lesson:</strong> {finalVersion.lessonId} /{" "}
          <strong>Section:</strong> {finalVersion.sectionId}
        </p>
        <Link
          to={`/lesson/${finalVersion.lessonId}#${finalVersion.sectionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contextLink}
        >
          View Original Section
        </Link>

        <div className={styles.iterationsContainer}>
          <h4>Versions (Newest First):</h4>
          {sortedVersions.map((version, index) => (
            <details
              key={version.versionId}
              className={styles.iterationDetail}
              open={index === 0}
            >
              <summary>
                Version {sortedVersions.length - index} (
                {version.isFinal ? "Final" : "Draft"}) -{" "}
                {new Date(version.createdAt).toLocaleString()}
                {version.aiAssessment && (
                  <span
                    className={`${styles.assessmentLabelSmall} ${
                      styles[
                        "assessment" +
                          version.aiAssessment.charAt(0).toUpperCase() +
                          version.aiAssessment.slice(1)
                      ]
                    }`}
                  >
                    {version.aiAssessment.toUpperCase()}
                  </span>
                )}
              </summary>
              <div className={styles.submissionDetailCard}>
                <p>
                  <strong>Topic:</strong> {version.userTopic}
                </p>
                <div>
                  <strong>Code:</strong>
                  <pre>
                    <code>{version.userCode}</code>
                  </pre>
                </div>
                <div>
                  <strong>Explanation:</strong>
                  <p>{version.userExplanation}</p>
                </div>
                {version.aiAssessment && (
                  <div className={styles.aiFeedbackBlock}>
                    <strong>AI Assessment:</strong>{" "}
                    <span
                      className={`${styles.assessmentLabel} ${
                        styles[
                          "assessment" +
                            version.aiAssessment.charAt(0).toUpperCase() +
                            version.aiAssessment.slice(1)
                        ]
                      }`}
                    >
                      {version.aiAssessment.toUpperCase()}
                    </span>
                    {version.aiFeedback && (
                      <p>
                        <em>{version.aiFeedback}</em>
                      </p>
                    )}
                  </div>
                )}
                {!version.aiAssessment && (
                  <p>
                    <em>No AI feedback for this version.</em>
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
};

const PrimmSubmissionDetailModal: React.FC<{
  submission: StoredPrimmSubmissionItem;
  onClose: () => void;
  studentName?: string | null;
}> = ({ submission, onClose, studentName }) => {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>PRIMM Submission Details</h3>
        <p>
          <strong>Student:</strong> {studentName || submission.userId}
        </p>
        <p>
          <strong>Lesson:</strong> {submission.lessonId} /{" "}
          <strong>Section:</strong> {submission.sectionId} /{" "}
          <strong>Example:</strong> {submission.primmExampleId}
        </p>
        <Link
          to={`/lesson/${submission.lessonId}#${submission.sectionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contextLink}
        >
          View Original Section & Example
        </Link>
        <div
          className={styles.submissionDetailCard}
          style={{ marginTop: "1rem" }}
        >
          <div>
            <strong>Code Snippet Analyzed:</strong>
            <pre>
              <code>{submission.codeSnippet}</code>
            </pre>
          </div>
          <p>
            <strong>Prediction Prompt:</strong>{" "}
            {submission.userPredictionPromptText}
          </p>
          <p>
            <strong>User's Prediction:</strong> {submission.userPredictionText}
          </p>
          <p>
            <strong>Confidence:</strong> {submission.userPredictionConfidence}/3
          </p>{" "}
          {/* Assuming 1-3 scale */}
          {submission.actualOutputSummary && (
            <p>
              <strong>Actual Output Summary:</strong>{" "}
              {submission.actualOutputSummary}
            </p>
          )}
          <p>
            <strong>User's Explanation:</strong>{" "}
            {submission.userExplanationText || "N/A"}
          </p>
          <div className={styles.aiFeedbackBlock}>
            <h4>AI Evaluation:</h4>
            <p>
              <strong>Prediction Assessment:</strong>
              <span
                className={`${styles.assessmentLabel} ${
                  styles[
                    "assessment" +
                      submission.aiPredictionAssessment
                        .charAt(0)
                        .toUpperCase() +
                      submission.aiPredictionAssessment.slice(1)
                  ]
                }`}
              >
                {submission.aiPredictionAssessment.toUpperCase()}
              </span>
            </p>
            {submission.aiExplanationAssessment && (
              <p>
                <strong>Explanation Assessment:</strong>
                <span
                  className={`${styles.assessmentLabel} ${
                    styles[
                      "assessment" +
                        submission.aiExplanationAssessment
                          .charAt(0)
                          .toUpperCase() +
                        submission.aiExplanationAssessment.slice(1)
                    ]
                  }`}
                >
                  {submission.aiExplanationAssessment.toUpperCase()}
                </span>
              </p>
            )}
            {submission.aiOverallComment && (
              <p>
                <strong>Overall Comment:</strong>{" "}
                <em>{submission.aiOverallComment}</em>
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
};

const ReviewByStudentView: React.FC<ReviewByStudentViewProps> = ({
  permittedStudents,
}) => {
  const { idToken, isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const [selectedStudentId, setSelectedStudentId] = useState<UserId | "">("");
  const [studentLearningEntries, setStudentLearningEntries] = useState<
    ReflectionVersionItem[]
  >([]);
  const [studentPrimmSubmissions, setStudentPrimmSubmissions] = useState<
    StoredPrimmSubmissionItem[]
  >([]);

  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingPrimm, setIsLoadingPrimm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewingEntryDetail, setViewingEntryDetail] = useState<
    ReflectionVersionItem[] | null
  >(null); // Store all versions for one reflection
  const [viewingPrimmDetail, setViewingPrimmDetail] =
    useState<StoredPrimmSubmissionItem | null>(null);

  const selectedStudentInfo = permittedStudents.find(
    (s) => s.studentId === selectedStudentId
  );

  useEffect(() => {
    if (selectedStudentId && isAuthenticated && idToken && apiGatewayUrl) {
      const fetchStudentData = async () => {
        setIsLoadingEntries(true);
        setIsLoadingPrimm(true);
        setError(null);
        setStudentLearningEntries([]);
        setStudentPrimmSubmissions([]); // Clear previous

        try {
          const [entriesResponse, primmResponse] = await Promise.all([
            apiService.getInstructorStudentLearningEntries(
              idToken,
              apiGatewayUrl,
              selectedStudentId
            ),
            apiService.getInstructorStudentPrimmSubmissions(
              idToken,
              apiGatewayUrl,
              selectedStudentId
            ),
          ]);
          setStudentLearningEntries(entriesResponse.entries);
          setStudentPrimmSubmissions(primmResponse.submissions);
        } catch (err) {
          console.error(
            `Failed to fetch data for student ${selectedStudentId}:`,
            err
          );
          if (err instanceof apiService.ApiError) {
            setError(
              `Error fetching student data: ${err.data.message || err.message}`
            );
          } else {
            setError("An unknown error occurred while fetching student data.");
          }
        } finally {
          setIsLoadingEntries(false);
          setIsLoadingPrimm(false);
        }
      };
      fetchStudentData();
    } else {
      // Clear data if no student selected or not authenticated
      setStudentLearningEntries([]);
      setStudentPrimmSubmissions([]);
    }
  }, [selectedStudentId, isAuthenticated, idToken, apiGatewayUrl]);

  const groupLearningEntries = (
    entries: ReflectionVersionItem[]
  ): Record<string, ReflectionVersionItem[]> => {
    const grouped: Record<string, ReflectionVersionItem[]> = {};
    entries.forEach((entry) => {
      const key = `${entry.lessonId}-${entry.sectionId}`; // Group by lesson and section
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    });
    // Sort versions within each group by createdAt descending (newest first)
    for (const key in grouped) {
      grouped[key].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return grouped;
  };

  const groupedEntries = useMemo(
    () => groupLearningEntries(studentLearningEntries),
    [studentLearningEntries]
  );

  return (
    <div className={styles.viewContainer}>
      <h3>Review by Student</h3>
      <div className={styles.filters}>
        {" "}
        {/* Reusing filters class for layout */}
        <label
          htmlFor="student-select"
          style={{ marginRight: "0.5rem", fontWeight: "500" }}
        >
          Select Student:
        </label>
        <select
          id="student-select"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value as UserId)}
          className={styles.filterSelect}
        >
          <option value="">-- Select a Student --</option>
          {permittedStudents.map((student) => (
            <option key={student.studentId} value={student.studentId}>
              {student.studentName || student.studentId}{" "}
              {student.studentEmail ? `(${student.studentEmail})` : ""}
            </option>
          ))}
        </select>
      </div>

      {isLoadingEntries ||
        (isLoadingPrimm && (
          <LoadingSpinner
            message={`Loading data for ${
              selectedStudentInfo?.studentName || selectedStudentId
            }...`}
          />
        ))}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {selectedStudentId && !isLoadingEntries && !isLoadingPrimm && !error && (
        <div className={styles.studentDataContainer}>
          <div className={styles.submissionCategory}>
            <h4>Learning Entries (Reflections)</h4>
            {studentLearningEntries.length > 0 ? (
              <ul className={styles.submissionList}>
                {Object.entries(groupedEntries).map(([groupKey, versions]) => {
                  const finalOrLatestVersion =
                    versions.find((v) => v.isFinal) || versions[0];
                  return (
                    <li
                      key={groupKey}
                      className={styles.submissionListItem}
                      onClick={() => setViewingEntryDetail(versions)}
                    >
                      <strong>
                        {finalOrLatestVersion.userTopic ||
                          "Untitled Reflection"}
                      </strong>
                      <br />
                      <small>
                        Lesson: {finalOrLatestVersion.lessonId}, Section:{" "}
                        {finalOrLatestVersion.sectionId}
                      </small>
                      <br />
                      <small>
                        Last updated:{" "}
                        {new Date(
                          finalOrLatestVersion.createdAt
                        ).toLocaleDateString()}
                      </small>
                      {finalOrLatestVersion.aiAssessment && (
                        <span
                          className={`${styles.assessmentLabelSmall} ${
                            styles[
                              "assessment" +
                                finalOrLatestVersion.aiAssessment
                                  .charAt(0)
                                  .toUpperCase() +
                                finalOrLatestVersion.aiAssessment.slice(1)
                            ]
                          }`}
                        >
                          {finalOrLatestVersion.aiAssessment.toUpperCase()}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.placeholderMessage}>
                No learning entries found for this student.
              </p>
            )}
          </div>

          <div className={styles.submissionCategory}>
            <h4>PRIMM Submissions</h4>
            {studentPrimmSubmissions.length > 0 ? (
              <ul className={styles.submissionList}>
                {studentPrimmSubmissions.map((sub) => (
                  <li
                    key={sub.submissionCompositeKey}
                    className={styles.submissionListItem}
                    onClick={() => setViewingPrimmDetail(sub)}
                  >
                    <strong>PRIMM: {sub.primmExampleId}</strong>
                    <br />
                    <small>
                      Lesson: {sub.lessonId}, Section: {sub.sectionId}
                    </small>
                    <br />
                    <small>
                      Submitted:{" "}
                      {new Date(sub.timestampIso).toLocaleDateString()}
                    </small>
                    {sub.aiPredictionAssessment && (
                      <span
                        className={`${styles.assessmentLabelSmall} ${
                          styles[
                            "assessment" +
                              sub.aiPredictionAssessment
                                .charAt(0)
                                .toUpperCase() +
                              sub.aiPredictionAssessment.slice(1)
                          ]
                        }`}
                      >
                        Pred: {sub.aiPredictionAssessment.toUpperCase()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholderMessage}>
                No PRIMM submissions found for this student.
              </p>
            )}
          </div>
        </div>
      )}

      {viewingEntryDetail && (
        <ReflectionEntryDetailModal
          entryVersions={viewingEntryDetail}
          onClose={() => setViewingEntryDetail(null)}
          studentName={selectedStudentInfo?.studentName}
        />
      )}
      {viewingPrimmDetail && (
        <PrimmSubmissionDetailModal
          submission={viewingPrimmDetail}
          onClose={() => setViewingPrimmDetail(null)}
          studentName={selectedStudentInfo?.studentName}
        />
      )}
    </div>
  );
};

export default ReviewByStudentView;
