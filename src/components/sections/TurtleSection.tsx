// src/components/sections/TurtleSection.tsx
// Simplified version focusing on basic commands (Approach 3)

import React, { useRef, useEffect, useState, useCallback } from "react";
import type {
  TurtleSection as TurtleSectionData,
  JsTurtleCommand,
} from "../../types/data"; // Import JsTurtleCommand
import styles from "./Section.module.css"; // Assuming styles are in Section.module.css
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import { useProgressActions } from "../../stores/progressStore";

// Import the real-turtle library (assuming it's installed via npm)
// The real-turtle library might not directly export a single 'Turtle' class for canvas.
// It's more of a command processing library. We'll need to integrate it.
// If 'real-turtle' itself directly draws to a canvas, it would have a specific setup.
// Based on typical JS turtle libs, they often take a canvas context.

// A helper to manage the real-turtle instance and drawing
interface RealTurtleInstance {
  // This is a simplified interface for what real-turtle might expose
  // to execute commands on a canvas. You might need to adapt based on its API.
  execute: (commands: JsTurtleCommand[]) => Promise<void>;
  reset: () => void;
  clear: () => void;
  // Other methods like setSpeed, etc.
}

// Helper to setup the JavaScript turtle context.
// This function will be responsible for initializing the JS turtle library
// and providing an interface to execute commands on the canvas.
const setupJsTurtle = (canvas: HTMLCanvasElement): RealTurtleInstance => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D rendering context for canvas.");
  }

  let x = canvas.width / 2; // Current turtle X position
  let y = canvas.height / 2; // Current turtle Y position
  let heading = 0; // Current turtle heading in degrees (0 = East, 90 = North)
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
    ctx.moveTo(x, y); // Move to start position
  };

  resetTurtleState(); // Initial setup

  // Function to execute a single JS turtle command
  const executeCommand = (command: JsTurtleCommand) => {
    const oldX = x;
    const oldY = y;

    switch (command.type) {
      case "goto":
        x = command.x;
        y = command.y;
        ctx.stroke(); // Finish any path segment
        ctx.beginPath(); // Start a new path
        ctx.moveTo(x, y); // Move pen to new location
        break;
      case "forward":
        const distance = command.distance;
        const rad = heading * (Math.PI / 180);
        x += distance * Math.cos(rad);
        y += distance * Math.sin(rad);

        if (penDown) {
          ctx.lineTo(x, y);
        } else {
          ctx.stroke(); // Finish previous path if pen was down
          ctx.beginPath(); // Start new path
          ctx.moveTo(x, y); // Move pen
        }
        break;
      case "left":
        heading = (heading + command.angle) % 360;
        break;
      case "right":
        heading = (heading - command.angle) % 360;
        break;
      case "penup":
        penDown = false;
        ctx.stroke(); // Finish any path segment before lifting pen
        break;
      case "pendown":
        penDown = true;
        ctx.beginPath(); // Start new path conceptually
        ctx.moveTo(x, y); // Move to current location
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
    resetTurtleState(); // Clear canvas and reset state before executing a new sequence
    ctx.lineWidth = penSize; // Ensure line width is set
    ctx.strokeStyle = penColor; // Ensure pen color is set
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const command of commands) {
      executeCommand(command);
      // Optional: Add a small delay to animate, if needed
      // await new Promise(resolve => setTimeout(resolve, 10));
    }
    ctx.stroke(); // Ensure the final path is drawn
  };

  return {
    execute: executeAllCommands,
    reset: resetTurtleState,
    clear: resetTurtleState, // Clear is essentially reset for this simplified model
  };
};

