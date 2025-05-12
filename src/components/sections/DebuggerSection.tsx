// src/components/sections/DebuggerSection.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import styles from "./DebuggerSection.module.css";
import sectionStyles from "./Section.module.css";

// PYTHON_TRACE_SCRIPT_TEMPLATE (use the one from Step 10 - no changes here for this specific tweak)
// ... (ensure the full, correct Python script template is here) ...
const PYTHON_TRACE_SCRIPT_TEMPLATE = `
import sys
import json
import inspect
import io 

trace_data = []
MAX_TRACE_EVENTS = 1000
USER_CODE_FILENAME = '/user_temp_script.py' 

user_code_to_execute = """
# Placeholder for user's actual code
"""
# ... (rest of the Python script template from Step 10 response)
try:
    with open(USER_CODE_FILENAME, 'w') as f:
        f.write(user_code_to_execute)
    source_code_to_compile = open(USER_CODE_FILENAME, 'r').read()
    compiled_user_code = compile(source_code_to_compile, USER_CODE_FILENAME, 'exec')
except Exception as e_setup:
    initial_setup_error = {"type": e_setup.__class__.__name__, "message": str(e_setup)}
    compiled_user_code = None
else:
    initial_setup_error = None

def get_stack_depth(frame):
    depth = 0
    current_frame = frame
    while current_frame.f_back: 
        if current_frame.f_back.f_code.co_filename == USER_CODE_FILENAME:
            depth += 1
        current_frame = current_frame.f_back
    return depth

def python_tracer(frame, event, arg):
    global trace_data
    if len(trace_data) >= MAX_TRACE_EVENTS:
        sys.settrace(None)
        return None

    current_frame_filename = frame.f_code.co_filename
    next_tracer_for_this_scope = python_tracer

    if current_frame_filename != USER_CODE_FILENAME:
        next_tracer_for_this_scope = None 
        return next_tracer_for_this_scope 

    line_no = frame.f_lineno
    func_name = frame.f_code.co_name
    stack_depth = get_stack_depth(frame) 

    local_vars_snapshot = {}
    try:
        current_locals = frame.f_locals
        for key, value in current_locals.items():
            if key in ['__name__', '__doc__', '__package__', '__loader__', 
                       '__spec__', '__builtins__', '__file__', 
                       'python_tracer', 'trace_data', 'user_code_to_execute', 'USER_CODE_FILENAME',
                       'compiled_user_code', 'source_code_to_compile', 'initial_setup_error',
                       'get_stack_depth', 
                       'MAX_TRACE_EVENTS', 'json', 'sys', 'inspect', 'io', 
                       'user_stdout_capture', 'original_stdout', 
                       'execution_exception',
                       'output_payload', 'serialized_output_payload', 'e_setup', 'e', 'f', 'arg', 'frame', 'event',
                       'local_vars_snapshot', 'line_no', 'func_name', 'stack_depth', 
                       'current_frame_filename', 'next_tracer_for_this_scope',
                       'key', 'value', 'event_details'
                       ]: 
                continue
            if hasattr(value, '__name__') and inspect.ismodule(value):
                 local_vars_snapshot[key] = f"<module '{value.__name__}'>"
                 continue
            if value is python_tracer or value is get_stack_depth: 
                 local_vars_snapshot[key] = "<tracer_utility_function>"
                 continue
            try:
                if isinstance(value, (int, float, str, bool, list, dict, type(None))):
                    try:
                        json.dumps(value) 
                        local_vars_snapshot[key] = value
                    except (TypeError, OverflowError):
                         local_vars_snapshot[key] = repr(value)
                else:
                    local_vars_snapshot[key] = repr(value)
            except Exception:
                local_vars_snapshot[key] = "<unrepresentable_object>"
    except Exception as e_locals:
        local_vars_snapshot = {"_tracer_error": f"Error iterating/processing locals: {repr(e_locals)}"}

    event_details = {
        "step": len(trace_data) + 1,
        "file_name": current_frame_filename,
        "line_no": line_no,
        "event": event,
        "func_name": func_name,
        "stack_depth": stack_depth, 
        "locals": local_vars_snapshot,
    }
    
    if event == 'line':
        trace_data.append(event_details)
    elif event == 'call':
        trace_data.append({**event_details, "type_specific": "function_call_started"})
    elif event == 'return':
        return_value_repr = ""
        try:
            if isinstance(arg, (int, float, str, bool, list, dict, type(None))):
                 json.dumps(arg)
                 return_value_repr = arg
            else:
                return_value_repr = repr(arg)
        except (TypeError, OverflowError):
            return_value_repr = repr(arg)
        trace_data.append({**event_details, "type_specific": "function_returned", "return_value": return_value_repr})
    elif event == 'exception':
        exc_type, exc_value, exc_traceback_obj = arg
        trace_data.append({
            **event_details,
            "type_specific": "exception_raised",
            "exception_type": exc_type.__name__ if hasattr(exc_type, '__name__') else repr(exc_type),
            "exception_value": str(exc_value) 
        })
    
    return next_tracer_for_this_scope

execution_error_details = None
user_stdout_capture = io.StringIO() 
original_stdout = sys.stdout

if initial_setup_error:
    execution_error_details = initial_setup_error
    trace_data.append({
        "step": 1, "file_name": USER_CODE_FILENAME, "line_no": 0, 
        "event": "setup_error", "func_name": "<setup>", "locals": {}, "stack_depth": 0,
        "type_specific": "script_setup_error",
        "exception_type": initial_setup_error["type"],
        "exception_value": initial_setup_error["message"]
    })
elif compiled_user_code:
    sys.stdout = user_stdout_capture 
    sys.settrace(python_tracer)
    try:
        exec(compiled_user_code, globals()) 
    except Exception as e_exec:
        execution_error_details = {"type": e_exec.__class__.__name__, "message": str(e_exec), "line_no": getattr(e_exec, 'lineno', None)}
        if not any(ev.get('event') == 'exception' or ev.get('event') == 'script_exception' for ev in trace_data):
             trace_data.append({
                "step": len(trace_data) + 1, "file_name": USER_CODE_FILENAME,
                "line_no": getattr(e_exec, 'lineno', 'N/A'), "event": "exec_error", 
                "func_name": "<module>", "locals": {}, "stack_depth": 0, 
                "type_specific": "script_execution_error",
                "exception_type": e_exec.__class__.__name__, "exception_value": str(e_exec)
            })
    finally:
        sys.settrace(None)
        sys.stdout = original_stdout 
output_payload = { 
    "trace": trace_data,
    "user_stdout": user_stdout_capture.getvalue() 
}
if execution_error_details:
     output_payload["execution_error"] = execution_error_details

try:
    serialized_output_payload = json.dumps(output_payload, indent=2)
    print("---DEBUGGER_TRACE_START---")
    print(serialized_output_payload)
    print("---DEBUGGER_TRACE_END---")
except Exception as e:
    safe_trace = []
    for item in trace_data:
        try:
            json.dumps(item)
            safe_trace.append(item)
        except:
            safe_trace.append({"error": "Unserializable item", "original_step": item.get("step"), "line_no": item.get("line_no")}) 
    error_output_content = {
        "error": "Failed to serialize full trace_data for output", 
        "details": str(e),
        "partial_trace_head": safe_trace[:5] 
    }
    if execution_error_details: 
        error_output_content["execution_error"] = execution_error_details
    error_output_content["user_stdout_capture_on_error"] = user_stdout_capture.getvalue()
    error_output = json.dumps(error_output_content)
    print("---DEBUGGER_TRACE_START---")
    print(error_output)
    print("---DEBUGGER_TRACE_END---")
`;

