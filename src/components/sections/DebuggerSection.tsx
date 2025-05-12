// src/components/sections/DebuggerSection.tsx
import React, { useState, useCallback, useEffect } from "react";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import styles from "./DebuggerSection.module.css";
import sectionStyles from "./Section.module.css";

// PYTHON_TRACE_SCRIPT_TEMPLATE (use the one from Step 6 that includes USER_CODE_FILENAME = '/user_temp_script.py')
// ... (ensure the full, correct Python script template is here) ...
const PYTHON_TRACE_SCRIPT_TEMPLATE = `
import sys
import json
import inspect

trace_data = []
MAX_TRACE_EVENTS = 1000
USER_CODE_FILENAME = '/user_temp_script.py'

user_code_to_execute = """
# Placeholder for user's actual code
"""
# ... (rest of the Python script template from Step 6 response)
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
                       'MAX_TRACE_EVENTS', 'json', 'sys', 'inspect', 'execution_exception',
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

final_result_of_main = None
execution_error_details = None

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

output_payload = { "trace": trace_data }
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
    error_output = json.dumps(error_output_content)
    print("---DEBUGGER_TRACE_START---")
    print(error_output)
    print("---DEBUGGER_TRACE_END---")
`;

interface TraceEvent {
  step: number;
  file_name: string;
  line_no: number;
  event: string;
  func_name: string;
  stack_depth: number; // Added stack_depth
  locals: Record<string, any>;
  type_specific?: string;
  return_value?: any;
  exception_type?: string;
  exception_value?: string;
}

// *** ADD THIS CONSTANT ***
const USER_CODE_VIRTUAL_FILENAME = "/user_temp_script.py";

