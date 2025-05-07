// src/components/sections/TurtleSection.tsx
// Simplified version focusing on basic commands (Approach 3)

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { TurtleSection as TurtleSectionData } from "../../types/data";
import styles from "./Section.module.css"; // Assuming styles are in Section.module.css
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import { useProgressActions } from "../../stores/progressStore";

// --- Interfaces ---
interface TurtleSectionProps {
  section: TurtleSectionData;
  lessonId: string;
}

// Simplified Command structure
type TurtleCommand =
  | { type: "forward"; distance: number }
  | { type: "left" | "right"; angle: number }
  | { type: "penup" | "pendown" };

// --- Simplified Python Capture Code ---
const pythonCaptureModuleCode = `
import sys
import math

# List to store captured commands globally
global _turtle_commands_
_turtle_commands_ = []

class CaptureTurtle:
    # Captures basic turtle commands

    def __init__(self):
        self._heading = 0.0 # degrees, 0=East
        # Internal position tracking IS necessary if you want 'forward'
        # to work correctly after rotations. JS replay also tracks position.
        self._x = 0.0
        self._y = 0.0
        self._pen_down = True
        # Clear commands only when a new turtle is created
        _turtle_commands_.clear()
        print("CaptureTurtle Initialized, commands cleared")


    def _add_command(self, command_dict):
        _turtle_commands_.append(command_dict)
        # print(f"Captured: {command_dict}") # Optional: Debug log

    def forward(self, distance):
        # Basic type check
        if not isinstance(distance, (int, float)): raise TypeError("Distance must be a number")
        # Need to update internal position for heading calculations, even if not directly used
        rad = math.radians(self._heading)
        self._x += distance * math.cos(rad)
        self._y += distance * math.sin(rad)
        self._add_command({'type': 'forward', 'distance': float(distance)})

    # backward can be added later if needed, by calling forward(-distance)

    def right(self, angle):
        if not isinstance(angle, (int, float)): raise TypeError("Angle must be a number")
        self._heading = (self._heading - angle) % 360
        self._add_command({'type': 'right', 'angle': float(angle)})

    def left(self, angle):
        if not isinstance(angle, (int, float)): raise TypeError("Angle must be a number")
        self._heading = (self._heading + angle) % 360
        self._add_command({'type': 'left', 'angle': float(angle)})

    def penup(self):
        self._pen_down = False
        self._add_command({'type': 'penup'})

    def pendown(self):
        self._pen_down = True
        self._add_command({'type': 'pendown'})

    def isdown(self): # Useful helper
        return self._pen_down

    # --- Placeholder/Dummy methods for compatibility if user code calls them ---
    def speed(self, *args): pass # Ignore speed for now
    def pencolor(self, *args): pass # Ignore color
    def pensize(self, *args): pass # Ignore size
    def goto(self, *args): print("Warning: goto() is not implemented in this simplified version.") # Warn user
    def setheading(self, *args): print("Warning: setheading() is not implemented in this simplified version.")
    def position(self): return (self._x, self._y) # Return internal state
    def heading(self): return self._heading
    def clear(self): _turtle_commands_.clear(); self.__init__() # Basic clear
    def reset(self): _turtle_commands_.clear(); self.__init__() # Basic reset

# --- Module Setup ---
class TurtleModule: Turtle = CaptureTurtle
sys.modules['turtle'] = TurtleModule()
sys.modules['animated_turtle'] = TurtleModule() # Alias

print("Simplified Capture turtle module loaded.")
`;

