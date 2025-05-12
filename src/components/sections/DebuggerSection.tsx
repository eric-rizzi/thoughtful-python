// src/components/sections/DebuggerSection.tsx
import React, { useState, useCallback, useEffect } from "react";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import styles from "./DebuggerSection.module.css";
import sectionStyles from "./Section.module.css";

// Python trace script template remains the same as your last working version

const PYTHON_TRACE_SCRIPT_TEMPLATE = `
import sys
import json
import inspect # Make sure inspect is imported

trace_data = []
MAX_TRACE_EVENTS = 1000

user_code_to_execute = """
# Placeholder for user's actual code
"""

def python_tracer(frame, event, arg):
    global trace_data
    if len(trace_data) >= MAX_TRACE_EVENTS:
        sys.settrace(None)
        return None

    # Determine the filename of the current frame
    current_frame_filename = frame.f_code.co_filename

    # Default tracer to return (continue tracing in the current scope)
    next_tracer_for_this_scope = python_tracer

    # --- Step 4: Filtering Logic ---
    # We only care about events happening within the user's directly executed code,
    # which typically has a filename of '<string>' when run with exec().
    if current_frame_filename != '<string>':
        # If the event is from a different file (e.g., a library),
        # we don't want to trace any further *into* it.
        next_tracer_for_this_scope = None 
        # And we also won't record this specific event from the non-user code.
        return next_tracer_for_this_scope


    # If we are here, current_frame_filename == '<string>', so it's an event from user code.
    # Proceed to capture details for this event.
    line_no = frame.f_lineno
    func_name = frame.f_code.co_name
    
    local_vars_snapshot = {}
    try:
        current_locals = frame.f_locals
        for key, value in current_locals.items():
            # (Keep your existing robust locals capturing logic here)
            if key in ['__name__', '__doc__', '__package__', '__loader__', 
                       '__spec__', '__builtins__', '__file__', 
                       'python_tracer', 'trace_data', 'user_code_to_execute',
                       'MAX_TRACE_EVENTS', 'json', 'sys', 'inspect', 'execution_exception',
                       'output_payload', 'serialized_output_payload', 'e', 'arg', 'frame', 'event',
                       'local_vars_snapshot', 'line_no', 'func_name', 
                       'current_frame_filename', 'next_tracer_for_this_scope', # Add new vars here
                       'key', 'value', 'event_details' 
                       ]: 
                continue
            
            if hasattr(value, '__name__') and inspect.ismodule(value):
                 local_vars_snapshot[key] = f"<module '{value.__name__}'>"
                 continue
            if value is python_tracer: 
                 local_vars_snapshot[key] = "<tracer_function>"
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
        "file_name": current_frame_filename, # Will be '<string>' for recorded events
        "line_no": line_no,
        "event": event,
        "func_name": func_name,
        "locals": local_vars_snapshot,
    }
    
    # Record the event since it's from user code ('<string>')
    if event == 'line':
        trace_data.append(event_details)
    elif event == 'call':
        # If this 'call' is to a function defined in a *different* file (not '<string>'),
        # we still record the 'call' event itself (as it originates from user code),
        # but we must ensure we don't trace *into* that other function.
        # We get the callee's frame information from the 'arg' in some Python versions/scenarios,
        # or more reliably by inspecting the function object being called if possible.
        # However, for \`sys.settrace\`, the \`frame\` in a 'call' event is the *new frame being entered*.
        # So, \`current_frame_filename\` for a 'call' event *is* the filename of the function being entered.
        # The filtering \`if current_frame_filename != '<string>': return None\` at the top
        # already handles not tracing into non-'<string>' functions.
        # Thus, if we reach here for a 'call' event, it's a call to a function *within* '<string>'.
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
    
    return next_tracer_for_this_scope # This will be python_tracer if in user code, None otherwise.

# ... (rest of the script: final_result_of_main, exec block, output_payload, print block) ...
# This part remains unchanged:
final_result_of_main = None
execution_exception = None

sys.settrace(python_tracer)
try:
    exec(user_code_to_execute, globals()) 
except Exception as e:
    execution_exception = e
    if not any(ev.get('event') == 'exception' for ev in trace_data):
        trace_data.append({
            "step": len(trace_data) + 1,
            "file_name": "<user_code>", # Or appropriate for exec errors
            "line_no": getattr(e, 'lineno', 'N/A'), # Error line in user_code_to_execute
            "event": "script_exception", # Distinguish from tracer's 'exception' event
            "func_name": "<module>",
            "locals": {}, # Locals might not be relevant or available for a script-level syntax error
            "type_specific": "script_execution_error",
            "exception_type": e.__class__.__name__,
            "exception_value": str(e)
        })
finally:
    sys.settrace(None)

output_payload = { "trace": trace_data }
if execution_exception:
     output_payload["execution_error"] = {
        "type": execution_exception.__class__.__name__,
        "message": str(execution_exception),
        "line_no": getattr(execution_exception, 'lineno', None) # Error line in user_code_to_execute
    }

try:
    serialized_output_payload = json.dumps(output_payload, indent=2)
    print("---DEBUGGER_TRACE_START---")
    print(serialized_output_payload)
    print("---DEBUGGER_TRACE_END---")
except Exception as e:
    # Attempt to serialize individual trace events if the whole list fails
    safe_trace = []
    for item in trace_data:
        try:
            json.dumps(item)
            safe_trace.append(item)
        except:
            safe_trace.append({"error": "Unserializable item", "original_step": item.get("step")})
    
    error_output_content = {
        "error": "Failed to serialize full trace_data for output", 
        "details": str(e),
        "partial_trace_head": safe_trace[:5] # First 5 safe/marked items
    }
    if execution_exception:
        error_output_content["execution_error"] = output_payload["execution_error"]

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
  locals: Record<string, any>;
  type_specific?: string;
  return_value?: any;
  exception_type?: string;
  exception_value?: string;
}

const DebuggerSection: React.FC = () => {
  const [userCode, setUserCode] = useState<string>(
    'def my_func(a,b):\n    internal_var = a * b\n    return internal_var\n\nx = 5\nres = my_func(x,2)\nprint(f"Result is {res}")'
  );
  const [rawTraceOutput, setRawTraceOutput] = useState<string | null>(null); // For displaying the raw JSON
  const [parsedTraceEvents, setParsedTraceEvents] = useState<
    TraceEvent[] | null
  >(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isTracing, setIsTracing] = useState<boolean>(false); // Renamed from isRunning for clarity
  const [pyodideError, setPyodideError] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);

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
            setParsedTraceEvents(parsedData.trace);
            setCurrentStepIndex(0); // Start at the first trace event
            setSimulationActive(true);
            if (parsedData.execution_error) {
              // Display execution error if present in payload
              setPyodideError(
                `Python Execution Error: ${parsedData.execution_error.type} - ${
                  parsedData.execution_error.message
                } (approx. line ${parsedData.execution_error.line_no || "N/A"})`
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

  const handleStepInto = () => {
    if (parsedTraceEvents && currentStepIndex < parsedTraceEvents.length - 1) {
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
    }
  };

  const currentTraceEvent =
    parsedTraceEvents &&
    currentStepIndex >= 0 &&
    currentStepIndex < parsedTraceEvents.length
      ? parsedTraceEvents[currentStepIndex]
      : null;

  // For displaying code with highlighted line (simplified)
  const getHighlightedCode = () => {
    if (!simulationActive || !currentTraceEvent) return userCode.split("\n");
    const lines = userCode.split("\n");
    // Line numbers in trace are 1-indexed relative to the user_code_to_execute string,
    // which has user's code starting after a comment line, effectively making user's line 1 become trace line 2.
    // Adjust if your placeholder setup is different. The provided trace has line_no referring to line within `user_code_to_execute`.
    // The `python_tracer` in the template replaces `# Placeholder...` with `userCode`.
    // So, `line_no` in trace for `userCode` should be 1-indexed for `userCode` itself.
    const traceLineNo = currentTraceEvent.line_no; // This is 1-indexed from the trace

    // Check if the event is from the user's code (you'll refine this in Step 4)
    // For now, assume if file_name is <string> or similar, it's user code.
    // file_name in trace is currently always "<string>" for user code part.
    if (traceLineNo > 0 && traceLineNo <= lines.length) {
      lines[traceLineNo - 1] = `<span class="${styles.highlightedLine}">${
        lines[traceLineNo - 1]
      }</span>`;
    }
    return lines;
  };

  return (
    <div className={`${styles.debuggerSection} ${sectionStyles.section}`}>
      <h2 className={styles.title}>Python Debugger PoC (Steps 2 & 3)</h2>

      <div className={styles.editorContainer}>
        <CodeEditor
          value={userCode}
          onChange={setUserCode}
          readOnly={isTracing || isPyodideLoading || simulationActive}
          height="200px"
          minHeight="150px"
          // Add a class when readOnly for visual feedback
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

      {pyodideError &&
        !isTracing && ( // Show Python execution errors if not currently tracing
          <div className={styles.errorMessage}>
            <pre>{pyodideError}</pre>
          </div>
        )}

      {simulationActive && parsedTraceEvents && (
        <div className={styles.simulationArea}>
          {/* Left side: Variables and Controls */}
          <div>
            <div className={styles.simulationControls}>
              <button
                onClick={handleStepInto}
                disabled={
                  !currentTraceEvent ||
                  currentStepIndex >= parsedTraceEvents.length - 1
                }
                className={styles.stepButton}
              >
                Step Into
              </button>
              {currentTraceEvent && (
                <span className={styles.currentStepInfo}>
                  Step: {currentTraceEvent.step}/{parsedTraceEvents.length} |
                  Line: {currentTraceEvent.line_no} | Event:{" "}
                  {currentTraceEvent.event} | Func:{" "}
                  {currentTraceEvent.func_name}
                </span>
              )}
            </div>
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
                            : value
                        }`
                    )
                    .join("\n")}
                </pre>
              ) : (
                <p className={styles.noVariables}>
                  {currentTraceEvent
                    ? "No local variables captured or available."
                    : "Trace not started or no current step."}
                </p>
              )}
            </div>
          </div>

          {/* Right side: Code display and Raw Trace (optional) */}
          <div>
            <div className={styles.simulationCodeDisplay}>
              <h4>Your Code (Simulating):</h4>
              {/* Simple line highlighting for now */}
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