const USER_CODE_VIRTUAL_FILENAME = "/user_temp_script.py";
const PYTHON_MAX_TRACE_EVENTS = 1000;

interface TraceEvent {
  /* ... (same as before) ... */ step: number;
  file_name: string;
  line_no: number;
  event: string;
  func_name: string;
  stack_depth: number;
  locals: Record<string, any>;
  type_specific?: string;
  return_value?: any;
  exception_type?: string;
  exception_value?: string;
}
interface PythonExecutionPayload {
  /* ... (same as before) ... */ trace: TraceEvent[];
  user_stdout?: string;
  execution_error?: {
    type: string;
    message: string;
    line_no?: number | string;
  };
}
const findInitialStartStepIndex = (
  traceEvents: TraceEvent[],
  sourceCode: string
): number => {
  /* ... (same as Step 10) ... */
  if (!traceEvents || traceEvents.length === 0) {
    return 0;
  }
  const sourceLines = sourceCode.split("\n");
  let firstPlausibleExecutableLineIndex = -1;
  let ifNameMainIndex = -1;
  for (let i = 0; i < traceEvents.length; i++) {
    const event = traceEvents[i];
    if (
      event.event === "line" &&
      event.stack_depth === 0 &&
      event.func_name === "<module>" &&
      event.file_name === USER_CODE_VIRTUAL_FILENAME
    ) {
      const lineIndexInSource = event.line_no - 1;
      if (lineIndexInSource >= 0 && lineIndexInSource < sourceLines.length) {
        const lineText = sourceLines[lineIndexInSource].trim();
        if (
          lineText.includes('if __name__ == "__main__":') ||
          lineText.includes("if __name__ == '__main__':")
        ) {
          ifNameMainIndex = i;
          break;
        }
        if (firstPlausibleExecutableLineIndex === -1) {
          if (
            lineText !== "" &&
            !lineText.startsWith("#") &&
            !lineText.startsWith("def ") &&
            !lineText.startsWith("class ") &&
            !lineText.startsWith("import ") &&
            !lineText.startsWith("from ")
          ) {
            firstPlausibleExecutableLineIndex = i;
          }
        }
      }
    }
  }
  if (ifNameMainIndex !== -1) return ifNameMainIndex;
  if (firstPlausibleExecutableLineIndex !== -1)
    return firstPlausibleExecutableLineIndex;
  return 0;
};

