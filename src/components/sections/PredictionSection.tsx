import React, { useMemo } from "react";
import type {
  PredictionSectionData,
  UnitId,
  LessonId,
  SavedPredictionState,
} from "../../types/data";
import styles from "./Section.module.css";
import predictionStyles from "./CoverageSection.module.css";
import { useInteractiveTableLogic } from "../../hooks/useInteractiveTableLogic";
import CodeEditor from "../CodeEditor";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface PredictionSectionProps {
  section: PredictionSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

const PredictionSection: React.FC<PredictionSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const {
    savedState,
    isSectionComplete,
    runningStates,
    isLoading,
    pyodideError,
    handleUserInputChange,
    runRow,
  } = useInteractiveTableLogic({
    unitId,
    lessonId,
    sectionId: section.id,
    mode: "prediction",
    functionCode: section.example.initialCode,
    functionToTest: section.predictionTable.functionToTest,
    columns: section.predictionTable.columns,
    rows: section.predictionTable.rows,
  });

  const predictions = (savedState as SavedPredictionState).predictions;

  const completedCount = useMemo(() => {
    return Object.values(predictions).filter((p) => p.isCorrect).length;
  }, [predictions]);
  const totalChallenges = section.predictionTable.rows.length;
  const progressPercent =
    totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={predictionStyles.coverageCodeDisplayContainer}>
        <div className={styles.exampleContainer}>
          <h4 className={predictionStyles.coverageCodeDisplayTitle}>
            Code to Analyze:
          </h4>
          <CodeEditor
            value={section.example.initialCode}
            onChange={() => {}}
            readOnly={true}
            minHeight="50px"
          />
          <div className={predictionStyles.coverageInstruction}>
            <p>
              For each "Expected Output" below, fill in the input fields and
              click "Run" to see if the code produces that exact output.
            </p>
          </div>

          <div className={predictionStyles.coverageTableContainer}>
            <table className={predictionStyles.coverageTable}>
              <thead>
                <tr>
                  {section.predictionTable.columns.map((col, index) => (
                    <th key={index}>{col.variableName}</th>
                  ))}
                  <th>Your Prediction</th>
                  <th>Actual Output</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {section.predictionTable.rows.map((row, rowIndex) => {
                  const rowState = predictions[rowIndex];
                  const isRunning = runningStates[rowIndex];
                  const rowClass =
                    rowState?.isCorrect === true
                      ? predictionStyles.correctRow
                      : rowState?.isCorrect === false
                      ? predictionStyles.incorrectRow
                      : "";

                  return (
                    <tr key={rowIndex} className={rowClass}>
                      {row.inputs.map((inputVal, inputIndex) => (
                        <td key={`input-${inputIndex}`}>{String(inputVal)}</td>
                      ))}
                      <td>
                        <input
                          type="text"
                          className={predictionStyles.coverageInput}
                          value={rowState?.userAnswer ?? ""}
                          onChange={(e) =>
                            handleUserInputChange(rowIndex, e.target.value)
                          }
                          placeholder="Predict the output"
                          disabled={isRunning || isLoading}
                        />
                      </td>
                      <td
                        className={`${predictionStyles.actualOutputCell} ${
                          rowState?.isCorrect === false
                            ? predictionStyles.incorrect
                            : ""
                        }`}
                      >
                        <pre>{rowState?.actualOutput ?? " "}</pre>
                      </td>
                      <td className={predictionStyles.actionCell}>
                        <button
                          onClick={() => runRow(rowIndex)}
                          disabled={isRunning || isLoading || !!pyodideError}
                          className={predictionStyles.coverageRunButton}
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

          <div className={predictionStyles.coverageProgress}>
            <div className={styles.progressBar}>
              <div
                className={
                  isSectionComplete
                    ? styles.progressFillComplete
                    : styles.progressFill
                }
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>
              {completedCount} / {totalChallenges} predictions correct
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PredictionSection;
