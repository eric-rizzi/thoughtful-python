import React, { useMemo, useEffect } from "react"; // 👈 Import useEffect
import type {
  CoverageSectionData,
  InputParam,
  LessonId,
  UnitId,
  SavedCoverageState,
} from "../../types/data";
import styles from "./Section.module.css";
import coverageStyles from "./CoverageSection.module.css";
import { useInteractiveTableLogic } from "../../hooks/useInteractiveTableLogic";
import CodeEditor from "../CodeEditor";
import ContentRenderer from "../content_blocks/ContentRenderer";
import { useProgressActions } from "../../stores/progressStore";

interface CoverageSectionProps {
  section: CoverageSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const { completeSection } = useProgressActions();

  const {
    savedState,
    runningStates,
    isLoading,
    pyodideError,
    handleUserInputChange,
    runRow,
  } = useInteractiveTableLogic({
    unitId,
    lessonId,
    sectionId: section.id,
    mode: "coverage",
    functionCode: section.example.initialCode,
    functionToTest: section.coverageTable.functionToTest,
    columns: section.coverageTable.columns,
    rows: section.coverageTable.rows,
  });

  const challengeStates = (savedState as SavedCoverageState).challengeStates;

  const completedCount = useMemo(() => {
    return Object.values(challengeStates).filter((s) => s.isCorrect).length;
  }, [challengeStates]);

  const totalChallenges = section.coverageTable.rows.length;
  const progressPercent =
    totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  const isComplete = totalChallenges > 0 && completedCount === totalChallenges;

  useEffect(() => {
    if (isComplete) {
      completeSection(unitId, lessonId, section.id);
    }
  }, [isComplete, unitId, lessonId, section.id, completeSection]);

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={coverageStyles.coverageCodeDisplayContainer}>
        <div className={styles.exampleContainer}>
          <h4 className={coverageStyles.coverageCodeDisplayTitle}>
            Code to Analyze:
          </h4>
          <CodeEditor
            value={section.example.initialCode}
            onChange={() => {}}
            readOnly={true}
            minHeight="50px"
          />
          <div className={coverageStyles.coverageInstruction}>
            <p>
              For each "Expected Output" below, fill in the input fields and
              click "Run" to see if the code produces that exact output.
            </p>
          </div>

          <div className={coverageStyles.coverageTableContainer}>
            <table className={coverageStyles.coverageTable}>
              <thead>
                <tr>
                  {section.coverageTable.columns.map((param) => (
                    <th key={param.variableName}>
                      Input: {param.variableName}
                    </th>
                  ))}
                  <th>Expected Output</th>
                  <th>Actual Output</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {section.coverageTable.rows.map((challenge, rowIndex) => {
                  const state = challengeStates[rowIndex];
                  const isRunning = runningStates[rowIndex] || false;
                  const rowClass =
                    state?.isCorrect === true
                      ? coverageStyles.correctRow
                      : state?.isCorrect === false
                      ? coverageStyles.incorrectRow
                      : "";

                  return (
                    <tr key={rowIndex} className={rowClass}>
                      {section.coverageTable.columns.map(
                        (param: InputParam) => (
                          <td key={param.variableName}>
                            <input
                              type={
                                param.variableType === "number"
                                  ? "number"
                                  : "text"
                              }
                              className={coverageStyles.coverageInput}
                              value={state?.inputs[param.variableName] ?? ""}
                              onChange={(e) =>
                                handleUserInputChange(
                                  rowIndex,
                                  e.target.value,
                                  param.variableName
                                )
                              }
                              disabled={isRunning || isLoading}
                            />
                          </td>
                        )
                      )}
                      <td className={coverageStyles.expectedOutputCell}>
                        <pre>{challenge.expectedOutput}</pre>
                      </td>
                      <td
                        className={`${coverageStyles.actualOutputCell} ${
                          state?.isCorrect === false
                            ? coverageStyles.incorrect
                            : ""
                        }`}
                      >
                        <pre>{state?.actualOutput ?? ""}</pre>
                      </td>
                      <td className={coverageStyles.actionCell}>
                        <button
                          onClick={() => runRow(rowIndex)}
                          disabled={isRunning || isLoading || !!pyodideError}
                          className={coverageStyles.coverageRunButton}
                        >
                          {isRunning ? "Running..." : "Run"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={coverageStyles.coverageProgress}>
            <div className={styles.progressBar}>
              <div
                className={
                  isComplete ? styles.progressFillComplete : styles.progressFill
                }
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>
              {completedCount} / {totalChallenges} challenges completed
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoverageSection;
