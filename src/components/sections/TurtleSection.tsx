// src/components/sections/TurtleSection.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  TurtleSectionData,
  JsTurtleCommand,
  LessonId,
  UnitId,
} from "../../types/data";
import styles from "./Section.module.css";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import { useProgressActions } from "../../stores/progressStore";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface RealTurtleInstance {
  execute: (commands: JsTurtleCommand[]) => Promise<void>;
  reset: () => void;
  clear: () => void;
}

const setupJsTurtle = (canvas: HTMLCanvasElement): RealTurtleInstance => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D rendering context for canvas.");
  }

  let x = canvas.width / 2;
  let y = canvas.height / 2;
  let heading = 0;
  let penDown = true;
  let penColor = "black";
  let penSize = 1;

  const resetTurtleState = () => {
    x = canvas.width / 2;
    y = canvas.height / 2;
    heading = 0;
    penDown = true;
    penColor = "black";
    penSize = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  resetTurtleState();

  const executeCommand = (command: JsTurtleCommand) => {
    // const oldX = x; // Not directly used in this simplified version
    // const oldY = y; // Not directly used

    switch (command.type) {
      case "goto":
        x = command.x;
        y = command.y;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case "forward":
        const distance = command.distance;
        const rad = heading * (Math.PI / 180);
        x += distance * Math.cos(rad);
        y += distance * Math.sin(rad); // Canvas Y is typically top-down

        if (penDown) {
          ctx.lineTo(x, y);
        } else {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
        break;
      case "left":
        heading = (heading - command.angle) % 360;
        break;
      case "right":
        heading = (heading + command.angle) % 360;
        break;
      case "penup":
        penDown = false;
        ctx.stroke();
        break;
      case "pendown":
        penDown = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case "clear":
        resetTurtleState();
        break;
      case "setPenColor":
        penColor = command.color;
        ctx.strokeStyle = penColor;
        break;
      default:
        console.warn("Unknown JS Turtle command type:", command);
    }
  };

  const executeAllCommands = async (
    commands: JsTurtleCommand[]
  ): Promise<void> => {
    resetTurtleState();
    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const command of commands) {
      executeCommand(command);
    }
    ctx.stroke();
  };

  return {
    execute: executeAllCommands,
    reset: resetTurtleState,
    clear: resetTurtleState,
  };
};

const pythonCaptureModuleCode = `
import sys
import json
import math

global _js_turtle_commands_
_js_turtle_commands_ = []

class CaptureTurtle:
    def __init__(self):
        self._heading = 0.0
        self._x = 0.0
        self._y = 0.0
        self._pen_down = True
        self._color = "black"
        _js_turtle_commands_.clear()

    def _add_command(self, command_dict):
        _js_turtle_commands_.append(command_dict)

    def goto(self, x, y):
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            raise TypeError("Coordinates must be numbers")
        self._x = float(x)
        self._y = float(y)
        self._add_command({'type': 'goto', 'x': self._x, 'y': self._y})

    def forward(self, distance):
        if not isinstance(distance, (int, float)):
            raise TypeError("Distance must be a number")
        # Python turtle's internal position update (not directly used for JS command generation here)
        # rad = math.radians(self._heading)
        # new_x = self._x + distance * math.cos(rad)
        # new_y = self._y - distance * math.sin(rad) # Assuming Y inversion for screen
        
        self._add_command({'type': 'forward', 'distance': float(distance), 'penDown': self._pen_down, 'color': self._color})
        # self._x = new_x # Update internal state
        # self._y = new_y

    def backward(self, distance):
        if not isinstance(distance, (int, float)):
            raise TypeError("Distance must be a number")
        self.forward(-distance)

    def right(self, angle):
        if not isinstance(angle, (int, float)):
            raise TypeError("Angle must be a number")
        self._heading = (self._heading + angle) % 360
        self._add_command({'type': 'right', 'angle': float(angle)})

    def left(self, angle):
        if not isinstance(angle, (int, float)):
            raise TypeError("Angle must be a number")
        self._heading = (self._heading - angle) % 360
        self._add_command({'type': 'left', 'angle': float(angle)})

    def penup(self):
        self._pen_down = False
        self._add_command({'type': 'penup'})

    def pendown(self):
        self._pen_down = True
        self._add_command({'type': 'pendown'})

    def clear(self):
        self._heading = 0.0
        self._x = 0.0
        self._y = 0.0
        self._pen_down = True
        self._color = "black"
        _js_turtle_commands_.clear()
        self._add_command({'type': 'clear'})

    def set_pen_color(self, color): # Renamed from setPenColor for Python convention
        if not isinstance(color, str):
            raise TypeError("Color must be a string")
        self._color = color
        self._add_command({'type': 'setPenColor', 'color': color})

    def fd(self, distance): self.forward(distance)
    def bk(self, distance): self.backward(distance)
    def back(self, distance): self.backward(distance)
    def lt(self, angle): self.left(angle)
    def rt(self, angle): self.right(angle)
    def pu(self): self.penup()
    def pd(self): self.pendown()

class TurtleModule:
    def __init__(self):
        self.Turtle = CaptureTurtle
        self.Screen = self._dummy_screen

    def _dummy_screen(self):
        return type('DummyScreen', (object,), {
            'setup': lambda *a, **kw: None,
            'tracer': lambda *a, **kw: None,
            'update': lambda *a, **kw: None,
            'exitonclick': lambda *a, **kw: None,
            'listen': lambda *a, **kw: None,
            'onkey': lambda *a, **kw: None,
            'clear': lambda *a, **kw: None,
            'reset': lambda *a, **kw: None,
        })()

sys.modules['turtle'] = TurtleModule()
sys.modules['animated_turtle'] = sys.modules['turtle']

json.dumps(_js_turtle_commands_)
`;

