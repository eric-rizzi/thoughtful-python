import { useRef, useEffect, useState, useCallback } from "react";
import type {
  JsTurtleCommand,
  UnitId,
  LessonId,
  SectionId,
} from "../types/data";
import { usePyodide } from "../contexts/PyodideContext";
import { useProgressActions } from "../stores/progressStore";
import { RealTurtleInstance, setupJsTurtle } from "../lib/turtleRenderer";

// This is the Python code that will be run in Pyodide to capture turtle commands.
const pythonCaptureModuleCode = `
import sys
import json

_js_turtle_commands_ = []

class CaptureTurtle:
    def __init__(self):
        self._speed = 6  # Default speed
        
    def _add_command(self, command_dict):
        _js_turtle_commands_.append(command_dict)
        
    def forward(self, distance): 
        self._add_command({'type': 'forward', 'distance': float(distance)})
        
    def backward(self, distance): 
        self.forward(-distance)
        
    def right(self, angle): 
        self._add_command({'type': 'right', 'angle': float(angle)})
        
    def left(self, angle): 
        self._add_command({'type': 'left', 'angle': float(angle)})
        
    def goto(self, x, y=None):
        if y is None and hasattr(x, '__iter__'):
            x, y = x
        # Send raw coordinates - conversion happens in JS
        self._add_command({'type': 'goto', 'x': float(x), 'y': float(y)})
        
    def penup(self): 
        self._add_command({'type': 'penup'})
        
    def pendown(self): 
        self._add_command({'type': 'pendown'})
        
    def color(self, *args):
        # Handle different color formats for pen color
        if len(args) == 1:
            color_value = args[0]
            if isinstance(color_value, str):
                self._add_command({'type': 'setPenColor', 'color': color_value})
            elif isinstance(color_value, tuple) and len(color_value) == 3:
                # Convert RGB tuple to hex
                r, g, b = color_value
                hex_color = '#{:02x}{:02x}{:02x}'.format(
                    int(r*255) if r <= 1 else int(r), 
                    int(g*255) if g <= 1 else int(g), 
                    int(b*255) if b <= 1 else int(b)
                )
                self._add_command({'type': 'setPenColor', 'color': hex_color})
        elif len(args) == 3:
            # RGB values as separate arguments
            r, g, b = args
            hex_color = '#{:02x}{:02x}{:02x}'.format(
                int(r*255) if r <= 1 else int(r), 
                int(g*255) if g <= 1 else int(g), 
                int(b*255) if b <= 1 else int(b)
            )
            self._add_command({'type': 'setPenColor', 'color': hex_color})
            
    def fillcolor(self, *args):
        # Handle fill color
        if len(args) == 1:
            color_value = args[0]
            if isinstance(color_value, str):
                self._add_command({'type': 'setFillColor', 'color': color_value})
            elif isinstance(color_value, tuple) and len(color_value) == 3:
                r, g, b = color_value
                hex_color = '#{:02x}{:02x}{:02x}'.format(
                    int(r*255) if r <= 1 else int(r), 
                    int(g*255) if g <= 1 else int(g), 
                    int(b*255) if b <= 1 else int(b)
                )
                self._add_command({'type': 'setFillColor', 'color': hex_color})
        elif len(args) == 3:
            # RGB values as separate arguments
            r, g, b = args
            hex_color = '#{:02x}{:02x}{:02x}'.format(
                int(r*255) if r <= 1 else int(r), 
                int(g*255) if g <= 1 else int(g), 
                int(b*255) if b <= 1 else int(b)
            )
            self._add_command({'type': 'setFillColor', 'color': hex_color})
            
    def begin_fill(self):
        self._add_command({'type': 'beginFill'})
        
    def end_fill(self):
        self._add_command({'type': 'endFill'})
        
    def width(self, width):
        self._add_command({'type': 'setPenSize', 'size': float(width)})
        
    def speed(self, speed=None):
        if speed is None:
            return self._speed
        # Convert string speed values
        speed_map = {
            'fastest': 0,
            'fast': 10,
            'normal': 6,
            'slow': 3,
            'slowest': 1
        }
        if isinstance(speed, str):
            speed = speed_map.get(speed.lower(), 6)
        self._speed = max(0, min(10, int(speed)))
        self._add_command({'type': 'setSpeed', 'speed': self._speed})
        
    def clear(self):
        self._add_command({'type': 'clear'})
    
    # Common aliases
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
  canvasRef: React.RefObject<HTMLDivElement | null>;
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
  const stopRequestedRef = useRef(false);
  const {
    pyodide,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { completeSection } = useProgressActions();

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect will run when Pyodide is ready and the canvasRef is attached.
    // The guards prevent it from running more than once.
    if (!isPyodideLoading && canvasRef.current && !jsTurtleRef.current) {
      const container = canvasRef.current;

      jsTurtleRef.current = setupJsTurtle(container);
    }

    // This cleanup function will run when the component unmounts.
    return () => {
      if (jsTurtleRef.current) {
        jsTurtleRef.current.destroy();
        jsTurtleRef.current = null;
      }
    };
  }, [canvasRef, isPyodideLoading]); // Dependency array is key to the logic

  // The main function that takes Python code and executes it
  const runTurtleCode = useCallback(
    async (codeToRun: string): Promise<JsTurtleCommand[]> => {
      if (isPyodideLoading || !pyodide) {
        setError("Python environment is not ready.");
        return [];
      }

      setIsRunning(true);
      setError(null);
      stopRequestedRef.current = false;

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

  const stopExecution = useCallback(() => {
    if (jsTurtleRef.current) {
      stopRequestedRef.current = true; // Set flag
      jsTurtleRef.current.stop();
    }
  }, []); // No dependencies needed

  return {
    runTurtleCode,
    stopExecution,
    isLoading: isRunning || isPyodideLoading,
    error: error || pyodideError,
  };
};