// --- Python Capture Module Code (as a string to be injected) ---
const pythonCaptureModuleCode = `
import sys
import json
import math

# List to store captured commands (JavaScript equivalent)
global _js_turtle_commands_
_js_turtle_commands_ = []

class CaptureTurtle:
    def __init__(self):
        self._heading = 0.0 # degrees, 0=East. (Pyodide's turtle starts east, matches JS canvas x-axis)
        self._x = 0.0
        self._y = 0.0
        self._pen_down = True
        self._color = "black" # Default color
        _js_turtle_commands_.clear() # Clear commands on new instance

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
        rad = math.radians(self._heading)
        new_x = self._x + distance * math.cos(rad)
        new_y = self._y - distance * math.sin(rad) # Y-axis inversion for screen coords vs math coords (turtle default is often positive Y up, canvas is positive Y down)
        # Note: The original JS canvas drawOnCanvas expects Y to increase downwards.
        # If Python's turtle defaults to Y-up, we need to invert the Y coordinate here.
        # Assuming Python's turtle \`forward\` will affect its internal (x,y) consistently.
        # If not explicitly stated, python's turtle usually has (0,0) at center, and +Y is up.
        # HTML Canvas has (0,0) at top-left, +Y is down. So, Y inversion might be needed for accurate translation.
        # Let's assume the \`drawOnCanvas\` will correctly interpret +Y downwards from its \`y\` (canvas origin).
        # The \`forward\` command itself just says "move", the canvas library will draw.
        # For \`real-turtle\` or similar, they usually handle internal coordinate systems.
        # My \`setupJsTurtle\` uses a canvas where Y increases downwards, so Pyodide's Y should reflect that.
        # If Python's internal turtle world assumes +Y is UP, then new_y for canvas should be \`_y - distance * math.sin(rad)\` or \`canvas_center_y - (_y_in_python_coords)\`.
        # For simplicity here, let's assume Pyodide's internal turtle \`_y\` is mapped to screen \`y\` where \`+y\` is down.
        # If not, the JS execution will need to adjust or Python needs to output absolute canvas coordinates.
        # For \`forward\`, the distance is just distance. \`goto\` would be the main place to map coordinates.
        # For now, \`forward\` just reports distance. The JS side will handle actual coord changes.

        self._add_command({'type': 'forward', 'distance': float(distance), 'penDown': self._pen_down, 'color': self._color})
        self._x = new_x
        self._y = new_y # This tracks Pythons internal position for subsequent commands.

    def backward(self, distance):
        if not isinstance(distance, (int, float)):
            raise TypeError("Distance must be a number")
        self.forward(-distance) # Backward is just forward with negative distance

    def left(self, angle):
        if not isinstance(angle, (int, float)):
            raise TypeError("Angle must be a number")
        self._heading = (self._heading + angle) % 360
        self._add_command({'type': 'left', 'angle': float(angle)})

    def right(self, angle):
        if not isinstance(angle, (int, float)):
            raise TypeError("Angle must be a number")
        self._heading = (self._heading - angle) % 360
        self._add_command({'type': 'right', 'angle': float(angle)})

    def penup(self):
        self._pen_down = False
        self._add_command({'type': 'penup'})

    def pendown(self):
        self._pen_down = True
        self._add_command({'type': 'pendown'})

    def clear(self):
        # Reset Python's internal state and then record the clear command
        self._heading = 0.0
        self._x = 0.0
        self._y = 0.0
        self._pen_down = True
        self._color = "black"
        _js_turtle_commands_.clear() # Also clear Python's command list
        self._add_command({'type': 'clear'})

    def set_pen_color(self, color):
        if not isinstance(color, str):
            raise TypeError("Color must be a string")
        self._color = color
        self._add_command({'type': 'setPenColor', 'color': color})

    # Aliases for common turtle commands for natural user code
    def fd(self, distance): self.forward(distance)
    def bk(self, distance): self.backward(distance)
    def back(self, distance): self.backward(distance)
    def lt(self, angle): self.left(angle)
    def rt(self, angle): self.right(angle)
    def pu(self): self.penup()
    def pd(self): self.pendown()

# --- Module Setup: Create a dummy turtle module for Pyodide ---
class TurtleModule:
    def __init__(self):
        self.Turtle = CaptureTurtle
        self.Screen = self._dummy_screen # Provide a dummy Screen for compatibility

    def _dummy_screen(self):
        # Return a dummy object for Screen for basic compatibility
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

# Inject our custom turtle module into Pyodide's sys.modules
sys.modules['turtle'] = TurtleModule()
sys.modules['animated_turtle'] = sys.modules['turtle'] # Alias for animated_turtle

# Final line executed by Pyodide will return the JSON representation of commands
# This relies on runPythonAsync returning the last expression's value.
json.dumps(_js_turtle_commands_)
`;