const TurtleSection: React.FC<{
  section: TurtleSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}> = ({ section, unitId, lessonId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jsTurtleRef = useRef<RealTurtleInstance | null>(null);

  const {
    runPythonCode,
    pyodide,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { completeSection } = useProgressActions();

  const [code, setCode] = useState(section.initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "correct" | "incorrect" | "error";
  } | null>(null);
  const [capturedJsCommands, setCapturedJsCommands] = useState<
    JsTurtleCommand[]
  >([]);

  useEffect(() => {
    if (canvasRef.current && !jsTurtleRef.current) {
      jsTurtleRef.current = setupJsTurtle(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (jsTurtleRef.current && capturedJsCommands.length > 0) {
      jsTurtleRef.current.execute(capturedJsCommands);
    } else if (jsTurtleRef.current && capturedJsCommands.length === 0) {
      jsTurtleRef.current.clear();
    }
  }, [capturedJsCommands]);

  const runCodeInternal = useCallback(
    // Renamed to avoid conflict if runCode is exposed
    async (codeToRun: string, isValidationRun: boolean = false) => {
      if (isPyodideLoading || !pyodide) {
        const message = "Python environment not ready.";
        if (!isValidationRun) setFeedback({ message, type: "error" });
        return { commands: [], error: message };
      }

      if (!isValidationRun) {
        setIsRunning(true);
        setFeedback(null);
        setCapturedJsCommands([]);
        if (jsTurtleRef.current) jsTurtleRef.current.clear();
        await new Promise((resolve) => requestAnimationFrame(resolve));
      } else {
        setIsChecking(true);
      }

      let pyError: string | null = null;
      let parsedJsCommands: JsTurtleCommand[] = [];

      const fullPythonScript = `
${pythonCaptureModuleCode}
# --- User Code ---
try:
${codeToRun
  .split("\n")
  .map((line) => `    ${line}`) // Basic indentation
  .join("\n")}
except Exception as e:
    import traceback
    # Print a specific marker for Python execution errors
    print(f"PYTHON_EXECUTION_ERROR:: {e}\\n{traceback.format_exc()}")
    _js_turtle_commands_ = [] # Clear commands on error
finally:
    pass

# Output the commands as a JSON string (this will be the last expression)
import json
json.dumps(_js_turtle_commands_)
`;

      try {
        console.log(fullPythonScript);
        const resultProxy = await pyodide.runPythonAsync(fullPythonScript);

        // Check if the output contains our error marker
        let actualOutputString = "";
        if (typeof resultProxy === "string") {
          actualOutputString = resultProxy;
        } else if (resultProxy && typeof resultProxy.toString === "function") {
          actualOutputString = resultProxy.toString();
        }

        const errorMatch = actualOutputString.match(
          /PYTHON_EXECUTION_ERROR:: ([\s\S]*)/
        );
        if (errorMatch && errorMatch[1]) {
          pyError = errorMatch[1].trim();
          parsedJsCommands = []; // Ensure no commands if user code had runtime error
        } else {
          // If no PYTHON_EXECUTION_ERROR, attempt to parse as JSON command list
          try {
            if (typeof resultProxy === "string") {
              parsedJsCommands = JSON.parse(resultProxy) as JsTurtleCommand[];
            } else if (resultProxy && typeof resultProxy.toJs === "function") {
              parsedJsCommands = resultProxy.toJs({
                dict_converter: Object.fromEntries,
                list_converter: Array.from,
              }) as JsTurtleCommand[];
              resultProxy.destroy();
            } else {
              throw new Error("Unexpected Python output format from Pyodide.");
            }
          } catch (jsonParseError) {
            // This catch is for if the string isn't JSON (e.g. if user code prints something unexpected)
            console.error(
              "Error parsing command JSON from Pyodide:",
              jsonParseError,
              "Raw output:",
              actualOutputString
            );
            pyError = `Unexpected output from script (not valid JSON command list): ${actualOutputString.substring(
              0,
              200
            )}`;
            parsedJsCommands = [];
          }
        }
      } catch (error) {
        // This catches errors in runPythonAsync itself or major script issues
        console.error("Outer Python execution error:", error);
        pyError = error instanceof Error ? error.message : String(error);
        parsedJsCommands = [];
      } finally {
        if (!isValidationRun) setIsRunning(false);
        else setIsChecking(false);
      }

      if (!isValidationRun && !pyError) {
        setCapturedJsCommands(parsedJsCommands);
      } else if (!isValidationRun && pyError) {
        setFeedback({ message: `Error:\n${pyError}`, type: "error" });
      }

      return { commands: parsedJsCommands, error: pyError };
    },
    [pyodide, isPyodideLoading]
  );

  const checkSolution = useCallback(async () => {
    setFeedback(null);
    setIsChecking(true);
    const executionResult = await runCodeInternal(code, true);
    setIsChecking(false);

    if (executionResult.error) {
      setFeedback({
        message: `Error running code for validation:\n${executionResult.error}`,
        type: "error",
      });
      return;
    }
    const userCommands = executionResult.commands;
    if (!Array.isArray(userCommands)) {
      setFeedback({
        message: `Validation failed: Could not retrieve command list.`,
        type: "error",
      });
      return;
    }

    const expectedCommands =
      section.validationCriteria?.expectedJsCommands || [];
    if (expectedCommands.length === 0 && userCommands.length > 0) {
      // Allow empty expected if user also does nothing
      setFeedback({
        message: `Validation criteria missing (expectedJsCommands) for this challenge.`,
        type: "error",
      });
      return;
    }

    const { isCorrect, message } = compareJsTurtleCommandLists(
      userCommands,
      expectedCommands
    );
    let outputMessage: string;
    if (message) {
      outputMessage = message;
    } else if (isCorrect) {
      outputMessage = section.feedback ? section.feedback.correct : "Correct!";
    } else {
      outputMessage =
        section.feedback && section.feedback.incorrect
          ? section.feedback.incorrect
          : "Incorrect";
    }
    setFeedback({
      message: outputMessage,
      type: isCorrect ? "correct" : "incorrect",
    });
    if (isCorrect) {
      completeSection(unitId, lessonId, section.id);
    }
  }, [code, runCodeInternal, section, unitId, lessonId, completeSection]);

  const compareJsTurtleCommandLists = (
    userCmds: JsTurtleCommand[],
    expectedCmds: JsTurtleCommand[]
  ): { isCorrect: boolean; message?: string } => {
    if (userCmds.length !== expectedCmds.length) {
      return {
        isCorrect: false,
        message: `Incorrect number of turtle actions. Expected ${expectedCmds.length}, Got ${userCmds.length}.`,
      };
    }

    const tolerance = 1e-5;

    for (let i = 0; i < expectedCmds.length; i++) {
      const userCmd = userCmds[i];
      const expectedCmd = expectedCmds[i];

      if (!userCmd || userCmd.type !== expectedCmd.type) {
        return {
          isCorrect: false,
          message: `Action ${i + 1} type mismatch: Expected '${
            expectedCmd?.type
          }', Got '${userCmd?.type}'.`,
        };
      }

      switch (userCmd.type) {
        case "goto":
          const expGoto = expectedCmd as Extract<
            JsTurtleCommand,
            { type: "goto" }
          >;
          const userGoto = userCmd as Extract<
            JsTurtleCommand,
            { type: "goto" }
          >;
          if (
            Math.abs(userGoto.x - expGoto.x) > tolerance ||
            Math.abs(userGoto.y - expGoto.y) > tolerance
          ) {
            return {
              isCorrect: false,
              message: `Action ${
                i + 1
              } (goto) coordinates mismatch: Expected (${expGoto.x.toFixed(
                2
              )}, ${expGoto.y.toFixed(2)}), Got (${userGoto.x.toFixed(
                2
              )}, ${userGoto.y.toFixed(2)}).`,
            };
          }
          break;
        case "forward":
          const expForward = expectedCmd as Extract<
            JsTurtleCommand,
            { type: "forward" }
          >;
          const userForward = userCmd as Extract<
            JsTurtleCommand,
            { type: "forward" }
          >;
          if (
            Math.abs(userForward.distance - expForward.distance) > tolerance ||
            userForward.penDown !== expForward.penDown || // Compare penDown state
            userForward.color !== expForward.color // Compare color
          ) {
            return {
              isCorrect: false,
              message: `Action ${
                i + 1
              } (forward) attributes mismatch. Expected distance: ${expForward.distance.toFixed(
                2
              )}, penDown: ${expForward.penDown}, color: ${
                expForward.color
              }. Got distance: ${userForward.distance.toFixed(2)}, penDown: ${
                userForward.penDown
              }, color: ${userForward.color}.`,
            };
          }
          break;
        case "left":
        case "right":
          const expTurn = expectedCmd as Extract<
            JsTurtleCommand,
            { type: "left" | "right" }
          >;
          const userTurn = userCmd as Extract<
            JsTurtleCommand,
            { type: "left" | "right" }
          >;
          if (Math.abs(userTurn.angle - expTurn.angle) > tolerance) {
            return {
              isCorrect: false,
              message: `Action ${i + 1} (${
                userCmd.type
              }) angle mismatch: Expected ${expTurn.angle.toFixed(
                2
              )}, Got ${userTurn.angle.toFixed(2)}.`,
            };
          }
          break;
        case "setPenColor":
          const expColor = expectedCmd as Extract<
            JsTurtleCommand,
            { type: "setPenColor" }
          >;
          const userColorCmd = userCmd as Extract<
            JsTurtleCommand,
            { type: "setPenColor" }
          >;
          if (userColorCmd.color !== expColor.color) {
            return {
              isCorrect: false,
              message: `Action ${i + 1} (setPenColor) mismatch: Expected '${
                expColor.color
              }', Got '${userColorCmd.color}'.`,
            };
          }
          break;
        case "penup":
        case "pendown":
        case "clear":
          break;
        default:
          return {
            isCorrect: false,
            message: `Unknown command type encountered during comparison: ${
              (userCmd as any).type
            }`,
          };
      }
    }
    return {
      isCorrect: true,
      message: section.feedback ? section.feedback.correct : "Correct!",
    };
  };

  const canvasWidth = 400;
  const canvasHeight = 300;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.turtleCommandsReference}>
        <h4>Available Turtle Commands (Python):</h4>
        <ul>
          <li>
            <code>t = turtle.Turtle()</code>
          </li>
          <li>
            <code>t.forward(distance)</code> or <code>t.fd(distance)</code>
          </li>
          <li>
            <code>t.backward(distance)</code> or <code>t.bk(distance)</code>
          </li>
          <li>
            <code>t.left(angle)</code> or <code>t.lt(angle)</code>
          </li>
          <li>
            <code>t.right(angle)</code> or <code>t.rt(angle)</code>
          </li>
          <li>
            <code>t.penup()</code> or <code>t.pu()</code>
          </li>
          <li>
            <code>t.pendown()</code> or <code>t.pd()</code>
          </li>
          <li>
            <code>t.goto(x, y)</code>
          </li>
          <li>
            <code>t.set_pen_color("color_name")</code> (e.g., "red", "blue")
          </li>
          <li>
            <code>t.clear()</code>
          </li>
        </ul>
      </div>

      <div className={styles.turtleEditorContainer}>
        <h4>Your Code:</h4>
        <CodeEditor
          value={code}
          onChange={setCode}
          readOnly={isRunning || isChecking}
          minHeight="150px"
          preventPaste={true} // Prevent paste in TurtleSection CodeEditor
        />
        <div className={styles.editorControls}>
          <button
            onClick={() => runCodeInternal(code)}
            disabled={
              isRunning || isChecking || isPyodideLoading || !!pyodideError
            }
            className={styles.runButton}
          >
            {isRunning ? "Executing..." : "Run Code"}
          </button>
          <button
            onClick={checkSolution}
            disabled={
              isRunning || isChecking || isPyodideLoading || !!pyodideError
            }
            className={styles.testButton}
          >
            {isChecking ? "Checking..." : "Check Solution"}
          </button>
          {(isPyodideLoading || isRunning || isChecking) && (
            <span className={styles.pyodideStatus}>
              {isPyodideLoading
                ? "Python Loading..."
                : isRunning
                ? "Executing..."
                : isChecking
                ? "Checking..."
                : ""}
            </span>
          )}
          {pyodideError && !isPyodideLoading && (
            <span className={styles.pyodideError}>Pyodide Error!</span>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`${styles.quizFeedback} ${
            // Reusing quizFeedback for general feedback box style
            feedback.type === "correct"
              ? styles.correctFeedback
              : feedback.type === "incorrect"
              ? styles.incorrectFeedback
              : styles.errorFeedback // General error style
          }`}
        >
          <pre
            style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}
          >
            {feedback.message}
          </pre>
        </div>
      )}

      <h4>Turtle Output:</h4>
      <div className={styles.turtleCanvasContainer}>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight}>
          Your browser does not support the canvas element.
        </canvas>
      </div>
    </section>
  );
};

export default TurtleSection;