// --- Component ---
const TurtleSection: React.FC<TurtleSectionProps> = ({ section, lessonId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    runPythonCode,
    pyodide,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { completeSection } = useProgressActions();

  const [code, setCode] = useState(section.initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false); // Still needed to disable buttons during drawing
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "correct" | "incorrect" | "error";
  } | null>(null);
  const [commands, setCommands] = useState<TurtleCommand[]>([]);
  // Removed replaySpeed state
  const animationFrameRef = useRef<number | null>(null);

  // --- Simplified Canvas Drawing Logic ---
  const drawOnCanvas = useCallback(
    (cmds: TurtleCommand[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      setIsReplaying(true); // Still useful to disable buttons

      // Turtle state for JS replay
      const originX = canvas.width / 2;
      const originY = canvas.height / 2;
      let x = originX;
      let y = originY;
      let heading = 0; // Degrees, 0 = East
      let penDown = true;
      // Keep basic color/size fixed for now
      const penColor = "black";
      const penSize = 1;

      // Clear canvas and set initial state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = penSize;
      ctx.strokeStyle = penColor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);

      console.log(`Drawing ${cmds.length} simplified commands.`);

      // Process all commands almost instantly (minimal delay per frame)
      let currentBatch = 0;
      const batchSize = 5; // Draw a few commands per frame for smoothness

      const replayBatch = () => {
        const batchEnd = Math.min(currentBatch + batchSize, cmds.length);
        for (let i = currentBatch; i < batchEnd; i++) {
          const command = cmds[i];
          const startCanvasX = x;
          const startCanvasY = y;

          switch (command.type) {
            case "forward": // Only handle forward now
              const distance = command.distance;
              const rad = heading * (Math.PI / 180);
              const endCanvasX = x + distance * Math.cos(rad);
              const endCanvasY = y + distance * Math.sin(rad); // Canvas Y increases downwards
              if (penDown) {
                // Only move/draw if pen is down
                ctx.lineTo(endCanvasX, endCanvasY);
              } else {
                // If pen is up, just move the context's current point
                ctx.moveTo(endCanvasX, endCanvasY);
              }
              x = endCanvasX;
              y = endCanvasY;
              break;
            case "left":
              heading = heading + command.angle;
              break;
            case "right":
              heading = heading - command.angle;
              break;
            case "penup":
              penDown = false;
              // If there was a path being built, stroke it before lifting pen
              ctx.stroke();
              ctx.beginPath(); // Start new path conceptually
              ctx.moveTo(x, y); // Move to current location
              break;
            case "pendown":
              penDown = true;
              ctx.moveTo(x, y); // Start new path segment from current pos
              break;
          }
        }
        ctx.stroke(); // Stroke any path segments drawn in this batch

        currentBatch = batchEnd;

        if (currentBatch < cmds.length) {
          animationFrameRef.current = requestAnimationFrame(replayBatch); // Process next batch
        } else {
          setIsReplaying(false); // Finished
          animationFrameRef.current = null;
          console.log("Simplified replay finished.");
        }
      };
      // Start the batched replay
      animationFrameRef.current = requestAnimationFrame(replayBatch);
    },
    [animationFrameRef]
  ); // Dependency

  // Effect to trigger replay when commands change
  useEffect(() => {
    if (commands.length > 0) {
      drawOnCanvas(commands);
    } else {
      // Clear canvas if commands are cleared
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
      }
    }
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [commands, drawOnCanvas]);

  // --- Execution Logic ---
  const runCode = useCallback(
    async (codeToRun: string, isValidationRun: boolean = false) => {
      if (isPyodideLoading || !pyodide) {
        const message = "Python environment not ready.";
        console.warn(message);
        if (!isValidationRun) setFeedback({ message, type: "error" });
        return { commands: [], error: message };
      }

      // Stop any ongoing replay
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        setIsReplaying(false);
      }

      if (!isValidationRun) {
        setIsRunning(true);
        setFeedback(null);
        setCommands([]); // Clear commands & canvas
        await new Promise((resolve) => requestAnimationFrame(resolve)); // Wait for clear
      } else {
        setIsChecking(true);
      }

      let pyError: string | null = null;
      let capturedCommands: TurtleCommand[] = [];

      // Simplified execution string
      const fullCodeToExecute = `
${pythonCaptureModuleCode}
# --- User Code ---
import asyncio # Keep for potential user use, though our wrapper isn't async now
global _turtle_commands_

# Clear commands before running user code
_turtle_commands_.clear()
try:
    # Directly execute user code (no async wrapper needed if proxy isn't async)
${codeToRun
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
except Exception as e:
    print(f"PYTHON_EXECUTION_ERROR:: {e}")
finally:
    pass # Commands are in the global list

# --- Final Result ---
_turtle_commands_
# --- End User Code ---
        `;

      try {
        console.log(`Running Python code (Validation: ${isValidationRun})...`);
        const resultProxy = await pyodide.runPythonAsync(fullCodeToExecute);
        console.log("Python execution finished.");

        if (resultProxy && typeof resultProxy.toJs === "function") {
          capturedCommands = resultProxy.toJs({
            list_converter: Array.from,
          }) as TurtleCommand[];
          resultProxy.destroy();
        } else {
          capturedCommands = [];
        }
      } catch (error) {
        console.error("Python execution error:", error);
        pyError = error instanceof Error ? error.message : String(error);
        if ((error as any)?.message?.includes("Traceback")) {
          pyError = (error as any).message;
        }
        capturedCommands = [];
      } finally {
        if (!isValidationRun) setIsRunning(false);
        else setIsChecking(false);
      }

      console.log(
        `Captured ${capturedCommands.length} commands. Error: ${pyError}`
      );
      if (!isValidationRun && !pyError) {
        setCommands(capturedCommands); // Trigger replay
      }
      if (!isValidationRun && pyError) {
        setFeedback({ message: `Error:\n${pyError}`, type: "error" });
      }

      return { commands: capturedCommands, error: pyError };
    },
    [pyodide, isPyodideLoading, pythonCaptureModuleCode]
  ); // Dependencies

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

    // Get expected commands (MUST be defined in lesson_6.json)
    const expectedCommands = section.validationCriteria?.expectedCommands || [];
    if (expectedCommands.length === 0) {
      setFeedback({
        message: `Validation criteria missing (expectedCommands) for this challenge.`,
        type: "error",
      });
      return;
    }

    const { isCorrect, message } = compareCommandLists(
      userCommands,
      expectedCommands,
      section.validationCriteria
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

  // --- Simplified Comparison Function ---
  const compareCommandLists = (
    userCmds: TurtleCommand[],
    expectedCmds: TurtleCommand[],
    criteria: any
  ): { isCorrect: boolean; message?: string } => {
    console.log(
      "Comparing Simplified Command Lists - User:",
      userCmds,
      "Expected:",
      expectedCmds
    );
    if (userCmds.length !== expectedCmds.length) {
      return {
        isCorrect: false,
        message: `Incorrect number of turtle actions (Expected ${expectedCmds.length}, Got ${userCmds.length}). ${section.feedback.incorrect}`,
      };
    }
    const tolerance = 1.0; // Slightly higher tolerance might be needed now

    for (let i = 0; i < expectedCmds.length; i++) {
      const userCmd = userCmds[i];
      const expectedCmd = expectedCmds[i];
      if (!userCmd || !expectedCmd || userCmd.type !== expectedCmd.type) {
        return {
          isCorrect: false,
          message: `Action ${i + 1} type mismatch: Expected '${
            expectedCmd?.type
          }', Got '${userCmd?.type}'. ${section.feedback.incorrect}`,
        };
      }
      switch (userCmd.type) {
        case "forward": // Only compare distance for forward
          if (
            Math.abs(
              userCmd.distance - (expectedCmd as typeof userCmd).distance
            ) > tolerance
          ) {
            return {
              isCorrect: false,
              message: `Action ${
                i + 1
              } (forward) distance mismatch: Expected ${+(
                expectedCmd as typeof userCmd
              ).distance.toFixed(1)}, Got ${+userCmd.distance.toFixed(1)}. ${
                section.feedback.incorrect
              }`,
            };
          }
          break;
        case "left":
        case "right": // Only compare angle
          if (
            Math.abs(userCmd.angle - (expectedCmd as typeof userCmd).angle) >
            tolerance
          ) {
            return {
              isCorrect: false,
              message: `Action ${i + 1} (${
                userCmd.type
              }) angle mismatch: Expected ${+(
                expectedCmd as typeof userCmd
              ).angle.toFixed(1)}, Got ${+userCmd.angle.toFixed(1)}. ${
                section.feedback.incorrect
              }`,
            };
          }
          break;
        // No arguments to compare for penup, pendown
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
        <h4>Available Commands:</h4>
        <ul>
          <li>
            <code>turtle.forward(distance)</code>
          </li>
          <li>
            <code>turtle.left(angle)</code>
          </li>
          <li>
            <code>turtle.right(angle)</code>
          </li>
          <li>
            <code>turtle.penup()</code>
          </li>
          <li>
            <code>turtle.pendown()</code>
          </li>
        </ul>
      </div>

      {/* Editor and Controls */}
      <div className={styles.turtleEditorContainer}>
        <h4>Your Code:</h4>
        <CodeEditor
          value={code}
          onChange={setCode}
          readOnly={isRunning || isReplaying || isChecking}
          minHeight="150px" // Can be shorter for simpler code
        />
        <div className={styles.editorControls}>
          <button
            onClick={() => runCode(code)}
            disabled={
              isRunning ||
              isReplaying ||
              isChecking ||
              isPyodideLoading ||
              !!pyodideError
            }
            className={styles.runButton}
          >
            {isRunning
              ? "Executing..."
              : isReplaying
              ? "Drawing..."
              : "Run Code"}
          </button>
          <button
            onClick={checkSolution}
            disabled={
              isRunning ||
              isReplaying ||
              isChecking ||
              isPyodideLoading ||
              !!pyodideError
            }
            className={styles.testButton}
          >
            {isChecking ? "Checking..." : "Check Solution"}
          </button>
          {/* Status Indicators */}
          {(isPyodideLoading || isRunning || isReplaying || isChecking) && (
            <span className={styles.pyodideStatus}>
              {isPyodideLoading
                ? "Python Loading..."
                : isRunning
                ? "Executing..."
                : isReplaying
                ? "Drawing..."
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
