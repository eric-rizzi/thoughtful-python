import { useRef, useEffect, useState, useCallback } from "react";
import type {
  JsTurtleCommand,
  UnitId,
  LessonId,
  SectionId,
} from "../types/data";
import { usePyodide } from "../contexts/PyodideContext";
import { useProgressActions } from "../stores/progressStore";

// A helper function to create a delay for animation
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RealTurtleInstance {
  execute: (commands: JsTurtleCommand[]) => Promise<void>;
  reset: () => void;
  clear: () => void;
}

// This function sets up the canvas and defines how to draw the turtle commands.
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
  let penSize = 2;

  const resetTurtleState = () => {
    x = canvas.width / 2;
    y = canvas.height / 2;
    heading = 0;
    penDown = true;
    penColor = "black";
    penSize = 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  resetTurtleState();

  const executeCommand = (command: JsTurtleCommand) => {
    switch (command.type) {
      case "forward":
        const distance = command.distance;
        const rad = heading * (Math.PI / 180);
        x += distance * Math.cos(rad);
        y += distance * Math.sin(rad);
        if (penDown) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        break;
      case "left":
        heading = (heading - command.angle) % 360;
        break;
      case "right":
        heading = (heading + command.angle) % 360;
        break;
      case "penup":
        penDown = false;
        break;
      case "pendown":
        penDown = true;
        ctx.moveTo(x, y);
        break;
      case "setPenColor":
        penColor = command.color;
        ctx.strokeStyle = penColor;
        break;
      // Other commands like 'goto', 'clear' can be added here if needed.
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
    ctx.beginPath();
    ctx.moveTo(x, y);

    for (const command of commands) {
      executeCommand(command);
      await sleep(50); // Animation delay
    }
    ctx.stroke(); // Draw the final path
  };

  return {
    execute: executeAllCommands,
    reset: resetTurtleState,
    clear: resetTurtleState,
  };
};

// This is the Python code that will be run in Pyodide to capture turtle commands.
const pythonCaptureModuleCode = `
import sys
import json

_js_turtle_commands_ = []

class CaptureTurtle:
    def _add_command(self, command_dict):
        _js_turtle_commands_.append(command_dict)
    def forward(self, distance): self._add_command({'type': 'forward', 'distance': float(distance)})
    def backward(self, distance): self.forward(-distance)
    def right(self, angle): self._add_command({'type': 'right', 'angle': float(angle)})
    def left(self, angle): self._add_command({'type': 'left', 'angle': float(angle)})
    def penup(self): self._add_command({'type': 'penup'})
    def pendown(self): self._add_command({'type': 'pendown'})
    def color(self, color_str): self._add_command({'type': 'setPenColor', 'color': color_str})
    # Add aliases
    fd = forward
    bk = backward
    rt = right
    lt = left
    pu = penup
    pd = pendown

class TurtleModule:
    def __init__(self):
        self.Turtle = CaptureTurtle
        self.Screen = lambda: type('DummyScreen', (object,), {'exitonclick': lambda: None})()

sys.modules['turtle'] = TurtleModule()
`;

interface UseTurtleExecutionProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
}

export const useTurtleExecution = ({
  canvasRef,
  unitId,
  lessonId,
  sectionId,
}: UseTurtleExecutionProps) => {
  const jsTurtleRef = useRef<RealTurtleInstance | null>(null);
  const {
    pyodide,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { completeSection } = useProgressActions(); // Get the completion action

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the JS turtle renderer when the canvas is ready
  useEffect(() => {
    if (canvasRef.current && !jsTurtleRef.current) {
      jsTurtleRef.current = setupJsTurtle(canvasRef.current);
    }
  }, [canvasRef]);

  // The main function that takes Python code and executes it
  const runTurtleCode = useCallback(
    async (codeToRun: string): Promise<JsTurtleCommand[]> => {
      if (isPyodideLoading || !pyodide) {
        setError("Python environment is not ready.");
        return [];
      }

      setIsRunning(true);
      setError(null);
      if (jsTurtleRef.current) jsTurtleRef.current.clear();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const fullPythonScript = `
${pythonCaptureModuleCode}
_js_turtle_commands_.clear()
try:
${codeToRun
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
except Exception as e:
    import traceback
    print(f"PYTHON_EXECUTION_ERROR:: {e}\\n{traceback.format_exc()}")
    _js_turtle_commands_ = []
finally:
    pass
import json
json.dumps(_js_turtle_commands_)
`;

      let parsedJsCommands: JsTurtleCommand[] = [];
      try {
        const resultProxy = await pyodide.runPythonAsync(fullPythonScript);
        const rawOutput = resultProxy.toString();

        const errorMatch = rawOutput.match(
          /PYTHON_EXECUTION_ERROR:: ([\s\S]*)/
        );
        if (errorMatch && errorMatch[1]) {
          throw new Error(errorMatch[1].trim());
        }

        parsedJsCommands = JSON.parse(rawOutput);
        if (jsTurtleRef.current) {
          await jsTurtleRef.current.execute(parsedJsCommands);
        }

        // Mark the section as complete after a successful run
        completeSection(unitId, lessonId, sectionId);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Turtle execution error:", errorMessage);
        setError(errorMessage);
        parsedJsCommands = [];
      } finally {
        setIsRunning(false);
      }

      return parsedJsCommands;
    },
    [pyodide, isPyodideLoading, completeSection, unitId, lessonId, sectionId]
  );

  return {
    runTurtleCode,
    isLoading: isRunning || isPyodideLoading,
    error: error || pyodideError,
  };
};