const DebuggerSection: React.FC = () => {
  const [userCode, setUserCode] = useState<string>(
    "def greet(name):\n" +
      '    message = "Hello, " + name\n' +
      "    print(message) # This print output won't be captured per step yet\n" +
      "    return len(message)\n" +
      "\n" +
      "def main():\n" +
      '    val1 = greet("Debugger")\n' +
      "    val2 = 0\n" +
      "    for i in range(2):\n" +
      "        val2 += greet(str(i)) + val1\n" +
      "    return val2\n" +
      "\n" +
      "result = main()\n" +
      'print(f"Final result: {result}") # This print output won\'t be captured per step yet'
  );
  const [rawTraceOutput, setRawTraceOutput] = useState<string | null>(null);
  const [parsedTraceEvents, setParsedTraceEvents] = useState<
    TraceEvent[] | null
  >(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);

  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideHookError,
  } = usePyodide();

  const handleRunAndTrace = useCallback(async () => {
    // ... (this function remains the same as in Step 6 response)
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
      return;
    }
    setIsTracing(true);
    setRawTraceOutput("Generating trace...");
    setParsedTraceEvents(null);
    setCurrentStepIndex(-1);
    setPyodideError(null);
    setSimulationActive(false);

    const scriptToRun = PYTHON_TRACE_SCRIPT_TEMPLATE.replace(
      "# Placeholder for user's actual code",
      userCode
    );

    const { output, error } = await runPythonCode(scriptToRun);
    if (error) {
      setPyodideError(`Error during Python execution: ${error}`);
      setRawTraceOutput(null);
    } else {
      const traceJsonMatch = output.match(
        /---DEBUGGER_TRACE_START---([\s\S]*?)---DEBUGGER_TRACE_END---/
      );
      if (traceJsonMatch && traceJsonMatch[1]) {
        const rawTraceString = traceJsonMatch[1].trim();
        setRawTraceOutput(rawTraceString);
        try {
          const parsedData = JSON.parse(rawTraceString);
          if (parsedData && Array.isArray(parsedData.trace)) {
            setParsedTraceEvents(parsedData.trace as TraceEvent[]);
            setCurrentStepIndex(0);
            setSimulationActive(true);
            if (parsedData.execution_error) {
              setPyodideError(
                `Python Execution Error: ${parsedData.execution_error.type} - ${
                  parsedData.execution_error.message
                } (line ${parsedData.execution_error.line_no || "N/A"})`
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

  const handleStepInto = () => {
    // ... (this function remains the same)
    if (canStep) {
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handleStepOver = useCallback(() => {
    // ... (this function remains the same)
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
        // Check filename
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
      handleStepInto();
    }
  }, [parsedTraceEvents, currentStepIndex]); // handleStepInto is stable if defined with useCallback or outside

  const handleStepOut = useCallback(() => {
    // ... (this function remains the same)
    if (
      !parsedTraceEvents ||
      currentStepIndex < 0 ||
      currentStepIndex >= parsedTraceEvents.length
    )
      return;
    const currentEvent = parsedTraceEvents[currentStepIndex];
    const initialDepth = currentEvent.stack_depth;
    const initialFuncName = currentEvent.func_name; // Capture the function name we are stepping out of

    if (initialDepth === 0) return;

    let nextIndex = currentStepIndex + 1;
    let foundCorrectReturn = false;
    while (nextIndex < parsedTraceEvents.length) {
      const event = parsedTraceEvents[nextIndex];
      // We are looking for a 'return' event from the *current function* at a shallower depth
      if (
        event.event === "return" &&
        event.func_name === initialFuncName &&
        event.stack_depth === initialDepth - 1 && // Return to caller's depth
        event.file_name === USER_CODE_VIRTUAL_FILENAME
      ) {
        foundCorrectReturn = true;
      }
      // After that specific return, find the next 'line' event in the caller
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
  }, [parsedTraceEvents, currentStepIndex]);

  const currentTraceEvent =
    parsedTraceEvents &&
    currentStepIndex >= 0 &&
    currentStepIndex < parsedTraceEvents.length
      ? parsedTraceEvents[currentStepIndex]
      : null;

  const getHighlightedCode = () => {
    if (!simulationActive || !currentTraceEvent) return userCode.split("\n");
    const lines = userCode.split("\n");
    const displayLines = [...lines];
    const traceLineNo = currentTraceEvent.line_no;

    // *** USE THE TYPESCRIPT CONSTANT HERE ***
    if (
      currentTraceEvent.file_name === USER_CODE_VIRTUAL_FILENAME &&
      traceLineNo > 0 &&
      traceLineNo <= displayLines.length
    ) {
      displayLines[traceLineNo - 1] = `<span class="${
        styles.highlightedLine
      }">${displayLines[traceLineNo - 1]}</span>`;
    }
    return displayLines;
  };

  // ... (JSX for rendering the component remains the same as in Step 6 response)
  // Ensure you use the updated `getHighlightedCode`
  return (
    <div className={`${styles.debuggerSection} ${sectionStyles.section}`}>
      <h2 className={styles.title}>Python Debugger (Step 6 Implemented)</h2>
      <div className={styles.editorContainer}>
        <CodeEditor
          value={userCode}
          onChange={setUserCode}
          readOnly={isTracing || isPyodideLoading || simulationActive}
          height="250px"
          minHeight="200px"
          className={simulationActive ? styles.readOnlyEditor : ""}
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
            : "Run & Generate Trace"}
        </button>
        {pyodideHookError && !isPyodideLoading && (
          <span className={styles.errorMessage}>Pyodide Init Error!</span>
        )}
      </div>

      {pyodideError && !isTracing && (
        <div className={styles.errorMessage}>
          <pre>{pyodideError}</pre>
        </div>
      )}

      {simulationActive && parsedTraceEvents && (
        <div className={styles.simulationArea}>
          <div>
            {" "}
            {/* Left Column for Controls & Variables */}
            <div className={styles.simulationControls}>
              <button
                onClick={handleStepInto}
                disabled={!canStep}
                className={styles.stepButton}
              >
                Step Into (F11)
              </button>
              <button
                onClick={handleStepOver}
                disabled={!canStep}
                className={styles.stepButton}
              >
                Step Over (F10)
              </button>
              <button
                onClick={handleStepOut}
                disabled={
                  !canStep ||
                  (currentTraceEvent && currentTraceEvent.stack_depth === 0)
                }
                className={styles.stepButton}
              >
                Step Out (Shift+F11)
              </button>
            </div>
            {currentTraceEvent && (
              <div className={styles.currentStepInfo}>
                Step: {currentTraceEvent.step}/{parsedTraceEvents.length} |
                Line: {currentTraceEvent.line_no} | Event:{" "}
                {currentTraceEvent.event} | Func: {currentTraceEvent.func_name}{" "}
                | Depth: {currentTraceEvent.stack_depth}
              </div>
            )}
            <div className={styles.variablesDisplay}>
              <h4>Variables in Scope:</h4>
              {currentTraceEvent &&
              currentTraceEvent.locals &&
              Object.keys(currentTraceEvent.locals).length > 0 ? (
                <pre>
                  {Object.entries(currentTraceEvent.locals)
                    .map(
                      ([key, value]) =>
                        `${key}: ${
                          typeof value === "object"
                            ? JSON.stringify(value, null, 2)
                            : String(value)
                        }`
                    )
                    .join("\n")}
                </pre>
              ) : (
                <p className={styles.noVariables}>
                  {currentTraceEvent
                    ? "No local variables captured."
                    : "Trace not active."}
                </p>
              )}
            </div>
          </div>
          <div>
            {" "}
            {/* Right Column for Code & Raw Trace */}
            <div className={styles.simulationCodeDisplay}>
              <h4>Your Code (Simulating):</h4>
              <pre
                dangerouslySetInnerHTML={{
                  __html: getHighlightedCode().join("\n"),
                }}
              />
            </div>
            {rawTraceOutput && ( // Optionally keep displaying raw trace for debugging
              <div
                className={styles.traceOutputContainer}
                style={{ marginTop: "1rem" }}
              >
                <h4>Raw Trace (JSON):</h4>
                <pre className={styles.traceOutput}>{rawTraceOutput}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebuggerSection;
