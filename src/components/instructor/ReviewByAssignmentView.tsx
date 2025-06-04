// src/components/instructor/ReviewByAssignmentView.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  Unit,
  Lesson,
  LessonId,
  SectionId,
  AnyLessonSectionData,
  PRIMMCodeExample,
} from "../../types/data";
import type {
  ListOfAssignmentSubmissionsResponse,
  AssignmentSubmission,
} from "../../types/apiServiceTypes";
import * as dataLoader from "../../lib/dataLoader";
import * as apiService from "../../lib/apiService";
import { useAuthStore } from "../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../config";
import LoadingSpinner from "../LoadingSpinner";
import styles from "./InstructorViews.module.css";

// Helper to display Reflection details
const ReflectionSubmissionDetail: React.FC<{
  submission: AssignmentSubmission<"Reflection">;
}> = ({ submission }) => {
  const details = submission.submissionDetails;
  // For POC, just show final. Iterations would require more complex state/UI.
  return (
    <div className={styles.submissionDetailCard}>
      <h4>Reflection: {details.userTopic}</h4>
      <p>
        <strong>Student:</strong>{" "}
        {submission.studentName || submission.studentId}
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(details.createdAt).toLocaleString()}
      </p>
      <div>
        <strong>Code:</strong>
        <pre>
          <code>{details.userCode}</code>
        </pre>
      </div>
      <div>
        <strong>Explanation:</strong>
        <p>{details.userExplanation}</p>
      </div>
      {details.aiAssessment && (
        <div className={styles.aiFeedbackBlock}>
          <strong>AI Assessment:</strong>{" "}
          <span
            className={`${styles.assessmentLabel} ${
              styles[
                "assessment" +
                  details.aiAssessment.charAt(0).toUpperCase() +
                  details.aiAssessment.slice(1)
              ]
            }`}
          >
            {details.aiAssessment.toUpperCase()}
          </span>
          {details.aiFeedback && (
            <p>
              <em>{details.aiFeedback}</em>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Helper to display PRIMM details
const PrimmSubmissionDetail: React.FC<{
  submission: AssignmentSubmission<"PRIMM">;
}> = ({ submission }) => {
  const details = submission.submissionDetails;
  return (
    <div className={styles.submissionDetailCard}>
      <h4>
        PRIMM: {details.primmExampleId} (Lesson: {details.lessonId}, Section:{" "}
        {details.sectionId})
      </h4>
      <p>
        <strong>Student:</strong>{" "}
        {submission.studentName || submission.studentId}
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(details.timestampIso).toLocaleString()}
      </p>
      <div>
        <strong>Code Snippet:</strong>
        <pre>
          <code>{details.codeSnippet}</code>
        </pre>
      </div>
      <p>
        <strong>Prediction Prompt:</strong> {details.userPredictionPromptText}
      </p>
      <p>
        <strong>User Prediction:</strong> {details.userPredictionText}{" "}
        (Confidence: {details.userPredictionConfidence})
      </p>
      {details.actualOutputSummary && (
        <p>
          <strong>Actual Output Summary:</strong> {details.actualOutputSummary}
        </p>
      )}
      <p>
        <strong>User Explanation:</strong>{" "}
        {details.userExplanationText || "N/A"}
      </p>
      <div className={styles.aiFeedbackBlock}>
        <p>
          <strong>AI Prediction Assessment:</strong>{" "}
          <span
            className={`${styles.assessmentLabel} ${
              styles[
                "assessment" +
                  details.aiPredictionAssessment.charAt(0).toUpperCase() +
                  details.aiPredictionAssessment.slice(1)
              ]
            }`}
          >
            {details.aiPredictionAssessment.toUpperCase()}
          </span>
        </p>
        {details.aiExplanationAssessment && (
          <p>
            <strong>AI Explanation Assessment:</strong>{" "}
            <span
              className={`${styles.assessmentLabel} ${
                styles[
                  "assessment" +
                    details.aiExplanationAssessment.charAt(0).toUpperCase() +
                    details.aiExplanationAssessment.slice(1)
                ]
              }`}
            >
              {details.aiExplanationAssessment.toUpperCase()}
            </span>
          </p>
        )}
        {details.aiOverallComment && (
          <p>
            <strong>AI Overall Comment:</strong>{" "}
            <em>{details.aiOverallComment}</em>
          </p>
        )}
      </div>
    </div>
  );
};

const ReviewByAssignmentView: React.FC = () => {
  const { idToken, isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]); // Full Lesson objects
  const [selectedLessonId, setSelectedLessonId] = useState<LessonId | "">(""); // GUID
  const [sections, setSections] = useState<AnyLessonSectionData[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<SectionId | "">(
    ""
  );
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<
    "Reflection" | "PRIMM" | null
  >(null);
  const [primmExamples, setPrimmExamples] = useState<PRIMMCodeExample[]>([]);
  const [selectedPrimmExampleId, setSelectedPrimmExampleId] =
    useState<string>("");

  const [submissions, setSubmissions] = useState<
    AssignmentSubmission<"Reflection" | "PRIMM">[]
  >([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dataLoader.fetchUnitsData().then((data) => setUnits(data.units));
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      const unit = units.find((u) => u.id === selectedUnitId);
      if (unit) {
        Promise.all(
          unit.lessons.map((lr) => dataLoader.fetchLessonData(lr.path))
        ).then((loadedLessons) => {
          setLessons(loadedLessons.filter((l) => l !== null) as Lesson[]);
          setSelectedLessonId("");
          setSections([]);
          setSelectedSectionId("");
          setPrimmExamples([]);
          setSelectedPrimmExampleId("");
        });
      }
    } else {
      setLessons([]);
      setSelectedLessonId("");
    }
  }, [selectedUnitId, units]);

  useEffect(() => {
    if (selectedLessonId) {
      const lesson = lessons.find((l) => l.guid === selectedLessonId); // Lesson objects have .guid
      if (lesson) {
        const relevantSections = lesson.sections.filter(
          (s) => s.kind === "Reflection" || s.kind === "PRIMM"
        );
        setSections(relevantSections);
        setSelectedSectionId("");
        setPrimmExamples([]);
        setSelectedPrimmExampleId("");
      }
    } else {
      setSections([]);
      setSelectedSectionId("");
    }
  }, [selectedLessonId, lessons]);

  useEffect(() => {
    if (selectedSectionId) {
      const section = sections.find((s) => s.id === selectedSectionId);
      if (section?.kind === "PRIMM") {
        setSelectedAssignmentType("PRIMM");
        setPrimmExamples(section.examples);
        setSelectedPrimmExampleId(section.examples[0]?.id || "");
      } else if (section?.kind === "Reflection") {
        setSelectedAssignmentType("Reflection");
        setPrimmExamples([]);
        setSelectedPrimmExampleId("");
      } else {
        setSelectedAssignmentType(null);
      }
    } else {
      setSelectedAssignmentType(null);
    }
  }, [selectedSectionId, sections]);

  const fetchSubmissions = useCallback(async () => {
    if (
      !isAuthenticated ||
      !idToken ||
      !apiGatewayUrl ||
      !selectedUnitId ||
      !selectedLessonId ||
      !selectedSectionId ||
      !selectedAssignmentType
    ) {
      setSubmissions([]);
      return;
    }
    if (selectedAssignmentType === "PRIMM" && !selectedPrimmExampleId) {
      setSubmissions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSubmissions([]);
    setCurrentSubmissionIndex(0);
    try {
      const response = await apiService.getSubmissionsForAssignment(
        idToken,
        apiGatewayUrl,
        selectedUnitId,
        selectedLessonId,
        selectedSectionId,
        selectedAssignmentType,
        selectedAssignmentType === "PRIMM" ? selectedPrimmExampleId : undefined
      );
      setSubmissions(response.submissions);
    } catch (err) {
      /* ... error handling ... */
      console.error("Failed to fetch assignment submissions:", err);
      if (err instanceof apiService.ApiError) {
        setError(`Error: ${err.data.message || err.message}`);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    idToken,
    apiGatewayUrl,
    selectedUnitId,
    selectedLessonId,
    selectedSectionId,
    selectedAssignmentType,
    selectedPrimmExampleId,
  ]);

  const currentSubmission = submissions[currentSubmissionIndex];

  return (
    <div className={styles.viewContainer}>
      <h3>Review by Assignment</h3>
      <div className={styles.filters}>
        <select
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Select Unit</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.title}
            </option>
          ))}
        </select>
        <select
          value={selectedLessonId}
          onChange={(e) => setSelectedLessonId(e.target.value as LessonId)}
          disabled={!selectedUnitId}
          className={styles.filterSelect}
        >
          <option value="">Select Lesson</option>
          {lessons.map((lesson) => (
            <option key={lesson.guid} value={lesson.guid}>
              {lesson.title}
            </option>
          ))}
        </select>
        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value as SectionId)}
          disabled={!selectedLessonId}
          className={styles.filterSelect}
        >
          <option value="">Select Section (Reflection/PRIMM)</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title} ({section.kind})
            </option>
          ))}
        </select>
        {selectedAssignmentType === "PRIMM" && primmExamples.length > 0 && (
          <select
            value={selectedPrimmExampleId}
            onChange={(e) => setSelectedPrimmExampleId(e.target.value)}
            disabled={!selectedSectionId}
            className={styles.filterSelect}
          >
            <option value="">Select PRIMM Example</option>
            {primmExamples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                Example: {ex.id}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={fetchSubmissions}
          disabled={
            isLoading ||
            !selectedSectionId ||
            (selectedAssignmentType === "PRIMM" && !selectedPrimmExampleId)
          }
          className={styles.filterButton}
        >
          Load Submissions
        </button>
      </div>

      {isLoading && <LoadingSpinner message="Loading submissions..." />}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {!isLoading && !error && submissions.length > 0 && currentSubmission && (
        <div className={styles.submissionViewer}>
          <h4>
            Viewing Submission {currentSubmissionIndex + 1} of{" "}
            {submissions.length}
          </h4>
          {currentSubmission.submissionDetails.kind === "Reflection" ? ( // Need a way to distinguish or trust selectedAssignmentType
            <ReflectionSubmissionDetail
              submission={
                currentSubmission as AssignmentSubmission<"Reflection">
              }
            />
          ) : currentSubmission.submissionDetails.primmExampleId ? ( // Check if it's a PRIMM submission
            <PrimmSubmissionDetail
              submission={currentSubmission as AssignmentSubmission<"PRIMM">}
            />
          ) : (
            <p>Unsupported submission type.</p>
          )}
          <div className={styles.navigationButtons}>
            <button
              onClick={() =>
                setCurrentSubmissionIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentSubmissionIndex === 0}
            >
              Previous Student
            </button>
            <button
              onClick={() =>
                setCurrentSubmissionIndex((prev) =>
                  Math.min(submissions.length - 1, prev + 1)
                )
              }
              disabled={currentSubmissionIndex === submissions.length - 1}
            >
              Next Student
            </button>
          </div>
        </div>
      )}
      {!isLoading &&
        !error &&
        submissions.length === 0 &&
        (selectedSectionId || selectedPrimmExampleId) && (
          <p>No submissions found for this assignment.</p>
        )}
    </div>
  );
};

export default ReviewByAssignmentView;
