import React, { useState, useRef } from "react";
import type {
  ExecutableCode,
  UnitId,
  LessonId,
  SectionId,
} from "../../types/data";
import { useTurtleExecution } from "../../hooks/useTurtleExecution";
import { useInteractiveExample } from "../../hooks/useInteractiveExample";
import InteractiveExampleDisplay from "./InteractiveExampleDisplay";
import CodeEditor from "../CodeEditor";
import styles from "./Section.module.css";

interface CodeExecutorProps {
  example: ExecutableCode;
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
}

// A sub-component specifically for the Turtle visualization
const TurtleDisplay: React.FC<CodeExecutorProps> = ({
  example,
  unitId,
  lessonId,
  sectionId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState(example.initialCode);
  const { runTurtleCode, isLoading, error } = useTurtleExecution({
    canvasRef,
    unitId,
    lessonId,
    sectionId,
  });

  return (
    <div className={styles.turtleEditorContainer}>
      <CodeEditor
        value={code}
        onChange={setCode}
        readOnly={isLoading}
        minHeight="150px"
      />
      <div className={styles.editorControls}>
        <button
          onClick={() => runTurtleCode(code)}
          disabled={isLoading}
          className={styles.runButton}
        >
          {isLoading ? "Executing..." : "Run Code"}
        </button>
      </div>
      {error && (
        <div className={styles.errorFeedback}>
          <pre>{error}</pre>
        </div>
      )}
      <div>
        <h4>Turtle Output:</h4>
        <div className={styles.turtleCanvasContainer}>
          <canvas ref={canvasRef} width={400} height={300}>
            Your browser does not support the canvas element.
          </canvas>
        </div>
      </div>
    </div>
  );
};

// A sub-component specifically for the Console visualization
const ConsoleDisplay: React.FC<CodeExecutorProps> = ({
  example,
  unitId,
  lessonId,
  sectionId,
}) => {
  // 1. The code state is now managed here ("lifting state up").
  const [code, setCode] = useState(example.initialCode);

  const { runCode, isLoading, output, error } = useInteractiveExample({
    unitId,
    lessonId,
    sectionId,
  });

  // 2. Create a new handler function that calls runCode with the current state.
  // This function has the correct signature: () => Promise<...>
  const handleRunCode = () => {
    return runCode(code);
  };

  return (
    // 3. Pass the new handler and the state management props down.
    // Note: This assumes InteractiveExampleDisplay now accepts `value` and `onChange` props.
    <InteractiveExampleDisplay
      value={code}
      onChange={setCode}
      onRunCode={handleRunCode}
      isLoading={isLoading}
      output={output}
      error={error}
      isReadOnly={false}
    />
  );
};

// The main component that decides which visualization to render
const CodeExecutor: React.FC<CodeExecutorProps> = (props) => {
  const { example } = props;

  if (example.visualization === "turtle") {
    return <TurtleDisplay {...props} />;
  }

  // Default to console visualization
  return <ConsoleDisplay {...props} />;
};

export default CodeExecutor;
