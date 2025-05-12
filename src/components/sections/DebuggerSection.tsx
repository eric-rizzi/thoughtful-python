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
import inspect

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
        # More robustly capture locals using repr(), especially for complex objects
        # common in module-level scope (globals).
        current_locals = frame.f_locals
        for key, value in current_locals.items():
            # Skip common module/function references that cause noise and circularity issues
            # You can expand this list if needed
            if key in ['__name__', '__doc__', '__package__', '__loader__', 
                       '__spec__', '__builtins__', '__file__', 
                       'python_tracer', 'trace_data', 'user_code_to_execute',
                       'MAX_TRACE_EVENTS', 'json', 'sys', 'execution_exception',
                       'output_payload', 'serialized_output_payload', 'e', 'arg', 'frame', 'event',
                       'local_vars_snapshot', 'line_no', 'func_name', 'file_name', 'current_locals',
                       'key', 'value', 'event_details' # self-references to tracer's own variables
                       ]: # Add other global/builtin names you want to exclude
                continue
            
            # Also skip if the value is a module or the tracer function itself
            if hasattr(value, '__name__') and inspect.ismodule(value): # Requires import inspect
                 local_vars_snapshot[key] = f"<module '{value.__name__}'>"
                 continue
            if value is python_tracer: # Skip self-reference
                 local_vars_snapshot[key] = "<tracer_function>"
                 continue
            
            try:
                # For simpler types, attempt direct assignment if they are JSON serializable by default.
                # This helps keep numbers as numbers, bools as bools in the JSON.
                if isinstance(value, (int, float, str, bool, list, dict, type(None))):
                    # Further check for list/dict contents' serializability if desired,
                    # or just let repr() handle complex ones.
                    # For simplicity here, we assume if it's one of these types, it's "simple enough"
                    # or repr() will be fine.
                    try:
                        json.dumps(value) # Test outer serializability
                        local_vars_snapshot[key] = value
                    except (TypeError, OverflowError):
                         local_vars_snapshot[key] = repr(value) # Fallback for non-serializable content within list/dict
                else:
                    local_vars_snapshot[key] = repr(value) # Use repr for other complex types
            except Exception: # Catch any error during repr or type checking
                local_vars_snapshot[key] = "<unrepresentable_object>"

    except Exception as e_locals: # Catch errors during the iteration itself
        local_vars_snapshot = {"_tracer_error": f"Error iterating/processing locals: {repr(e_locals)}"}


    event_details = {
        "step": len(trace_data) + 1,
        "file_name": file_name,
        "line_no": line_no,
        "event": event,
        "func_name": func_name,
        "locals": local_vars_snapshot, # Now contains string representations primarily
    }
    
    # (Rest of your event handling logic: 'line', 'call', 'return', 'exception')
    # This part can remain largely the same, as the primary change is how locals are captured.
    if event == 'line':
        trace_data.append(event_details)
    elif event == 'call':
        trace_data.append({**event_details, "type_specific": "function_call_started"})
    elif event == 'return':
        return_value_repr = ""
        try:
            # For return value, direct assignment is fine if simple, else repr()
            if isinstance(arg, (int, float, str, bool, list, dict, type(None))):
                 json.dumps(arg) # Test serializability
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
            "exception_value": str(exc_value) # Using str() for exception value is often cleaner
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
