import React, { useState, useCallback, useEffect, useRef } from "react";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import styles from "./DebuggerSection.module.css";
import sectionStyles from "./Section.module.css";
import type { DebuggerSectionData } from "../../types/data";

const PYTHON_TRACE_SCRIPT_TEMPLATE = `
import io
import sys
import types
import typing
import json

class AdvancedTracer:
    def __init__(self, max_steps: int = 500) -> None:
        self.steps: list[ExecutionStep] = []
        self.max_steps = max_steps
        self.user_filename = "<student_code>"
        self.source_lines: list[str] = []
        self.previous_variables: dict[str, str] = {}
        self.stack_depth = 0

    def safe_repr(self, value: typing.Any, max_len: int = 50) -> str:
        try:
            if value is None: return "None"
            elif isinstance(value, bool): return str(value)
            elif isinstance(value, (int, float)): return str(value)
            elif isinstance(value, str):
                repr_val = repr(value)
                return repr_val[: max_len - 3] + "..." if len(repr_val) > max_len else repr_val
            elif isinstance(value, (list, tuple)):
                if not value: return "[]" if isinstance(value, list) else "()"
                items = [self.safe_repr(item, 20) for item in value]
                bracket = "[]" if isinstance(value, list) else "()"
                return f"{bracket[0]}{', '.join(items)}{bracket[1]}" if len(value) <= 3 else f"[{len(value)} items]" if isinstance(value, list) else f"({len(value)} items)"
            elif isinstance(value, dict):
                if not value: return "{}"
                items = [f"{self.safe_repr(k, 15)}: {self.safe_repr(v, 15)}" for k, v in value.items()]
                return "{" + ", ".join(items) + "}" if len(value) <= 2 else f"{{{len(value)} items}}"
            elif hasattr(value, "__class__"): return f"<{value.__class__.__name__} object>"
            else: return str(type(value))
        except: return "<unable to display>"

    def get_student_variables(self, frame_locals: dict[str, typing.Any]) -> dict[str, str]:
        student_vars: dict[str, str] = {}
        skip_vars = {"__name__", "__doc__", "__package__", "__loader__", "__spec__", "__builtins__", "__file__", "__cached__", "__annotations__"}
        for name, value in frame_locals.items():
            if name.startswith("_") or name in skip_vars or (hasattr(value, "__module__") and callable(value)):
                continue
            student_vars[name] = self.safe_repr(value)
        return student_vars
    
    def get_changed_variables(self, current_vars: dict[str, str]) -> list[str]:
        changed = []
        for key, value in current_vars.items():
            if self.previous_variables.get(key) != value:
                changed.append(key)
        return changed

    def trace_function(self, frame: types.FrameType, event: str, arg) -> typing.Optional[typing.Callable]:
        if len(self.steps) >= self.max_steps:
            return None
        
        is_user_code = frame.f_code.co_filename == self.user_filename

        if event == 'call' and is_user_code:
            self.stack_depth += 1
        elif event == 'return' and is_user_code:
            self.stack_depth -= 1

        if event != "line" or not is_user_code:
            return self.trace_function
        
        line_no = frame.f_lineno
        stripped_source_line = self.source_lines[line_no - 1].strip() if 1 <= line_no <= len(self.source_lines) else "<unknown>"
        
        if any(stripped_source_line.startswith(x) for x in ["def ", "class ", "@"]):
            return self.trace_function

        current_variables = self.get_student_variables(frame.f_locals)
        changed_variables = self.get_changed_variables(current_variables)
        
        step = ExecutionStep(
            step_number=len(self.steps) + 1,
            line_number=line_no,
            stack_depth=self.stack_depth,
            variables=current_variables,
            changed_variables=changed_variables,
            stdout=sys.stdout.getvalue() if isinstance(sys.stdout, io.StringIO) else ""
        )
        self.steps.append(step)
        
        self.previous_variables = current_variables.copy()
        
        return self.trace_function

    def generate_trace(self, user_code: str) -> dict:
        self.steps = []
        self.source_lines = user_code.split('\\n')
        self.previous_variables = {}
        self.stack_depth = 0
        
        old_stdout = sys.stdout
        captured_output = io.StringIO()
        sys.stdout = captured_output
        
        try:
            compiled_code = compile(user_code, self.user_filename, "exec")
            sys.settrace(self.trace_function)
            exec(compiled_code, {})
        except Exception as e:
            final_stdout = captured_output.getvalue()
            error_step = ExecutionStep(
                step_number=len(self.steps) + 1,
                line_number=getattr(e, "lineno", 0),
                source_line=f"ERROR: {e}",
                variables={},
                changed_variables=[],
                stdout=final_stdout,
                stack_depth=self.stack_depth
            )
            self.steps.append(error_step)
            return {"success": False, "error": str(e), "error_type": type(e).__name__, "steps": self.steps, "output": final_stdout}
        finally:
            sys.settrace(None)
            sys.stdout = old_stdout
            
        final_stdout = captured_output.getvalue()
        final_step = ExecutionStep(
            step_number=len(self.steps) + 1,
            line_number=-1,
            stack_depth=0,
            variables=self.previous_variables,
            changed_variables=[],
            stdout=final_stdout
        )
        self.steps.append(final_step)

        return {"success": True, "steps": self.steps, "output": final_stdout}

class ExecutionStep(typing.TypedDict):
    step_number: int
    line_number: int
    stack_depth: int
    variables: dict[str, str]
    changed_variables: list[str]
    stdout: str

user_code_to_execute = """{user_code}"""
tracer = AdvancedTracer()
result = tracer.generate_trace(user_code_to_execute)
print("---DEBUGGER_TRACE_START---")
print(json.dumps(result))
print("---DEBUGGER_TRACE_END---")
`;

