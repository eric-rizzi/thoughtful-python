// src/components/sections/DebuggerSection.tsx
import React, { useState, useCallback } from "react";
import CodeEditor from "../CodeEditor"; // Assuming path is correct
import { usePyodide } from "../../contexts/PyodideContext";
import styles from "./DebuggerSection.module.css"; // Your new CSS module
import sectionStyles from "./Section.module.css"; // Common section styles

// The Python script (from above) as a template string
const PYTHON_TRACE_SCRIPT_TEMPLATE = `
import sys
import json

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

    line_no = frame.f_lineno
    func_name = frame.f_code.co_name
    file_name = frame.f_code.co_filename 
    
    local_vars_snapshot = {}
    try:
        current_locals = frame.f_locals
        for key, value in current_locals.items():
            try:
                json.dumps({key: value}) 
                local_vars_snapshot[key] = value
            except (TypeError, OverflowError):
                local_vars_snapshot[key] = repr(value)
    except Exception as e:
        local_vars_snapshot = {"_tracer_error": f"Error copying locals: {repr(e)}"}

    event_details = {
        "step": len(trace_data) + 1,
        "file_name": file_name,
        "line_no": line_no,
        "event": event,
        "func_name": func_name,
        "locals": local_vars_snapshot,
    }
    
    if event == 'line':
        trace_data.append(event_details)
    elif event == 'call':
        trace_data.append({**event_details, "type_specific": "function_call_started"})
    elif event == 'return':
        return_value_repr = ""
        try:
            json.dumps({"retval": arg})
            return_value_repr = arg
        except (TypeError, OverflowError):
            return_value_repr = repr(arg)
        trace_data.append({**event_details, "type_specific": "function_returned", "return_value": return_value_repr})
    elif event == 'exception':
        exc_type, exc_value, exc_traceback_obj = arg
        # Format the traceback if needed, or just send type and value
        trace_data.append({
            **event_details,
            "type_specific": "exception_raised",
            "exception_type": exc_type.__name__ if hasattr(exc_type, '__name__') else repr(exc_type),
            "exception_value": repr(exc_value)
        })
    
    return python_tracer

final_result_of_main = None
execution_exception = None

# This is where user_code_to_execute will be defined by replacing the above placeholder
# For safety, ensure user_code_to_execute is defined before this point.
# If it's defined from a string replacement, it needs to be syntactically valid Python.

# Example: If user_code_to_execute was a multi-line string passed from JS:
# user_code_to_execute_parsed = user_code_to_execute

sys.settrace(python_tracer)
try:
    # The user_code_to_execute string (after replacement) is directly executed
    exec(user_code_to_execute, globals()) 
except Exception as e:
    execution_exception = e
    # Capture exception info directly if not caught by tracer's 'exception' event
    # This might happen for syntax errors before tracing properly starts for lines.
    if not any(ev.get('event') == 'exception' for ev in trace_data):
        trace_data.append({
            "step": len(trace_data) + 1,
            "file_name": "<user_code>", # Or appropriate
            "line_no": getattr(e, 'lineno', 'N/A'),
            "event": "script_exception",
            "func_name": "<module>",
            "locals": {},
            "type_specific": "script_execution_error",
            "exception_type": e.__class__.__name__,
            "exception_value": str(e)
        })
finally:
    sys.settrace(None)

output_payload = {
    "trace": trace_data
}
if execution_exception:
     output_payload["execution_error"] = {
        "type": execution_exception.__class__.__name__,
        "message": str(execution_exception),
        "line_no": getattr(execution_exception, 'lineno', None)
    }

try:
    serialized_output_payload = json.dumps(output_payload, indent=2)
    print("---DEBUGGER_TRACE_START---")
    print(serialized_output_payload)
    print("---DEBUGGER_TRACE_END---")
except Exception as e:
    error_output = json.dumps({"error": "Failed to serialize trace_data for output", "details": str(e)})
    print("---DEBUGGER_TRACE_START---")
    print(error_output)
    print("---DEBUGGER_TRACE_END---")
`;

interface DebuggerSectionProps {
  // Props for title, initial code etc. can be added if this becomes part of a lesson structure
  // For now, it's standalone for the PoC.
  // section: { id: string; title: string; initialCode?: string }; // Example
}

const DebuggerSection: React.FC<DebuggerSectionProps> = () => {
  const [userCode, setUserCode] = useState<string>(
    '# Enter your Python code here\n\nname = "Debugger"\nfor i in range(3):\n    print(f"Hello, {name} - Step {i+1}")\n    age = i * 10\n\nif True:\n    x=10\n    y=20\n    z=x+y\n\ndef my_func(a,b):\n    internal_var = a * b\n    return internal_var\n\nres = my_func(x,2)'
  );
  const [traceOutput, setTraceOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);

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
      setTraceOutput(null);
      return;
    }

    setIsRunning(true);
    setTraceOutput("Generating trace...");
    setPyodideError(null);

    // Inject user code into the script template
    // Basic replacement; ensure userCode doesn't break the Python string literal.
    // More robust: escape userCode properly or pass it as a separate argument to a Python function within the script.
    // For `exec()`, the raw string is fine.
    const scriptToRun = PYTHON_TRACE_SCRIPT_TEMPLATE.replace(
      "# Placeholder for user's actual code",
      userCode
    );

    const { output, error } = await runPythonCode(scriptToRun);

    if (error) {
      setPyodideError(`Error during Python execution: ${error}`);
      setTraceOutput(null);
    } else {
      const traceJsonMatch = output.match(
        /---DEBUGGER_TRACE_START---([\s\S]*?)---DEBUGGER_TRACE_END---/
      );
      if (traceJsonMatch && traceJsonMatch[1]) {
        try {
          // The output is already indented JSON from the Python script
          setTraceOutput(traceJsonMatch[1].trim());
        } catch (e) {
          setPyodideError(
            `Error parsing trace JSON: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
          setTraceOutput(
            "Failed to parse trace output. See console for details."
          );
          console.error(
            "Raw output causing parse error:",
            traceJsonMatch[1].trim()
          );
        }
      } else {
        setPyodideError("Could not find trace markers in Pyodide output.");
        setTraceOutput("Trace markers not found. Raw output:\n" + output);
      }
    }
    setIsRunning(false);
  }, [userCode, runPythonCode, isPyodideLoading, pyodideHookError]);

  return (
    <div className={`${styles.debuggerSection} ${sectionStyles.section}`}>
      {" "}
      {/* Combine styles */}
      <h2 className={styles.title}>Python Debugger PoC</h2>
      <div className={styles.editorContainer}>
        <CodeEditor
          value={userCode}
          onChange={setUserCode}
          readOnly={isRunning || isPyodideLoading}
          height="200px"
          minHeight="150px"
        />
      </div>
      <div className={styles.controls}>
        <button
          onClick={handleRunAndTrace}
          disabled={isRunning || isPyodideLoading}
          className={styles.runButton}
        >
          {isPyodideLoading
            ? "Pyodide Loading..."
            : isRunning
            ? "Tracing..."
            : "Run & Generate Trace"}
        </button>
        {pyodideHookError && !isPyodideLoading && (
          <span className={styles.errorMessage}>Pyodide Init Error!</span>
        )}
      </div>
      {pyodideError && (
        <div className={styles.errorMessage}>
          <pre>{pyodideError}</pre>
        </div>
      )}
      {traceOutput && (
        <div className={styles.traceOutputContainer}>
          <h4>Raw Trace Output:</h4>
          <pre className={styles.traceOutput}>{traceOutput}</pre>
        </div>
      )}
    </div>
  );
};

export default DebuggerSection;
