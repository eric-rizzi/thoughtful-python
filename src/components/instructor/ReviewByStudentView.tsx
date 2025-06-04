import React, { useState, useEffect } from "react";
import type {
  UserId,
  LessonId,
  SectionId,
  Unit,
  IsoTimestamp,
} from "../../types/data";
import type {
  InstructorStudentInfo,
  ReflectionVersionItem,
  StoredPrimmSubmissionItem,
} from "../../types/apiServiceTypes";
import * as apiService from "../../lib/apiService";
import * as dataLoader from "../../lib/dataLoader"; // To get lesson titles
import { useAuthStore } from "../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../config";
import LoadingSpinner from "../LoadingSpinner";
import styles from "./InstructorViews.module.css"; // Reuse styles
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

// --- Display Components (Can be shared or adapted from ReviewByAssignmentView) ---
const IterativeReflectionDisplay: React.FC<{
  versions: ReflectionVersionItem[];
  studentName?: string | null;
}> = ({ versions, studentName }) => {
  if (!versions || versions.length === 0) return <p>No versions.</p>;
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const finalOrLatestVersion =
    sortedVersions.find((v) => v.isFinal) || sortedVersions[0];

  return (
    <div
      className={styles.submissionDetailCard}
      style={{ border: "none", padding: 0 }}
    >
      <h4>Topic: {finalOrLatestVersion.userTopic}</h4>
      <p>
        <strong>Student:</strong> {studentName || finalOrLatestVersion.userId}
      </p>
      <Link
        to={`/lesson/${finalOrLatestVersion.lessonId}#${finalOrLatestVersion.sectionId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.contextLink}
      >
        View Original Section
      </Link>
      <div className={styles.iterationsContainer} style={{ marginTop: "1rem" }}>
        <h5>Version History (Newest First):</h5>
        {sortedVersions.map((version, index) => (
          <details
            key={version.versionId}
            className={styles.iterationDetail}
            open={index === 0}
          >
            <summary>
              Version {sortedVersions.length - index} (
              {version.isFinal ? "Final" : "Draft"}) -{" "}
              {new Date(version.createdAt).toLocaleDateString()}
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
            <div
              className={styles.submissionDetailCard}
              style={{ borderTop: "1px solid #eee", marginTop: "0.5rem" }}
            >
              <p>
                <strong>Submitted:</strong>{" "}
                {new Date(version.createdAt).toLocaleString()}
              </p>
              <div>
                <strong>Code:</strong>
                <pre>
                  <code>{version.userCode}</code>
                </pre>
              </div>
              <div>
                <strong>Explanation:</strong>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {version.userExplanation}
                </ReactMarkdown>
              </div>
              {version.aiAssessment && (
                <div className={styles.aiFeedbackBlock}>
                  <strong>AI Assessment:</strong>
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
                    <p className={styles.feedbackText}>
                      <em>{version.aiFeedback}</em>
                    </p>
                  )}
                </div>
              )}
              {!version.aiAssessment && (
                <p>
                  <em>No AI feedback recorded for this version.</em>
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

const PrimmSubmissionDisplay: React.FC<{
  submission: StoredPrimmSubmissionItem;
  studentName?: string | null;
}> = ({ submission, studentName }) => {
  return (
    <div
      className={styles.submissionDetailCard}
      style={{ border: "none", padding: 0 }}
    >
      <h4>PRIMM Analysis: Example '{submission.primmExampleId}'</h4>
      <p>
        <strong>Student:</strong> {studentName || submission.userId}
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(submission.timestampIso).toLocaleString()}
      </p>
      <Link
        to={`/lesson/${submission.lessonId}#${submission.sectionId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.contextLink}
      >
        View Original Section & Example
      </Link>
      <div style={{ marginTop: "0.5rem" }}>
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
      </p>
      {submission.actualOutputSummary && (
        <p>
          <strong>Actual Output Summary (User Reported):</strong>{" "}
          {submission.actualOutputSummary}
        </p>
      )}
      <p>
        <strong>User's Explanation:</strong>{" "}
        {submission.userExplanationText || "N/A"}
      </p>
      <div className={styles.aiFeedbackBlock}>
        <h5>AI Evaluation:</h5>
        <p>
          <strong>Prediction Assessment:</strong>
          <span
            className={`${styles.assessmentLabel} ${
              styles[
                "assessment" +
                  submission.aiPredictionAssessment.charAt(0).toUpperCase() +
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
                    submission.aiExplanationAssessment.charAt(0).toUpperCase() +
                    submission.aiExplanationAssessment.slice(1)
                ]
              }`}
            >
              {submission.aiExplanationAssessment.toUpperCase()}
            </span>
          </p>
        )}
        {submission.aiOverallComment && (
          <p className={styles.feedbackText}>
            <strong>Overall Comment:</strong>{" "}
            <em>{submission.aiOverallComment}</em>
          </p>
        )}
      </div>
    </div>
  );
};
// --- End Display Components ---

