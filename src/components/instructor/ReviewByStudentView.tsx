import React, { useState, useEffect } from "react";
import type {
  UserId,
  LessonId,
  Unit,
  SectionId,
  IsoTimestamp,
} from "../../types/data";
import type {
  InstructorStudentInfo,
  ReflectionVersionItem,
  StoredPrimmSubmissionItem,
} from "../../types/apiServiceTypes";
import * as apiService from "../../lib/apiService";
import * as dataLoader from "../../lib/dataLoader";
import { useAuthStore } from "../../stores/authStore";
import { API_GATEWAY_BASE_URL } from "../../config";
import LoadingSpinner from "../LoadingSpinner";
import styles from "./InstructorViews.module.css";

import RenderReflectionVersions from "./shared/RenderReflectionVersions";
import RenderPrimmActivity from "./shared/RenderPrimmActivity";

// Type for the combined list of student's work items
interface StudentWorkListItem {
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
    StudentWorkListItem[]
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
      // units prop might be empty initially if parent is still loading them
      if (units && units.length > 0) {
        for (const unit of units) {
          for (const lessonRef of unit.lessons) {
            if (!newMap.has(lessonRef.guid)) {
              // lessonRef.id is the GUID
              const lessonData = await dataLoader.fetchLessonData(
                lessonRef.path
              );
              if (lessonData) {
                newMap.set(lessonRef.guid, lessonData.title);
              }
            }
          }
        }
      }
      setLessonTitlesMap(newMap);
    };
    fetchAllLessonTitles();
  }, [units]); // Re-run if units prop changes

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
    const combinedWork: StudentWorkListItem[] = [];

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
        );
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
          // sectionTitle: "Section Title Placeholder", // TODO: Get section title if available
          date: latestVersion.createdAt,
          sortDate: new Date(latestVersion.createdAt),
          data: versions, // Pass all versions for this reflection assignment
        });
      }
    });

    studentPrimmSubmissions.forEach((sub) => {
      combinedWork.push({
        key: `primm-${sub.submissionCompositeKey}`,
        type: "PRIMM",
        title: `PRIMM: Example ${sub.primmExampleId} (Sec: ${sub.sectionId})`,
        lessonGuid: sub.lessonId,
        lessonTitle: lessonTitlesMap.get(sub.lessonId) || "Unknown Lesson",
        sectionId: sub.sectionId,
        // sectionTitle: "Section Title Placeholder",
        date: sub.timestampIso,
        sortDate: new Date(sub.timestampIso),
        data: sub, // Single PRIMM submission item
      });
    });

    combinedWork.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    setAllDisplayableWork(combinedWork);
    if (combinedWork.length > 0 && currentWorkItemIndex === null) {
      // Set to first item if not already set
      setCurrentWorkItemIndex(0);
    } else if (combinedWork.length === 0) {
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
          onChange={(e) => {
            setSelectedStudentId(e.target.value as UserId);
            setCurrentWorkItemIndex(null);
            setAllDisplayableWork([]);
          }}
          className={styles.filterSelect}
          disabled={permittedStudents.length === 0}
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
              style={{ maxHeight: "300px", marginBottom: "1rem" }}
            >
              <p
                style={{
                  padding: "0.5rem 1rem",
                  margin: 0,
                  fontSize: "0.9em",
                  color: "#555",
                }}
              >
                Select an assignment from{" "}
                {selectedStudentInfo?.studentName || selectedStudentId}'s work:
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
              No submissions (Reflections or PRIMM) found for this student.
            </p>
          )}

          {currentWorkItem && (
            <div className={styles.submissionViewer}>
              {currentWorkItem.type === "Reflection" ? (
                <RenderReflectionVersions
                  versions={currentWorkItem.data as ReflectionVersionItem[]}
                  studentName={selectedStudentInfo?.studentName}
                  lessonGuid={currentWorkItem.lessonGuid}
                  sectionId={currentWorkItem.sectionId as SectionId}
                />
              ) : currentWorkItem.type === "PRIMM" ? (
                <RenderPrimmActivity
                  submission={currentWorkItem.data as StoredPrimmSubmissionItem}
                  studentName={selectedStudentInfo?.studentName}
                  lessonGuid={currentWorkItem.lessonGuid}
                  sectionId={currentWorkItem.sectionId as SectionId}
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
      {!selectedStudentId && permittedStudents.length > 0 && (
        <p className={styles.placeholderMessage}>
          Please select a student to view their work.
        </p>
      )}
    </div>
  );
};

export default ReviewByStudentView;
