// src/components/sections/DebuggerSection.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import styles from "./DebuggerSection.module.css";
import sectionStyles from "./Section.module.css";

// PYTHON_TRACE_SCRIPT_TEMPLATE (use the one from Step 9 - with stdout capture and virtual file)
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
# ... (rest of the Python script template from Step 9/10 response)
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
  step: number;
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

const DebuggerSection: React.FC = () => {
  const [userCode, setUserCode] = useState<string>(
    "def greet(name):\n" +
      '    message = "Hello, " + name\n' +
      '    print("Greeting: " + message)\n' +
      "    return len(message)\n" +
      "\n" +
      "def main():\n" +
      '    print("Starting main function...")\n' +
      '    val1 = greet("World")\n' +
      '    long_string = "abc" * 3 # Shorter for clarity\n' +
      '    print("Long string created: " + long_string)\n' +
      "    val2 = 0\n" +
      "    for i in range(1, 3):\n" +
      '        print(f"Loop iteration {i}, val1={val1}")\n' +
      "        val2 += greet(str(i * 10)) + val1\n" +
      '    print("Main function ending.")\n' +
      "    return val2\n" +
      "\n" +
      "result = main()\n" +
      'print(f"Final script result: {result}")'
  );
  // rawTraceOutput can be kept for debugging the debugger if you like, or removed from UI later
  const [rawTraceOutput, setRawTraceOutput] = useState<string | null>(null);
  const [parsedTraceEvents, setParsedTraceEvents] = useState<
    TraceEvent[] | null
  >(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isTracing, setIsTracing] = useState<boolean>(false); // True ONLY when Python is running to generate trace
  const [pyodideError, setPyodideError] = useState<string | null>(null); // For errors from Python/Pyodide
  const [simulationActive, setSimulationActive] = useState<boolean>(false); // True if a trace is loaded and UI is in simulation mode
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

  const handleRunAndTrace = useCallback(async () => {
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

    // Reset all simulation/output states for a new trace run
    setIsTracing(true);
    // setRawTraceOutput("Generating trace..."); // User doesn't need to see this string
    setParsedTraceEvents(null);
    setCurrentStepIndex(-1);
    setPyodideError(null);
    setSimulationActive(false);
    setCapturedUserStdout("");
    setDisplayedStdout("");
    setWarningMessage(null);
    setBreakpoints(new Set()); // Clear breakpoints on new trace generation

    const scriptToRun = PYTHON_TRACE_SCRIPT_TEMPLATE.replace(
      "# Placeholder for user's actual code",
      userCode
    );

    const { output, error } = await runPythonCode(scriptToRun);
    if (error) {
      setPyodideError(
        `Error during Python execution (Pyodide level): ${error}`
      );
      setRawTraceOutput(output || null); // Store raw output for inspection on error
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
            setParsedTraceEvents(parsedPayload.trace);
            setCapturedUserStdout(parsedPayload.user_stdout || "");
            // Only activate simulation and set first step if there are trace events
            if (parsedPayload.trace.length > 0) {
              setCurrentStepIndex(0);
              setSimulationActive(true);
            } else {
              setCurrentStepIndex(-1);
              setSimulationActive(false); // No events, no simulation
            }

            if (parsedPayload.execution_error) {
              setPyodideError(
                `Python Execution Error: ${parsedPayload.execution_error.type} - ${parsedPayload.execution_error.message} ` +
                  `(line ${
                    parsedPayload.execution_error.line_no || "N/A"
                  } in your code)`
              );
              // If there was an execution error, the simulation might not be meaningful
              // Or it might show trace up to the error. Current logic allows simulation.
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

  // ... (Stepping functions: handleStepInto, handleStepOver, handleStepOut, handleContinue - remain the same)
  const canStep =
    parsedTraceEvents && currentStepIndex < parsedTraceEvents.length - 1;
  const isAtLastStep =
    parsedTraceEvents && currentStepIndex === parsedTraceEvents.length - 1;
  const handleStepInto = () => {
    if (canStep) setCurrentStepIndex((prevIndex) => prevIndex + 1);
  };
  const handleStepOver = useCallback(() => {
    /* ... (same as Step 9) ... */
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
    /* ... (same as Step 9) ... */
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
    } // Go to end if stepping out of module
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
    setDisplayedStdout(capturedUserStdout); // Show all output if stepping out leads to end
  }, [parsedTraceEvents, currentStepIndex, canStep, capturedUserStdout]);
  const handleContinue = () => {
    /* ... (same as Step 9) ... */
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
    // This effectively resets the simulation UI
    setSimulationActive(false);
    setCurrentStepIndex(-1);
    // Keep parsedTraceEvents and capturedUserStdout if you want the user to be able to see the last state
    // or clear them:
    // setParsedTraceEvents(null);
    // setCapturedUserStdout("");
    setDisplayedStdout("");
    setPyodideError(null);
    setWarningMessage(null);
    // Breakpoints are not cleared by "Stop", only by a new "Run & Trace"
  };

  const toggleBreakpoint = (lineNumber: number) => {
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
    if (!simulationActive) {
      setDisplayedStdout("");
    }
  }, [simulationActive]);

  const renderSimulatedCodeWithGutter = () => {
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
                onClick={() => toggleBreakpoint(lineNumber)} // Allow toggling breakpoints always
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
          // Editor is readOnly only during the actual trace generation (isTracing)
          readOnly={isTracing || isPyodideLoading}
          height="250px"
          minHeight="200px"
        />
      </div>

      <div className={styles.controls}>
        <button
          onClick={handleRunAndTrace}
          // "Run & Trace" is disabled only during trace generation or Pyodide loading
          disabled={isTracing || isPyodideLoading}
          className={styles.runButton}
        >
          {isPyodideLoading
            ? "Pyodide Loading..."
            : isTracing
            ? "Tracing..."
            : "Run & Generate Trace"}
        </button>
        {pyodideHookError && !isPyodideLoading && (
          <span className={styles.errorMessage}>
            <strong>Pyodide Init Error!</strong>
          </span>
        )}
      </div>

      {(pyodideError || warningMessage) && ( // Display errors or warnings
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

      {/* Simulation UI: Visible if simulationActive is true OR if there are parsed events (even if stopped) */}
      {(simulationActive || parsedTraceEvents) && (
        <>
          <div className={styles.simulationControls}>
            <button
              onClick={handleContinue}
              disabled={!simulationActive || !canStep || isAtLastStep}
              className={styles.stepButton}
            >
              Continue (F5)
            </button>
            <button
              onClick={handleStop}
              disabled={!simulationActive}
              className={styles.stopButton}
            >
              {" "}
              {/* Enable stop if simulation is active */}
              Stop (Shift+F5)
            </button>
            <button
              onClick={handleStepInto}
              disabled={!simulationActive || !canStep || isAtLastStep}
              className={styles.stepButton}
            >
              Step Into (F11)
            </button>
            <button
              onClick={handleStepOver}
              disabled={!simulationActive || !canStep || isAtLastStep}
              className={styles.stepButton}
            >
              Step Over (F10)
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
              Step Out (Shift+F11)
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
                      ? "No locals."
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
              {renderSimulatedCodeWithGutter()}{" "}
              {/* Always render code with gutter for breakpoints */}
              {/* Optionally display raw trace for debugging the debugger, can be hidden for production */}
              {/* {rawTraceOutput && (
                <div className={styles.traceOutputContainer} style={{marginTop: '1rem'}}>
                  <h4>Raw Trace (JSON):</h4>
                  <pre className={styles.traceOutput}>{rawTraceOutput}</pre>
                </div>
              )} */}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DebuggerSection;