interface DisplayableStudentWorkItem {
  key: string;
  type: "Reflection" | "PRIMM";
  title: string;
  lessonGuid: LessonId;
  lessonTitle?: string;
  sectionId: SectionId;
  sectionTitle?: string;
  date: IsoTimestamp;
  sortDate: Date;
  data: ReflectionVersionItem[] | StoredPrimmSubmissionItem;
}

interface ReviewByStudentViewProps {
  permittedStudents: InstructorStudentInfo[];
  units: Unit[];
}

const ReviewByStudentView: React.FC<ReviewByStudentViewProps> = ({
  permittedStudents,
  units,
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

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allDisplayableWork, setAllDisplayableWork] = useState<
    DisplayableStudentWorkItem[]
  >([]);
  const [currentWorkItemIndex, setCurrentWorkItemIndex] = useState<
    number | null
  >(null);

  const [lessonTitlesMap, setLessonTitlesMap] = useState<Map<LessonId, string>>(
    new Map()
  );

  // Pre-fetch all lesson titles for context
  useEffect(() => {
    const fetchAllLessonTitles = async () => {
      const newMap = new Map<LessonId, string>();
      for (const unit of units) {
        for (const lessonRef of unit.lessons) {
          if (!newMap.has(lessonRef.guid)) {
            // lessonRef.id is the GUID
            const lessonData = await dataLoader.fetchLessonData(lessonRef.path);
            if (lessonData) {
              newMap.set(lessonRef.guid, lessonData.title);
            }
          }
        }
      }
      setLessonTitlesMap(newMap);
    };
    if (units.length > 0) {
      fetchAllLessonTitles();
    }
  }, [units]);

  useEffect(() => {
    if (selectedStudentId && isAuthenticated && idToken && apiGatewayUrl) {
      const fetchStudentData = async () => {
        setIsLoadingData(true);
        setError(null);
        setStudentLearningEntries([]);
        setStudentPrimmSubmissions([]);
        setAllDisplayableWork([]);
        setCurrentWorkItemIndex(null);

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
          /* ... error handling ... */
          console.error(
            `Failed to fetch data for student ${selectedStudentId}:`,
            err
          );
          if (err instanceof apiService.ApiError) {
            setError(`Error: ${err.data.message || err.message}`);
          } else {
            setError("An unknown error occurred.");
          }
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchStudentData();
    } else {
      setStudentLearningEntries([]);
      setStudentPrimmSubmissions([]);
      setAllDisplayableWork([]);
      setCurrentWorkItemIndex(null);
    }
  }, [selectedStudentId, isAuthenticated, idToken, apiGatewayUrl]);

  // Combine and sort all work items when entries or submissions change
  useEffect(() => {
    const combinedWork: DisplayableStudentWorkItem[] = [];

    // Group reflections by lessonId and sectionId to treat iterations as one "assignment"
    const groupedReflections: Record<string, ReflectionVersionItem[]> = {};
    studentLearningEntries.forEach((entry) => {
      const groupKey = `${entry.lessonId}-${entry.sectionId}`;
      if (!groupedReflections[groupKey]) groupedReflections[groupKey] = [];
      groupedReflections[groupKey].push(entry);
    });

    Object.values(groupedReflections).forEach((versions) => {
      if (versions.length > 0) {
        versions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ); // Newest first
        const latestVersion = versions[0];
        combinedWork.push({
          key: `reflection-${latestVersion.lessonId}-${latestVersion.sectionId}`,
          type: "Reflection",
          title:
            latestVersion.userTopic ||
            `Reflection for Section ${latestVersion.sectionId}`,
          lessonGuid: latestVersion.lessonId,
          lessonTitle:
            lessonTitlesMap.get(latestVersion.lessonId) || "Unknown Lesson",
          sectionId: latestVersion.sectionId,
          sectionTitle: `Section: ${latestVersion.sectionId}`, // Placeholder, ideally get section title too
          date: latestVersion.createdAt,
          sortDate: new Date(latestVersion.createdAt),
          data: versions, // Pass all versions
        });
      }
    });

    studentPrimmSubmissions.forEach((sub) => {
      combinedWork.push({
        key: `primm-${sub.submissionCompositeKey}`,
        type: "PRIMM",
        title: `PRIMM: Example ${sub.primmExampleId}`,
        lessonGuid: sub.lessonId,
        lessonTitle: lessonTitlesMap.get(sub.lessonId) || "Unknown Lesson",
        sectionId: sub.sectionId,
        sectionTitle: `Section: ${sub.sectionId}`, // Placeholder
        date: sub.timestampIso,
        sortDate: new Date(sub.timestampIso),
        data: sub,
      });
    });

    combinedWork.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()); // Newest first
    setAllDisplayableWork(combinedWork);
    if (combinedWork.length > 0) {
      setCurrentWorkItemIndex(0); // Default to showing the first item
    } else {
      setCurrentWorkItemIndex(null);
    }
  }, [studentLearningEntries, studentPrimmSubmissions, lessonTitlesMap]);

  const selectedStudentInfo = permittedStudents.find(
    (s) => s.studentId === selectedStudentId
  );
  const currentWorkItem =
    currentWorkItemIndex !== null
      ? allDisplayableWork[currentWorkItemIndex]
      : null;

  const handleNextAssignment = () => {
    setCurrentWorkItemIndex((prev) =>
      prev !== null && prev < allDisplayableWork.length - 1 ? prev + 1 : prev
    );
  };
  const handlePrevAssignment = () => {
    setCurrentWorkItemIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : prev
    );
  };

  return (
    <div className={styles.viewContainer}>
      <h3>Review by Student</h3>
      <div className={styles.filters}>
        <select
          id="student-select-by-student"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value as UserId)}
          className={styles.filterSelect}
          disabled={permittedStudents.length === 0}
        >
          <option value="">Select Student</option>
          {permittedStudents.map((student) => (
            <option key={student.studentId} value={student.studentId}>
              {student.studentName || student.studentId}{" "}
              {student.studentEmail ? `(${student.studentEmail})` : ""}
            </option>
          ))}
        </select>
      </div>

      {isLoadingData && (
        <LoadingSpinner
          message={`Loading data for ${
            selectedStudentInfo?.studentName || selectedStudentId
          }...`}
        />
      )}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {selectedStudentId && !isLoadingData && !error && (
        <>
          {allDisplayableWork.length > 0 ? (
            <div
              className={styles.assignmentListContainer}
              style={{ maxHeight: "250px", marginBottom: "1rem" }}
            >
              <p
                style={{
                  padding: "0.5rem 1rem",
                  margin: 0,
                  fontSize: "0.9em",
                  color: "#555",
                }}
              >
                Select an assignment to view details:
              </p>
              <ul className={styles.assignmentList}>
                {allDisplayableWork.map((item, index) => (
                  <li
                    key={item.key}
                    className={`${styles.assignmentListItem} ${
                      currentWorkItemIndex === index ? styles.selected : ""
                    }`}
                    onClick={() => setCurrentWorkItemIndex(index)}
                  >
                    <span className={styles.assignmentTitle}>{item.title}</span>
                    <span className={styles.assignmentMeta}>
                      {item.lessonTitle} -{" "}
                      {new Date(item.date).toLocaleDateString()} ({item.type})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className={styles.placeholderMessage}>
              No submissions found for this student.
            </p>
          )}

          {currentWorkItem && (
            <div className={styles.submissionViewer}>
              <h4>
                Viewing: {currentWorkItem.title}
                <span
                  style={{
                    fontSize: "0.9em",
                    fontWeight: "normal",
                    marginLeft: "10px",
                  }}
                >
                  (Lesson: {currentWorkItem.lessonTitle})
                </span>
              </h4>
              {currentWorkItem.type === "Reflection" ? (
                <IterativeReflectionDisplay
                  versions={currentWorkItem.data as ReflectionVersionItem[]}
                  studentName={selectedStudentInfo?.studentName}
                />
              ) : currentWorkItem.type === "PRIMM" ? (
                <PrimmSubmissionDisplay
                  submission={currentWorkItem.data as StoredPrimmSubmissionItem}
                  studentName={selectedStudentInfo?.studentName}
                />
              ) : null}

              {allDisplayableWork.length > 1 && (
                <div className={styles.navigationButtons}>
                  <button
                    onClick={handlePrevAssignment}
                    disabled={
                      currentWorkItemIndex === 0 ||
                      currentWorkItemIndex === null
                    }
                  >
                    &larr; Previous Assignment
                  </button>
                  <span>
                    Assignment{" "}
                    {currentWorkItemIndex !== null
                      ? currentWorkItemIndex + 1
                      : "-"}
                    /{allDisplayableWork.length}
                  </span>
                  <button
                    onClick={handleNextAssignment}
                    disabled={
                      currentWorkItemIndex === null ||
                      currentWorkItemIndex >= allDisplayableWork.length - 1
                    }
                  >
                    Next Assignment &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewByStudentView;