// --- Component ---
const TurtleSection: React.FC<{
  section: TurtleSectionData;
  lessonId: string;
}> = ({ section, lessonId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jsTurtleRef = useRef<RealTurtleInstance | null>(null); // Ref to hold the JS turtle instance

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

  // Effect to initialize the JS turtle when the canvas is ready
  useEffect(() => {
    if (canvasRef.current && !jsTurtleRef.current) {
      jsTurtleRef.current = setupJsTurtle(canvasRef.current);
    }
  }, []);

  // Effect to trigger JS turtle drawing when commands change
  useEffect(() => {
    if (jsTurtleRef.current && capturedJsCommands.length > 0) {
      jsTurtleRef.current.execute(capturedJsCommands);
    } else if (jsTurtleRef.current && capturedJsCommands.length === 0) {
      // If commands are empty, ensure canvas is cleared
      jsTurtleRef.current.clear();
    }
  }, [capturedJsCommands]);

  // --- Execution Logic ---
  const runCode = useCallback(
    async (codeToRun: string, isValidationRun: boolean = false) => {
      if (isPyodideLoading || !pyodide) {
        const message = "Python environment not ready.";
        console.warn(message);
        if (!isValidationRun) setFeedback({ message, type: "error" });
        return { commands: [], error: message };
      }

      if (!isValidationRun) {
        setIsRunning(true);
        setFeedback(null);
        setCapturedJsCommands([]); // Clear commands & canvas visually
        if (jsTurtleRef.current) {
          jsTurtleRef.current.clear(); // Ensure JS turtle is cleared immediately
        }
        await new Promise((resolve) => requestAnimationFrame(resolve)); // Wait for render cycle
      } else {
        setIsChecking(true);
      }

      let pyError: string | null = null;
      let parsedJsCommands: JsTurtleCommand[] = [];

      // Construct the full Python script to inject
      const fullPythonScript = `
${pythonCaptureModuleCode}
# --- User Code (indented to be part of the script) ---
try:
    ${codeToRun
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n")}
except Exception as e:
    import traceback
    print(f"PYTHON_EXECUTION_ERROR:: {e}\\n{traceback.format_exc()}")
    # Ensure commands list is cleared if there's a user code error
    _js_turtle_commands_ = [] # Reset for error state
finally:
    pass # Commands are collected in _js_turtle_commands_

# Output the commands as a JSON string
import json
json.dumps(_js_turtle_commands_)
`;

      try {
        console.log(`Running Python code (Validation: ${isValidationRun})...`);
        const resultProxy = await pyodide.runPythonAsync(fullPythonScript);

        // The result should be a JSON string of the commands
        if (typeof resultProxy === "string") {
          parsedJsCommands = JSON.parse(resultProxy) as JsTurtleCommand[];
        } else if (resultProxy && typeof resultProxy.toJs === "function") {
          // If it's a PyProxy, convert to JS object
          parsedJsCommands = resultProxy.toJs({
            dict_converter: Object.fromEntries,
            list_converter: Array.from,
          }) as JsTurtleCommand[];
          resultProxy.destroy(); // Clean up PyProxy
        } else {
          throw new Error("Unexpected Python output format from Pyodide.");
        }
      } catch (error) {
        console.error("Python execution error:", error);
        pyError = error instanceof Error ? error.message : String(error);
        // Check for our custom error marker
        const errorMatch = pyError.match(/PYTHON_EXECUTION_ERROR:: ([\s\S]*)/);
        if (errorMatch && errorMatch[1]) {
          pyError = errorMatch[1].trim();
        }
        parsedJsCommands = []; // Ensure no commands are processed on error
      } finally {
        if (!isValidationRun) setIsRunning(false);
        else setIsChecking(false);
      }

      console.log(
        `Captured ${parsedJsCommands.length} commands. Error: ${pyError}`
      );
      if (!isValidationRun && !pyError) {
        setCapturedJsCommands(parsedJsCommands); // This triggers the JS turtle drawing via useEffect
      } else if (!isValidationRun && pyError) {
        setFeedback({ message: `Error:\n${pyError}`, type: "error" });
      }

      return { commands: parsedJsCommands, error: pyError };
    },
    [pyodide, isPyodideLoading] // Dependencies
  );

  // --- Grading Logic ---
  const checkSolution = useCallback(async () => {
    setFeedback(null);
    setIsChecking(true);
    const executionResult = await runCode(code, true); // isValidationRun = true
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
    if (expectedCommands.length === 0) {
      setFeedback({
        message: `Validation criteria missing (expectedJsCommands) for this challenge in lesson data.`,
        type: "error",
      });
      return;
    }

    const { isCorrect, message } = compareJsTurtleCommandLists(
      userCommands,
      expectedCommands
    );
    setFeedback({
      message:
        message ||
        (isCorrect ? section.feedback.correct : section.feedback.incorrect),
      type: isCorrect ? "correct" : "incorrect",
    });
    if (isCorrect) {
      completeSection(lessonId, section.id);
    }
  }, [code, runCode, section, lessonId, completeSection]);

  // --- Comparison Function for JS Turtle Commands ---
  const compareJsTurtleCommandLists = (
    userCmds: JsTurtleCommand[],
    expectedCmds: JsTurtleCommand[]
  ): { isCorrect: boolean; message?: string } => {
    // console.log("Comparing JS Turtle Command Lists - User:", userCmds, "Expected:", expectedCmds);

    if (userCmds.length !== expectedCmds.length) {
      return {
        isCorrect: false,
        message: `Incorrect number of turtle actions. Expected ${expectedCmds.length}, Got ${userCmds.length}.`,
      };
    }

    const tolerance = 1e-5; // Tolerance for floating point comparisons

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

      // Compare based on command type
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
            userForward.penDown !== expForward.penDown ||
            userForward.color !== expForward.color
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
          const userColor = userCmd as Extract<
            JsTurtleCommand,
            { type: "setPenColor" }
          >;
          if (userColor.color !== expColor.color) {
            return {
              isCorrect: false,
              message: `Action ${i + 1} (setPenColor) mismatch: Expected '${
                expColor.color
              }', Got '${userColor.color}'.`,
            };
          }
          break;
        case "penup":
        case "pendown":
        case "clear":
          // No additional properties to compare for these simple commands
          break;
        default:
          // Should not happen if JsTurtleCommand is exhaustive
          return {
            isCorrect: false,
            message: `Unknown command type encountered during comparison: ${userCmd.type}`,
          };
      }
    }
    return { isCorrect: true, message: section.feedback.correct };
  };

  // --- Render ---
  const canvasWidth = 400;
  const canvasHeight = 300;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      {/* Instructions */}
      <div className={styles.turtleInstructions}>
        <h4>Instructions:</h4>
        <p>{section.instructions}</p>
      </div>
      {/* Optional: Simplified command reference */}
      <div className={styles.turtleCommandsReference}>
        <h4>Available Turtle Commands:</h4>
        <ul>
          <li>
            <code>turtle.Turtle().goto(x, y)</code>: Move turtle to absolute
            position.
          </li>
          <li>
            <code>turtle.Turtle().forward(distance)</code> /{" "}
            <code>turtle.Turtle().fd(distance)</code>: Move turtle forward.
          </li>
          <li>
            <code>turtle.Turtle().backward(distance)</code> /{" "}
            <code>turtle.Turtle().bk(distance)</code>: Move turtle backward.
          </li>
          <li>
            <code>turtle.Turtle().left(angle)</code> /{" "}
            <code>turtle.Turtle().lt(angle)</code>: Turn turtle left.
          </li>
          <li>
            <code>turtle.Turtle().right(angle)</code> /{" "}
            <code>turtle.Turtle().rt(angle)</code>: Turn turtle right.
          </li>
          <li>
            <code>turtle.Turtle().penup()</code> /{" "}
            <code>turtle.Turtle().pu()</code>: Lift the pen (stop drawing).
          </li>
          <li>
            <code>turtle.Turtle().pendown()</code> /{" "}
            <code>turtle.Turtle().pd()</code>: Put the pen down (start drawing).
          </li>
          <li>
            <code>turtle.Turtle().clear()</code>: Clear the drawing and reset
            turtle to center.
          </li>
          <li>
            <code>turtle.Turtle().set_pen_color("color_name")</code>: Set the
            pen color (e.g., "red", "blue", "#FF0000").
          </li>
          <li>
            <code>t = turtle.Turtle()</code>: Remember to create a turtle
            instance!
          </li>
        </ul>
      </div>

      {/* Editor and Controls */}
      <div className={styles.turtleEditorContainer}>
        <h4>Your Code:</h4>
        <CodeEditor
          value={code}
          onChange={setCode}
          readOnly={isRunning || isChecking}
          minHeight="150px" // Can be shorter for simpler code
        />
        <div className={styles.editorControls}>
          <button
            onClick={() => runCode(code)}
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
          {/* Status Indicators */}
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

      {/* Feedback Area */}
      {feedback && (
        <div
          className={`${styles.quizFeedback} ${
            feedback.type === "correct"
              ? styles.correctFeedback
              : feedback.type === "incorrect"
              ? styles.incorrectFeedback
              : styles.errorFeedback
          }`}
        >
          <pre
            style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}
          >
            {feedback.message}
          </pre>
        </div>
      )}

      {/* Canvas Container */}
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