interface ExecutionStep {
  step_number: number;
  line_number: number;
  stack_depth: number;
  variables: Record<string, string>;
  changed_variables: string[];
  stdout: string;
}

interface PythonExecutionPayload {
  success: boolean;
  steps: ExecutionStep[];
  output: string;
  error?: string;
  error_type?: string;
}

interface DebuggerSectionProps {
  section: DebuggerSectionData;
}

const DebuggerSection: React.FC<DebuggerSectionProps> = ({ section }) => {
  const [userCode, setUserCode] = useState<string>(section.code);
  const [parsedPayload, setParsedPayload] =
    useState<PythonExecutionPayload | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());

  const codeDisplayRef = useRef<HTMLDivElement>(null);
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideHookError,
  } = usePyodide();

  useEffect(() => {
    setUserCode(section.code);
    setParsedPayload(null);
    setCurrentStepIndex(-1);
    setSimulationActive(false);
    setBreakpoints(new Set());
    setPyodideError(null);
  }, [section.code, section.id]);

  const handleRunAndTrace = useCallback(async () => {
    if (isPyodideLoading || pyodideHookError) {
      setPyodideError(
        `Pyodide is not ready. ${
          pyodideHookError
            ? `Error: ${pyodideHookError.message}`
            : "(Still loading...)"
        }`
      );
      return;
    }
    setIsTracing(true);
    setParsedPayload(null);
    setCurrentStepIndex(-1);
    setPyodideError(null);
    setSimulationActive(false);

    const scriptToRun = PYTHON_TRACE_SCRIPT_TEMPLATE.replace(
      "{user_code}",
      userCode
    );
    const { output, error } = await runPythonCode(scriptToRun);

    if (error) {
      setPyodideError(`Error during Python execution: ${error}`);
    } else {
      const traceJsonMatch = output.match(
        /---DEBUGGER_TRACE_START---([\s\S]*?)---DEBUGGER_TRACE_END---/
      );
      if (traceJsonMatch?.[1]) {
        try {
          const payload = JSON.parse(
            traceJsonMatch[1].trim()
          ) as PythonExecutionPayload;
          setParsedPayload(payload);
          if (payload.success && payload.steps.length > 0) {
            setCurrentStepIndex(0);
            setSimulationActive(true);
          } else if (!payload.success) {
            setPyodideError(
              `Execution Error: ${payload.error_type} - ${payload.error}`
            );
          }
        } catch (e) {
          setPyodideError(
            `Error parsing trace from Python: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      } else {
        setPyodideError("Could not find trace markers in Pyodide output.");
      }
    }
    setIsTracing(false);
  }, [userCode, runPythonCode, isPyodideLoading, pyodideHookError]);

  const handleRestart = () => {
    if (parsedPayload) {
      setCurrentStepIndex(0);
    }
  };

  const handleStepInto = () => {
    if (!parsedPayload || currentStepIndex >= parsedPayload.steps.length - 1)
      return;
    setCurrentStepIndex((prev) => prev + 1);
  };

  const handleStepOver = useCallback(() => {
    if (
      !parsedPayload ||
      currentStepIndex < 0 ||
      currentStepIndex >= parsedPayload.steps.length - 1
    )
      return;

    const currentStep = parsedPayload.steps[currentStepIndex];
    const currentDepth = currentStep.stack_depth;

    let nextIndex = currentStepIndex + 1;
    while (nextIndex < parsedPayload.steps.length - 1) {
      if (parsedPayload.steps[nextIndex].stack_depth <= currentDepth) {
        setCurrentStepIndex(nextIndex);
        return;
      }
      nextIndex++;
    }
    setCurrentStepIndex(parsedPayload.steps.length - 1);
  }, [parsedPayload, currentStepIndex]);

  const handleContinue = () => {
    if (!parsedPayload || currentStepIndex >= parsedPayload.steps.length - 1)
      return;

    let nextBreakpointIndex = -1;
    for (let i = currentStepIndex + 1; i < parsedPayload.steps.length; i++) {
      if (breakpoints.has(parsedPayload.steps[i].line_number)) {
        nextBreakpointIndex = i;
        break;
      }
    }

    setCurrentStepIndex(
      nextBreakpointIndex !== -1
        ? nextBreakpointIndex
        : parsedPayload.steps.length - 1
    );
  };

  const toggleBreakpoint = (lineNumber: number) => {
    setBreakpoints((prev) => {
      const newBreakpoints = new Set(prev);
      if (newBreakpoints.has(lineNumber)) {
        newBreakpoints.delete(lineNumber);
      } else {
        newBreakpoints.add(lineNumber);
      }
      return newBreakpoints;
    });
  };

  const currentStep = parsedPayload?.steps?.[currentStepIndex];

  useEffect(() => {
    if (
      simulationActive &&
      currentStep &&
      codeDisplayRef.current &&
      currentStep.line_number > 0
    ) {
      const lineElement = codeDisplayRef.current.querySelector(
        `#code-line-${currentStep.line_number}`
      );
      lineElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStepIndex, simulationActive, currentStep]);

  return (
    <div
      id={section.id}
      className={`${sectionStyles.section} ${styles.debuggerSection}`}
    >
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.editorContainer}>
        <CodeEditor
          value={userCode}
          onChange={setUserCode}
          readOnly={isTracing || simulationActive}
          height="250px"
        />
      </div>
      <div className={styles.controls}>
        {!simulationActive ? (
          <button
            onClick={handleRunAndTrace}
            disabled={isTracing || isPyodideLoading}
            className={styles.runButton}
          >
            {isPyodideLoading
              ? "Python Loading..."
              : isTracing
              ? "Entering Debug Mode..."
              : "Enter Debug Mode"}
          </button>
        ) : section.advancedControls ? (
          <>
            <button
              onClick={handleContinue}
              disabled={
                !currentStep ||
                currentStepIndex >= (parsedPayload?.steps.length ?? 0) - 1
              }
              className={styles.continueButton}
              title="Continue to next breakpoint"
            >
              Continue
            </button>
            <button
              onClick={handleStepOver}
              disabled={
                !currentStep ||
                currentStepIndex >= (parsedPayload?.steps.length ?? 0) - 1
              }
              className={styles.stepOverButton}
              title="Step Over"
            >
              Step Over
            </button>
            <button
              onClick={handleStepInto}
              disabled={
                !currentStep ||
                currentStepIndex >= (parsedPayload?.steps.length ?? 0) - 1
              }
              className={styles.stepIntoButton}
              title="Step Into"
            >
              Step Into
            </button>
            <button
              onClick={handleRestart}
              className={styles.restartButton}
              title="Restart Simulation"
            >
              Restart
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentStepIndex((prev) => prev - 1)}
              disabled={currentStepIndex <= 0}
              className={styles.stepButton}
            >
              &larr; Prev Step
            </button>
            <button
              onClick={() => setCurrentStepIndex((prev) => prev + 1)}
              disabled={
                !currentStep ||
                currentStepIndex >= (parsedPayload?.steps.length ?? 0) - 1
              }
              className={styles.stepButton}
            >
              Next Step &rarr;
            </button>
          </>
        )}
      </div>

      {pyodideError && (
        <div className={styles.errorMessage}>
          <strong>Error:</strong>
          <pre>{pyodideError}</pre>
        </div>
      )}

      {simulationActive && currentStep && (
        <div className={styles.simulationArea}>
          <div>
            <div className={styles.currentStepInfo}>
              Line:{" "}
              {currentStep.line_number > 0 ? currentStep.line_number : "N/A"}
            </div>
            <div className={styles.variablesDisplay}>
              <h4>Variables</h4>
              <pre>
                {Object.entries(currentStep.variables).map(([key, val]) => (
                  <span
                    key={key}
                    className={
                      currentStep.changed_variables.includes(key)
                        ? styles.variableChanged
                        : ""
                    }
                  >
                    {`${key}: ${val}\n`}
                  </span>
                ))}
              </pre>
            </div>
            <div className={styles.programOutputDisplay}>
              <h4>Program Output</h4>
              <pre>{currentStep.stdout || ""}</pre>
            </div>
          </div>
          <div className={styles.simulationCodeDisplay} ref={codeDisplayRef}>
            <h4>Code Execution</h4>
            {userCode.split("\n").map((line, index) => (
              <div
                key={index}
                id={`code-line-${index + 1}`}
                className={`${styles.codeLine} ${
                  currentStep.line_number === index + 1
                    ? styles.highlightedLine
                    : ""
                }`}
              >
                <div
                  className={styles.lineNumberGutter}
                  onClick={() => toggleBreakpoint(index + 1)}
                  title={`Toggle breakpoint on line ${index + 1}`}
                >
                  {breakpoints.has(index + 1) && (
                    <span className={styles.breakpointIndicator}></span>
                  )}
                  {index + 1}
                </div>
                <div className={styles.codeContent}>{line || "\u00A0"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebuggerSection;
