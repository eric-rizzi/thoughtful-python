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
import inspect

trace_data = []
MAX_TRACE_EVENTS = 1000
USER_CODE_FILENAME = '/user_temp_script.py' # Define a constant for the filename

user_code_to_execute = """
# Placeholder for user's actual code
"""

# Write the user_code_to_execute to the virtual file
# This happens once when the script string is prepared by Python interpreter
try:
    with open(USER_CODE_FILENAME, 'w') as f:
        f.write(user_code_to_execute)
    
    # Compile the code from the file, providing the filename
    # This ensures code objects created will have USER_CODE_FILENAME.
    # We'll execute this compiled_code later.
    source_code_to_compile = open(USER_CODE_FILENAME, 'r').read()
    compiled_user_code = compile(source_code_to_compile, USER_CODE_FILENAME, 'exec')
except Exception as e_setup:
    # If setup fails (e.g., writing to FS, compiling), capture this error.
    # This error will be part of the payload sent back.
    initial_setup_error = {"type": e_setup.__class__.__name__, "message": str(e_setup)}
    compiled_user_code = None # Ensure it's None if compilation failed
else:
    initial_setup_error = None

def python_tracer(frame, event, arg):
    global trace_data
    if len(trace_data) >= MAX_TRACE_EVENTS:
        sys.settrace(None)
        return None

    current_frame_filename = frame.f_code.co_filename
    next_tracer_for_this_scope = python_tracer

    if current_frame_filename != USER_CODE_FILENAME: # Filter based on our specific filename
        next_tracer_for_this_scope = None 
        return next_tracer_for_this_scope 

    # (Your existing robust locals capturing logic - slightly adapted for new var names)
    line_no = frame.f_lineno
    func_name = frame.f_code.co_name
    local_vars_snapshot = {}
    try:
        current_locals = frame.f_locals
        for key, value in current_locals.items():
            if key in ['__name__', '__doc__', '__package__', '__loader__', 
                       '__spec__', '__builtins__', '__file__', 
                       'python_tracer', 'trace_data', 'user_code_to_execute', 'USER_CODE_FILENAME',
                       'compiled_user_code', 'source_code_to_compile', 'initial_setup_error', # new script vars
                       'MAX_TRACE_EVENTS', 'json', 'sys', 'inspect', 'execution_exception',
                       'output_payload', 'serialized_output_payload', 'e_setup', 'e', 'f', 'arg', 'frame', 'event',
                       'local_vars_snapshot', 'line_no', 'func_name', 
                       'current_frame_filename', 'next_tracer_for_this_scope',
                       'key', 'value', 'event_details'
                       ]: 
                continue
            if hasattr(value, '__name__') and inspect.ismodule(value): # Check if value is a module
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
        "file_name": current_frame_filename, # Will be USER_CODE_FILENAME
        "line_no": line_no,
        "event": event,
        "func_name": func_name,
        "locals": local_vars_snapshot,
    }
    
    # (Your existing event recording logic: if event == 'line', 'call', etc.)
    # This part remains the same as before.
    if event == 'line':
        trace_data.append(event_details)
    # ... (other event types: call, return, exception) ...
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

    return next_tracer_for_this_scope

# Main execution block
execution_error_details = None

if initial_setup_error: # If writing/compiling the user code failed
    execution_error_details = initial_setup_error
    # Optionally add a trace event indicating setup failure
    trace_data.append({
        "step": 1, "file_name": USER_CODE_FILENAME, "line_no": 0, 
        "event": "setup_error", "func_name": "<setup>", "locals": {},
        "type_specific": "script_setup_error",
        "exception_type": initial_setup_error["type"],
        "exception_value": initial_setup_error["message"]
    })
elif compiled_user_code: # Only proceed if setup was successful
    sys.settrace(python_tracer)
    try:
        exec(compiled_user_code, globals()) # Execute the pre-compiled code
    except Exception as e_exec:
        execution_error_details = {"type": e_exec.__class__.__name__, "message": str(e_exec), "line_no": getattr(e_exec, 'lineno', None)}
        # Tracer should have caught this if it's a runtime error. 
        # If it's an error during exec setup itself (rare after successful compile), capture it.
        if not any(ev.get('event') == 'exception' or ev.get('event') == 'script_exception' for ev in trace_data):
             trace_data.append({
                "step": len(trace_data) + 1, "file_name": USER_CODE_FILENAME,
                "line_no": getattr(e_exec, 'lineno', 'N/A'), "event": "exec_error", 
                "func_name": "<module>", "locals": {},
                "type_specific": "script_execution_error",
                "exception_type": e_exec.__class__.__name__, "exception_value": str(e_exec)
            })
    finally:
        sys.settrace(None)

output_payload = { "trace": trace_data }
if execution_error_details:
     output_payload["execution_error"] = execution_error_details

# (The final JSON serialization and print block remains the same)
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
        "partial_trace_head": safe_trace[:5]
    }
    if execution_error_details: # ensure exec error is included if serialization fails
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
