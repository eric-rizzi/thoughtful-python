// src/components/sections/TurtleSection.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import RealTurtle from "real-turtle"; // Import the library
import type { TurtleSection as TurtleSectionData } from "../../types/data";
import styles from "./Section.module.css";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import { useProgressActions } from "../../stores/progressStore";

// --- Interfaces ---
interface TurtleSectionProps {
  section: TurtleSectionData;
  lessonId: string;
}

// Interface for the JS functions exposed to Python
interface TurtleJsApi {
  forward: (distance: number) => Promise<void>;
  backward: (distance: number) => Promise<void>;
  right: (angle: number) => Promise<void>;
  left: (angle: number) => Promise<void>;
  penup: () => void;
  pendown: () => void;
  speed: (s: number) => void;
  pencolor: (color: string) => void;
  pensize: (size: number) => void;
  goto: (x: number, y: number) => Promise<void>;
  reset: () => Promise<void>; // Add a reset function
  get_state: () => any; // Function to potentially get state for grading
}

// --- Component ---
const TurtleSection: React.FC<TurtleSectionProps> = ({ section, lessonId }) => {
  const canvasRef = useRef<HTMLDivElement>(null); // Use a div as container
  const turtleInstanceRef = useRef<RealTurtle | null>(null);
  const apiRef = useRef<TurtleJsApi | null>(null); // Ref to store JS functions for Python

  const {
    runPythonCode,
    pyodide,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { completeSection } = useProgressActions();

  const [code, setCode] = useState(section.initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false); // State for validation check
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "correct" | "incorrect" | "error";
  } | null>(null);
  const [hasBeenRunOrChecked, setHasBeenRunOrChecked] = useState(false);

  // --- Initialize Turtle ---
  useEffect(() => {
    let turtle: RealTurtle | null = null;
    if (canvasRef.current && !turtleInstanceRef.current) {
      console.log(`Initializing RealTurtle for ${section.id}`);
      try {
        turtle = new RealTurtle(canvasRef.current); // Use defaults
        console.log("RealTurtle instance created with defaults.");
      } catch (initError) {
        console.error("Error creating RealTurtle instance:", initError);
        setFeedback({
          message: `Failed to initialize turtle graphics: ${initError}`,
          type: "error",
        });
        return; // Stop further setup if initialization fails
      }

      // --- Define JS functions for Python Proxy ---
      // Note: RealTurtle methods are async, so these need to be async
      apiRef.current = {
        // Wrap calls in a try-catch for robustness
        forward: async (distance) => {
          try {
            await turtle?.forward(distance);
          } catch (e) {
            console.error("Error in forward:", e);
            throw e;
          }
        },
        backward: async (distance) => {
          try {
            await turtle?.backward(distance);
          } catch (e) {
            console.error("Error in backward:", e);
            throw e;
          }
        },
        right: async (angle) => {
          try {
            await turtle?.right(angle);
          } catch (e) {
            console.error("Error in right:", e);
            throw e;
          }
        },
        left: async (angle) => {
          try {
            await turtle?.left(angle);
          } catch (e) {
            console.error("Error in left:", e);
            throw e;
          }
        },
        penup: () => {
          try {
            turtle?.penUp();
          } catch (e) {
            console.error("Error in penup:", e);
            throw e;
          }
        }, // Method names differ
        pendown: () => {
          try {
            turtle?.penDown();
          } catch (e) {
            console.error("Error in pendown:", e);
            throw e;
          }
        },
        speed: (s) => {
          try {
            turtle?.setSpeed(s);
          } catch (e) {
            console.error("Error in speed:", e);
            throw e;
          }
        }, // Assumes setSpeed exists
        pencolor: (color) => {
          try {
            turtle?.setPenColor(color);
          } catch (e) {
            console.error("Error in pencolor:", e);
            throw e;
          }
        }, // Assumes setPenColor exists
        pensize: (size) => {
          try {
            turtle?.setLineWidth(size);
          } catch (e) {
            console.error("Error in pensize:", e);
            throw e;
          }
        }, // Assumes setLineWidth exists
        goto: async (x, y) => {
          try {
            await turtle?.setPosition(x, y);
          } catch (e) {
            console.error("Error in goto:", e);
            throw e;
          }
        }, // Assumes setPosition exists
        reset: async () => {
          try {
            // Get the current turtle instance
            const turtle = turtleInstanceRef.current;
            if (!turtle) {
              console.error("Reset called but turtle instance is null");
              return;
            }

            // 1. Clear drawings
            turtle.clear(); // Use the library's clear method

            // 2. Reset pen state (lift pen, set defaults, put down)
            turtle.penUp(); // Lift pen before moving
            // --- Check real-turtle docs for exact default values ---
            turtle.setPenColor("black"); // Assuming 'black' is default
            turtle.setLineWidth(1); // Assuming 1 is default
            turtle.penDown(); // Pen back down for drawing

            // 3. Reset position and orientation
            // Await setPosition as it likely involves async movement/redrawing
            await turtle.setPosition(0, 0); // Assuming (0,0) is center
            turtle.setAngle(0); // Assuming 0 degrees points East (right)

            console.log("Turtle Reset Manually via API");
          } catch (e) {
            // Log the error more specifically
            console.error("Error during manual turtle reset:", e);
            // Optional: Provide user feedback about reset error
            // setFeedback({ message: `Failed to reset turtle: ${e}`, type: 'error' });
            throw e; // Re-throw so the calling function knows about the error
          }
        },
        get_state: () => {
          // Example: How to get data for grading
          if (!turtle) return null;
          try {
            // Check real-turtle docs for available methods. These are guesses:
            const state = {
              // position: turtle.getPosition ? turtle.getPosition() : null, // e.g., { x, y }
              // angle: turtle.getAngle ? turtle.getAngle() : null,
              // penDown: turtle.isPenDown ? turtle.isPenDown() : null,
              path: turtle.getPath ? turtle.getPath() : [], // IMPORTANT for grading path data
            };
            console.log("JS get_state called, returning:", state);
            return state;
          } catch (e) {
            console.error("Error in get_state:", e);
            return { error: String(e) };
          }
        },
      };
    }

    // Cleanup function
    return () => {
      console.log(`Cleaning up RealTurtle for ${section.id}`);
      // `real-turtle` might have its own cleanup method, check docs
      // turtle?.destroy(); // Hypothetical cleanup
      if (canvasRef.current) {
        canvasRef.current.innerHTML = ""; // Clear the container
      }
      turtleInstanceRef.current = null;
      apiRef.current = null;
    };
  }, [section.id]); // Re-run if section.id changes

  // --- Python Proxy Code ---
  const pythonProxyCode = `
import js
import sys
import asyncio

# Simple proxy class mimicking Python's turtle
class Turtle:
    def __init__(self):
        # Store the JS API functions provided from React
        self._api = js.turtle_api

    # Define methods that call the corresponding JS functions
    # Make drawing methods async to match real-turtle's async nature
    async def forward(self, distance):
        await self._api.forward(distance)

    async def backward(self, distance):
        await self._api.backward(distance)

    async def right(self, angle):
        await self._api.right(angle)

    async def left(self, angle):
        await self._api.left(angle)

    def penup(self):
        self._api.penup()

    def pendown(self):
        self._api.pendown()

    def speed(self, s):
        # Map Python speed (0-10) to real-turtle speed (assuming 0-10)
        # 0 often means 'fastest' in Python turtle
        mapped_speed = s if s != 0 else 10 # Or check real-turtle docs for fastest value
        self._api.speed(mapped_speed)

    def pencolor(self, *args):
        # Basic color name handling
        if len(args) == 1 and isinstance(args[0], str):
            self._api.pencolor(args[0])
        # Add handling for RGB tuples if needed

    def pensize(self, size):
        self._api.pensize(size)

    async def goto(self, x, y=None):
         # Handle both (x, y) and Vec2D if needed, basic version:
         if y is not None:
             await self._api.goto(x, y)
         # Add handling for single tuple/list argument if desired

    async def reset(self):
        await self._api.reset()

    def get_state(self):
        # This calls the JS get_state function
        return self._api.get_state()

# Make the Turtle class available for import
# (This assumes user code will do 'from turtle import Turtle' or 'import turtle')
class TurtleModule:
    def __init__(self):
        self.Turtle = Turtle
        # Add other turtle functions if needed (e.g., Screen, setup)
        # For simplicity, just providing the Turtle class for now

# Add module to sys.modules BEFORE user code runs it
sys.modules['turtle'] = TurtleModule()
sys.modules['animated_turtle'] = TurtleModule() # Allow original import too

print("Proxy turtle module loaded.")
`;

  // --- Execution Logic ---
  const runCode = useCallback(
    async (codeToRun: string, isValidationRun: boolean = false) => {
      if (
        isPyodideLoading ||
        !pyodide ||
        !apiRef.current ||
        !turtleInstanceRef.current
      ) {
        // Only set feedback on normal run, not validation run if env not ready
        if (!isValidationRun) {
          setFeedback({
            message: "Python environment is not ready",
            type: "error",
          });
        }
        return null;
      }

      // Expose the JS API functions to Pyodide
      pyodide.globals.set("turtle_api", apiRef.current);

      setIsRunning(true);
      if (!isValidationRun) {
        setFeedback(null); // Clear previous feedback only on normal run
        setHasBeenRunOrChecked(true);
        // Reset turtle before running - wrap in try/catch
        try {
          await apiRef.current.reset();
        } catch (resetError) {
          console.error("Error during pre-run reset:", resetError);
          setFeedback({
            message: `Failed to reset turtle before run: ${resetError}`,
            type: "error",
          });
          setIsRunning(false);
          return null; // Stop execution if reset fails
        }
      } else {
        setIsChecking(true);
      }

      let executionResult = null;
      let pyError: string | null = null;

      try {
        // Load the proxy module first
        await pyodide.runPythonAsync(pythonProxyCode);
        console.log("Running user turtle code...");
        // Run the user's code
        executionResult = await pyodide.runPythonAsync(codeToRun);
        console.log("User turtle code finished.");

        // Wait a tiny bit for any final async drawing calls to settle (might need adjustment)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Python execution error:", error);
        pyError = error instanceof Error ? error.message : String(error);
        if (!isValidationRun) {
          // Only show error feedback on normal run
          setFeedback({ message: `Error: ${pyError}`, type: "error" });
        }
      } finally {
        setIsRunning(false);
        if (isValidationRun) {
          setIsChecking(false);
        }
      }
      // Return the result (might be None, or could be path data if validation code returns it)
      // Also return error status
      return { result: executionResult, error: pyError };
    },
    [pyodide, isPyodideLoading, pythonProxyCode]
  ); // Removed completeSection dependency

  // --- Grading Logic ---
  const checkSolution = useCallback(async () => {
    setFeedback(null);
    setHasBeenRunOrChecked(true);

    // 1. Run user code to get final state/path (without resetting canvas visually)
    // We need the 'get_state' function in the JS API and Python proxy
    const userCodeWithStateReturn = `${code}\n\nt = Turtle()\nfinal_state = t.get_state()\nfinal_state # Return the state`;
    const execution = await runCode(userCodeWithStateReturn, true); // Pass true for validation run

    if (execution?.error) {
      setFeedback({
        message: `Error running code for validation: ${execution.error}`,
        type: "error",
      });
      return;
    }

    // The result should be the state object returned from Python
    // Need to convert PyodideProxy to JS object
    let userResultState: any = null;
    if (execution?.result && typeof execution.result.toJs === "function") {
      userResultState = execution.result.toJs({
        dict_converter: Object.fromEntries,
      });
    } else {
      userResultState = execution?.result; // Fallback if not a proxy
    }

    console.log("User Result State for Validation:", userResultState);

    if (!userResultState || !userResultState.path) {
      setFeedback({
        message: "Could not retrieve turtle path data for validation.",
        type: "error",
      });
      return;
    }

    // 2. Define or load the expected result (e.g., path data)
    // This needs to be stored alongside the challenge definition in lesson_6.json
    // For now, let's assume a placeholder structure.
    // TODO: Define expected path structure based on real-turtle's getPath() output
    const expectedPath = section.validationCriteria?.expectedPath || []; // Get from section data

    // 3. Compare userResultState.path with expectedPath
    const isCorrect = comparePaths(
      userResultState.path,
      expectedPath,
      section.validationCriteria
    ); // Implement comparePaths

    // 4. Provide feedback
    setFeedback({
      message: isCorrect
        ? section.feedback.correct
        : section.feedback.incorrect,
      type: isCorrect ? "correct" : "incorrect",
    });

    // 5. Mark complete if correct
    if (isCorrect) {
      completeSection(lessonId, section.id);
    }
  }, [code, runCode, section, lessonId, completeSection]);

  // --- Comparison Function (Placeholder) ---
  // TODO: Implement this based on the actual structure of `real-turtle`'s path data
  // and the validation criteria defined in the JSON.
  const comparePaths = (
    userPath: any[],
    expectedPath: any[],
    criteria: any
  ): boolean => {
    console.log(
      "Comparing Paths - User:",
      userPath,
      "Expected:",
      expectedPath,
      "Criteria:",
      criteria
    );
    // Example validation based on shape type (needs refinement)
    if (criteria.type === "shape") {
      if (criteria.shape === "rectangle") {
        // Basic check: 4 segments? Correct lengths? (Approximate)
        const width = criteria.width ?? 0;
        const height = criteria.height ?? 0;
        const tolerance = 5; // Pixel tolerance
        if (!Array.isArray(userPath) || userPath.length !== 4) return false;
        // Count segments matching width/height approximately
        const widths = userPath.filter(
          (p) => Math.abs(p?.length - width) < tolerance
        ).length;
        const heights = userPath.filter(
          (p) => Math.abs(p?.length - height) < tolerance
        ).length;
        return widths === 2 && heights === 2; // Simplified check
      } else if (criteria.shape === "octagon") {
        // Basic check: 8 segments? Correct length?
        const sideLength = criteria.sideLength ?? 0;
        const tolerance = 5;
        if (!Array.isArray(userPath) || userPath.length !== 8) return false;
        return userPath.every(
          (p) => Math.abs(p?.length - sideLength) < tolerance
        ); // Simplified check
      }
    }
    // Fallback: Basic length comparison (likely insufficient)
    if (!Array.isArray(userPath) || !Array.isArray(expectedPath)) return false;
    return userPath.length === expectedPath.length;
  };

  // --- Render ---
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      {/* Instructions & Commands */}
      <div className={styles.turtleInstructions}>
        <h4>Instructions:</h4>
        <p>{section.instructions}</p>
      </div>
      {section.turtleCommands && (
        <div className={styles.turtleCommandsReference}>
          <h4>Available Commands (Example):</h4>
          <ul>
            {section.turtleCommands.map((cmd) => (
              <li key={cmd.name}>
                <code>t.{cmd.name}</code> - {cmd.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor and Controls */}
      <div className={styles.turtleEditorContainer}>
        <h4>Your Code:</h4>
        <CodeEditor
          value={code}
          onChange={setCode}
          readOnly={isRunning || isChecking}
          minHeight="200px"
        />
        <div className={styles.editorControls}>
          {console.log(turtleInstanceRef)}
          <button
            onClick={() => runCode(code)}
            disabled={
              isRunning ||
              isChecking ||
              isPyodideLoading ||
              !!pyodideError ||
              !turtleInstanceRef.current
              // !apiRef.current
            }
            className={styles.runButton} // Use common run button style
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
          <button
            onClick={checkSolution}
            disabled={
              isRunning ||
              isChecking ||
              isPyodideLoading ||
              !!pyodideError ||
              !turtleInstanceRef.current ||
              !apiRef.current ||
              !hasBeenRunOrChecked
            }
            className={styles.testButton} // Use common test button style
          >
            {isChecking ? "Checking..." : "Check Solution"}
          </button>
          {isPyodideLoading && (
            <span className={styles.pyodideStatus}>Python Loading...</span>
          )}
          {pyodideError && (
            <span className={styles.pyodideError}>Pyodide Error!</span>
          )}
        </div>
      </div>

      {/* Feedback Area */}
      {feedback && (
        <div
          className={`${styles.quizFeedback} ${
            // Reuse quiz feedback styles
            feedback.type === "correct"
              ? styles.correctFeedback
              : feedback.type === "incorrect"
              ? styles.incorrectFeedback
              : styles.errorFeedback /* Add an error style if needed */
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Canvas Container */}
      <h4>Turtle Output:</h4>
      <div
        ref={canvasRef}
        className={styles.turtleCanvasContainer}
        id={`${section.id}-canvas-container`}
      >
        {/* RealTurtle will create its canvas inside this div */}
      </div>
    </section>
  );
};

export default TurtleSection;