const DebuggerSection: React.FC = () => {
  // ... (all state variables from Step 10 remain the same) ...
  const [userCode, setUserCode] = useState<string>(
    "# Optional: Add imports here if needed for your code\n" +
      'print("Script setup phase (imports, global constants)")\n\n' +
      "GLOBAL_VAR = 100\n\n" +
      "def helper_function():\n" +
      '    print("Inside helper_function")\n' +
      "    return GLOBAL_VAR * 2\n\n" +
      "class MyClass:\n" +
      '    dunder_class_var = "test_class_dunder"\n' +
      "    def __init__(self, value):\n" +
      "        self.value = value\n" +
      "        self.__private_val = value * 10 # Example of a name-mangled dunder\n" +
      '        print(f"MyClass instance created with {value}")\n\n' +
      "    def get_value(self):\n" +
      '        print(f"Accessing private val: {self.__private_val}")\n' +
      "        return self.value\n\n" +
      'print("Main execution starting...")\n' +
      "x = 10\n" +
      "y = helper_function()\n" +
      "obj = MyClass(x + y)\n" +
      'print(f"Object value: {obj.get_value()}")\n\n' +
      'if __name__ == "__main__":\n' +
      '    print("Executing main block")\n' +
      "    final_result = obj.get_value() * 2\n" +
      '    print(f"Result from main block: {final_result}")\n'
  );
  const [rawTraceOutput, setRawTraceOutput] = useState<string | null>(null);
  const [parsedTraceEvents, setParsedTraceEvents] = useState<
    TraceEvent[] | null
  >(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [capturedUserStdout, setCapturedUserStdout] = useState<string>("");
  const [displayedStdout, setDisplayedStdout] = useState<string>("");
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const codeDisplayRef = useRef<HTMLDivElement>(null);
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideHookError,
  } = usePyodide();

  // ... (handleRunAndTrace, stepping functions, toggleBreakpoint, useEffects - all same as Step 10) ...
  const handleRunAndTrace = useCallback(async () => {
    /* ... (same as Step 10) ... */
    if (isPyodideLoading || pyodideHookError) {
      setPyodideError(
        `Pyodide is not ready. ${
          pyodideHookError
            ? `Error: ${pyodideHookError.message}`
            : "(Still loading...)"
        }`
      );
      setRawTraceOutput(null);
      setParsedTraceEvents(null);
      setCurrentStepIndex(-1);
      setSimulationActive(false);
      setCapturedUserStdout("");
      setDisplayedStdout("");
      setWarningMessage(null);
      return;
    }
    setIsTracing(true);
    setRawTraceOutput(null);
    setParsedTraceEvents(null);
    setCurrentStepIndex(-1);
    setPyodideError(null);
    setSimulationActive(false);
    setCapturedUserStdout("");
    setDisplayedStdout("");
    setWarningMessage(null);
    setBreakpoints(new Set());
    const scriptToRun = PYTHON_TRACE_SCRIPT_TEMPLATE.replace(
      "# Placeholder for user's actual code",
      userCode
    );
    const { output, error } = await runPythonCode(scriptToRun);
    if (error) {
      setPyodideError(
        `Error during Python execution (Pyodide level): ${error}`
      );
      setRawTraceOutput(output || null);
    } else {
      const traceJsonMatch = output.match(
        /---DEBUGGER_TRACE_START---([\s\S]*?)---DEBUGGER_TRACE_END---/
      );
      if (traceJsonMatch && traceJsonMatch[1]) {
        const rawTraceString = traceJsonMatch[1].trim();
        setRawTraceOutput(rawTraceString);
        try {
          const parsedPayload = JSON.parse(
            rawTraceString
          ) as PythonExecutionPayload;
          if (parsedPayload && Array.isArray(parsedPayload.trace)) {
            const traceEvents = parsedPayload.trace as TraceEvent[];
            setParsedTraceEvents(traceEvents);
            setCapturedUserStdout(parsedPayload.user_stdout || "");
            if (traceEvents.length > 0) {
              const initialIndex = findInitialStartStepIndex(
                traceEvents,
                userCode
              );
              setCurrentStepIndex(initialIndex);
              setSimulationActive(true);
            } else {
              setCurrentStepIndex(-1);
              setSimulationActive(false);
            }
            if (parsedPayload.execution_error) {
              setPyodideError(
                `Python Execution Error: ${parsedPayload.execution_error.type} - ${parsedPayload.execution_error.message} ` +
                  `(line ${
                    parsedPayload.execution_error.line_no || "N/A"
                  } in your code)`
              );
            }
            if (parsedPayload.trace.length >= PYTHON_MAX_TRACE_EVENTS) {
              setWarningMessage(
                `Warning: Maximum trace events (${PYTHON_MAX_TRACE_EVENTS}) reached. Trace may be incomplete.`
              );
            }
          } else {
            setPyodideError(
              "Trace data is missing the 'trace' array property or is malformed."
            );
            setParsedTraceEvents(null);
          }
        } catch (e) {
          setPyodideError(
            `Error parsing trace JSON: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
          setParsedTraceEvents(null);
          console.error("Raw output causing parse error:", rawTraceString);
        }
      } else {
        setPyodideError("Could not find trace markers in Pyodide output.");
        setRawTraceOutput("Trace markers not found. Raw output:\n" + output);
      }
    }
    setIsTracing(false);
  }, [userCode, runPythonCode, isPyodideLoading, pyodideHookError]);
  const canStep =
    parsedTraceEvents && currentStepIndex < parsedTraceEvents.length - 1;
  const isAtLastStep =
    parsedTraceEvents && currentStepIndex === parsedTraceEvents.length - 1;
  const handleStepInto = () => {
    if (canStep) setCurrentStepIndex((prevIndex) => prevIndex + 1);
  };
  const handleStepOver = useCallback(() => {
    /* ... (same as Step 10) ... */
    if (
      !parsedTraceEvents ||
      currentStepIndex < 0 ||
      currentStepIndex >= parsedTraceEvents.length
    )
      return;
    const currentEvent = parsedTraceEvents[currentStepIndex];
    const initialDepth = currentEvent.stack_depth;
    let isFunctionCallLine = false;
    if (currentStepIndex + 1 < parsedTraceEvents.length) {
      const nextEvent = parsedTraceEvents[currentStepIndex + 1];
      if (
        nextEvent.event === "call" &&
        nextEvent.stack_depth > initialDepth &&
        nextEvent.file_name === USER_CODE_VIRTUAL_FILENAME
      ) {
        isFunctionCallLine = true;
      }
    }
    if (isFunctionCallLine) {
      let nextIndex = currentStepIndex + 1;
      while (nextIndex < parsedTraceEvents.length) {
        const event = parsedTraceEvents[nextIndex];
        if (
          event.stack_depth <= initialDepth &&
          event.file_name === USER_CODE_VIRTUAL_FILENAME
        ) {
          if (event.event === "line") {
            setCurrentStepIndex(nextIndex);
            return;
          }
          if (event.event === "return" && event.stack_depth < initialDepth) {
            let afterReturnIdx = nextIndex + 1;
            while (
              afterReturnIdx < parsedTraceEvents.length &&
              (parsedTraceEvents[afterReturnIdx].event !== "line" ||
                parsedTraceEvents[afterReturnIdx].file_name !==
                  USER_CODE_VIRTUAL_FILENAME)
            ) {
              afterReturnIdx++;
            }
            setCurrentStepIndex(
              afterReturnIdx < parsedTraceEvents.length
                ? afterReturnIdx
                : parsedTraceEvents.length - 1
            );
            return;
          }
        }
        nextIndex++;
      }
      setCurrentStepIndex(parsedTraceEvents.length - 1);
    } else {
      if (canStep) setCurrentStepIndex((prevIndex) => prevIndex + 1);
    }
  }, [parsedTraceEvents, currentStepIndex, canStep]);
  const handleStepOut = useCallback(() => {
    /* ... (same as Step 10) ... */
    if (
      !parsedTraceEvents ||
      currentStepIndex < 0 ||
      currentStepIndex >= parsedTraceEvents.length
    )
      return;
    const currentEvent = parsedTraceEvents[currentStepIndex];
    const initialDepth = currentEvent.stack_depth;
    const initialFuncName = currentEvent.func_name;
    if (initialDepth === 0) {
      if (canStep) {
        setCurrentStepIndex(parsedTraceEvents.length - 1);
        setDisplayedStdout(capturedUserStdout);
      }
      return;
    }
    let nextIndex = currentStepIndex + 1;
    let foundCorrectReturn = false;
    while (nextIndex < parsedTraceEvents.length) {
      const event = parsedTraceEvents[nextIndex];
      if (
        event.event === "return" &&
        event.func_name === initialFuncName &&
        event.stack_depth === initialDepth - 1 &&
        event.file_name === USER_CODE_VIRTUAL_FILENAME
      ) {
        foundCorrectReturn = true;
      }
      if (
        foundCorrectReturn &&
        event.event === "line" &&
        event.stack_depth === initialDepth - 1 &&
        event.file_name === USER_CODE_VIRTUAL_FILENAME
      ) {
        setCurrentStepIndex(nextIndex);
        return;
      }
      nextIndex++;
    }
    setCurrentStepIndex(parsedTraceEvents.length - 1);
    setDisplayedStdout(capturedUserStdout);
  }, [parsedTraceEvents, currentStepIndex, canStep, capturedUserStdout]);
  const handleContinue = () => {
    /* ... (same as Step 10) ... */
    if (!parsedTraceEvents || currentStepIndex >= parsedTraceEvents.length - 1)
      return;
    let nextStopIndex = -1;
    for (let i = currentStepIndex + 1; i < parsedTraceEvents.length; i++) {
      const event = parsedTraceEvents[i];
      if (
        event.event === "line" &&
        breakpoints.has(event.line_no) &&
        event.file_name === USER_CODE_VIRTUAL_FILENAME
      ) {
        nextStopIndex = i;
        break;
      }
    }
    const finalIndex =
      nextStopIndex !== -1 ? nextStopIndex : parsedTraceEvents.length - 1;
    setCurrentStepIndex(finalIndex);
    setDisplayedStdout(capturedUserStdout);
  };
  const handleStop = () => {
    /* ... (same as Step 10) ... */
    setSimulationActive(false);
    setCurrentStepIndex(-1);
    setPyodideError(null);
    setWarningMessage(null);
    setDisplayedStdout("");
  };
  const toggleBreakpoint = (lineNumber: number) => {
    /* ... (same as Step 10) ... */
    setBreakpoints((prevBreakpoints) => {
      const newBreakpoints = new Set(prevBreakpoints);
      if (newBreakpoints.has(lineNumber)) {
        newBreakpoints.delete(lineNumber);
      } else {
        newBreakpoints.add(lineNumber);
      }
      return newBreakpoints;
    });
  };
  const currentTraceEvent =
    parsedTraceEvents &&
    currentStepIndex >= 0 &&
    currentStepIndex < parsedTraceEvents.length
      ? parsedTraceEvents[currentStepIndex]
      : null;
  useEffect(() => {
    /* ... (auto-scroll, same as Step 10) ... */
    if (simulationActive && currentTraceEvent && codeDisplayRef.current) {
      const lineElementId = `code-line-${currentTraceEvent.line_no}`;
      const lineElement = codeDisplayRef.current.querySelector(
        `#${lineElementId}`
      );
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentStepIndex, simulationActive, currentTraceEvent]);
  useEffect(() => {
    /* ... (clear displayedStdout, same as Step 10) ... */
    if (!simulationActive) setDisplayedStdout("");
  }, [simulationActive]);
  const renderSimulatedCodeWithGutter = () => {
    /* ... (same as Step 10) ... */
    const codeToDisplay = userCode || "";
    const lines = codeToDisplay.split("\n");
    return (
      <div className={styles.simulationCodeDisplay} ref={codeDisplayRef}>
        <h4>
          Your Code{" "}
          {simulationActive
            ? "(Simulating)"
            : "(Editable - Set Breakpoints Below)"}
          :
        </h4>
        {lines.map((lineText, index) => {
          const lineNumber = index + 1;
          const isCurrentExecLine =
            simulationActive &&
            currentTraceEvent &&
            currentTraceEvent.line_no === lineNumber &&
            currentTraceEvent.file_name === USER_CODE_VIRTUAL_FILENAME;
          const hasBreakpoint = breakpoints.has(lineNumber);
          return (
            <div
              key={lineNumber}
              id={`code-line-${lineNumber}`}
              className={styles.codeLine}
            >
              <div
                className={styles.lineNumberGutter}
                onClick={() => toggleBreakpoint(lineNumber)}
                title={`Toggle breakpoint on line ${lineNumber}`}
              >
                <span
                  className={`${styles.breakpointIndicator} ${
                    hasBreakpoint ? styles.active : ""
                  }`}
                ></span>
                {lineNumber}
              </div>
              <div
                className={`${styles.codeContent} ${
                  isCurrentExecLine ? styles.highlightedLine : ""
                }`}
              >
                {lineText || "\u00A0"}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`${styles.debuggerSection} ${sectionStyles.section}`}>
      <h2 className={styles.title}>Python Debugger</h2>
      <div className={styles.editorContainer}>
        <CodeEditor
          value={userCode}
          onChange={setUserCode}
          readOnly={isTracing || isPyodideLoading}
          height="250px"
          minHeight="200px"
        />
      </div>
      <div className={styles.controls}>
        <button
          onClick={handleRunAndTrace}
          disabled={isTracing || isPyodideLoading}
          className={styles.runButton}
        >
          {isPyodideLoading
            ? "Pyodide Loading..."
            : isTracing
            ? "Tracing..."
            : "Run & Generate New Trace"}
        </button>
        {pyodideHookError && !isPyodideLoading && (
          <span className={styles.errorMessage}>
            <strong>Pyodide Init Error!</strong>
          </span>
        )}
      </div>
      {(pyodideError || warningMessage) && (
        <div
          className={pyodideError ? styles.errorMessage : styles.warningMessage}
        >
          {pyodideError && (
            <>
              <strong>Execution Issue:</strong>
              <pre>{pyodideError}</pre>
            </>
          )}
          {warningMessage && !pyodideError && <pre>{warningMessage}</pre>}
        </div>
      )}

      {parsedTraceEvents && parsedTraceEvents.length > 0 && (
        <>
          <div className={styles.simulationControls}>
            <button
              onClick={handleContinue}
              disabled={!simulationActive || !canStep || isAtLastStep}
              className={styles.stepButton}
            >
              {" "}
              Continue (F5){" "}
            </button>
            <button
              onClick={handleStop}
              disabled={!simulationActive}
              className={styles.stopButton}
            >
              {" "}
              Stop (Shift+F5){" "}
            </button>
            <button
              onClick={handleStepInto}
              disabled={!simulationActive || !canStep || isAtLastStep}
              className={styles.stepButton}
            >
              {" "}
              Step Into (F11){" "}
            </button>
            <button
              onClick={handleStepOver}
              disabled={!simulationActive || !canStep || isAtLastStep}
              className={styles.stepButton}
            >
              {" "}
              Step Over (F10){" "}
            </button>
            <button
              onClick={handleStepOut}
              disabled={
                !simulationActive ||
                !canStep ||
                isAtLastStep ||
                (currentTraceEvent && currentTraceEvent.stack_depth === 0)
              }
              className={styles.stepButton}
            >
              {" "}
              Step Out (Shift+F11){" "}
            </button>
          </div>

          <div className={styles.simulationArea}>
            <div>
              {" "}
              {/* Left Column */}
              {currentTraceEvent && simulationActive && (
                <div className={styles.currentStepInfo}>
                  Step: {currentTraceEvent.step}/
                  {parsedTraceEvents?.length || 0} | Line:{" "}
                  {currentTraceEvent.line_no} | Event: {currentTraceEvent.event}{" "}
                  | Func: {currentTraceEvent.func_name} | Depth:{" "}
                  {currentTraceEvent.stack_depth}
                </div>
              )}
              <div className={styles.variablesDisplay}>
                <h4>Variables:</h4>
                {currentTraceEvent &&
                simulationActive &&
                currentTraceEvent.locals &&
                Object.keys(currentTraceEvent.locals).length > 0 ? (
                  <pre>
                    {Object.entries(currentTraceEvent.locals)
                      .filter(
                        ([key]) => !(key.startsWith("_") || key.endsWith("_"))
                      )
                      .map(([key, value]) => {
                        let displayValue =
                          typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value);
                        if (displayValue.length > 100) {
                          displayValue = displayValue.substring(0, 100) + "...";
                        }
                        return `${key}: ${displayValue}`;
                      })
                      .join("\n")}
                  </pre>
                ) : (
                  <p className={styles.noVariables}>
                    {simulationActive && currentTraceEvent
                      ? "No user variables in scope."
                      : "N/A"}
                  </p>
                )}
              </div>
              {displayedStdout && simulationActive && (
                <div className={styles.programOutputDisplay}>
                  <h4>Program Output:</h4>
                  <pre>{displayedStdout}</pre>
                </div>
              )}
            </div>
            <div>
              {" "}
              {/* Right Column */}
              {renderSimulatedCodeWithGutter()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DebuggerSection;
