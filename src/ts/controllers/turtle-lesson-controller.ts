/**
 * Controller for Turtle Graphics lessons
 */
import { DynamicLessonController } from './dynamic-lesson-controller';
import { markSectionCompleted } from '../utils/progress-utils';
import { LessonSection } from '../utils/lesson-loader';
import { escapeHTML } from '../utils/pyodide-utils';
import { showError } from '../utils/html-components';

export interface TurtleSection extends LessonSection {
  kind: 'Turtle';
  instructions: string;
  initialCode: string;
  validationCriteria: {
    type: string;
    shape?: string;
    width?: number;
    height?: number;
    sideLength?: number;
    [key: string]: any;
  };
  turtleCommands?: Array<{
    name: string;
    description: string;
  }>;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export abstract class TurtleLessonController extends DynamicLessonController {
  protected userPrograms: Map<string, string> = new Map();
  protected pyodideReady: boolean = false;
  
  /**
   * Initialize the turtle controller and set up Pyodide
   */
  protected async initializeLesson(): Promise<void> {
    // Load saved programs if they exist
    this.loadSavedPrograms();
    
    // Initialize Pyodide
    try {
      await this.initializePyodide();
      this.pyodideReady = true;
    } catch (error) {
      console.error('Failed to initialize Pyodide:', error);
      showError('Failed to load Python environment for Turtle Graphics. Please refresh the page and try again.');
    }
  }
  
  /**
   * Initialize Pyodide for running Python code
   */
  private async initializePyodide(): Promise<void> {
    // Check if Pyodide is already loaded
    if ((window as any).pyodide) {
      return;
    }
    
    // Show loading status
    const statusElement = document.createElement('div');
    statusElement.className = 'pyodide-status';
    statusElement.textContent = 'Loading Python environment...';
    document.body.appendChild(statusElement);
    
    try {
      // Load Pyodide script if not already loaded
      if (!(window as any).loadPyodide) {
        await this.loadPyodideScript();
      }
      
      // Initialize Pyodide
      (window as any).pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      });
      
      // Set up the turtle module
      await this.setupTurtleModule();
      
      statusElement.textContent = 'Python environment loaded!';
      setTimeout(() => {
        statusElement.remove();
      }, 2000);
    } catch (error) {
      statusElement.textContent = 'Failed to load Python environment.';
      setTimeout(() => {
        statusElement.remove();
      }, 5000);
      throw error;
    }
  }
  
  /**
   * Load the Pyodide script from CDN
   */
  private loadPyodideScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });
  }
  
  /**
   * Set up the AnimatedTurtle module for Python
   */
  private async setupTurtleModule(): Promise<void> {
    const pyodide = (window as any).pyodide;
    
    // Set up input function override and stdout capture
    await pyodide.runPythonAsync(`
      import sys
      import builtins
      from io import StringIO
      
      # Override the input function
      original_input = builtins.input
      def custom_input(prompt=''):
          from js import prompt as js_prompt
          result = js_prompt(prompt)
          if result is None:
              result = ""
          return result
      builtins.input = custom_input
      
      # Create a custom stdout capture class
      class WebConsole:
          def __init__(self):
              self.buffer = StringIO()
          
          def write(self, text):
              self.buffer.write(text)
              return len(text)
          
          def flush(self):
              pass
          
          def getvalue(self):
              return self.buffer.getvalue()
      
      # Create the console instance
      console = WebConsole()
      
      # Create the animated_turtle module
      import sys
      from js import document, window, Object
      import math
      import asyncio
      
      class AnimatedTurtle:
          def __init__(self, canvas_id=None):
              # Create a canvas if it doesn't exist
              self.canvas_id = canvas_id or "turtle-canvas-" + str(id(self))
              self.width = 400
              self.height = 300
              self.animation_speed = 5  # Pixels per frame
              self.turn_speed = 5  # Degrees per frame
              
              # Create canvas element if it doesn't exist yet
              canvas = document.getElementById(self.canvas_id)
              if canvas is None:
                  canvas = document.createElement("canvas")
                  canvas.id = self.canvas_id
                  canvas.width = self.width
                  canvas.height = self.height
                  canvas.style.border = "1px solid #ddd"
                  
                  # If a container exists, append to it, otherwise to body
                  container = document.querySelector(".turtle-canvas-container")
                  if container:
                      container.appendChild(canvas)
                  else:
                      document.body.appendChild(canvas)
              
              # Get 2D context
              self.ctx = canvas.getContext("2d")
              
              # Initialize turtle state
              self.x = self.width / 2
              self.y = self.height / 2
              self.heading = 0  # 0 degrees = east
              self.pen_down = True
              self.pen_color = "blue"
              self.pen_size = 2
              
              # Initialize path tracking for validation
              self.path_segments = []
              self.current_segment_start = (self.x, self.y)
              
              # Clear canvas
              self.clear()
              
              # Draw initial turtle position
              self.draw_turtle()
          
          def clear(self):
              """Clear the canvas"""
              self.ctx.fillStyle = "white"
              self.ctx.fillRect(0, 0, self.width, self.height)
              self.path_segments = []
              self.current_segment_start = (self.x, self.y)
          
          async def forward(self, distance):
              """Move forward with animation"""
              # Calculate target position
              target_x = self.x + distance * math.cos(math.radians(self.heading))
              target_y = self.y + distance * math.sin(math.radians(self.heading))
              
              # Calculate number of steps based on distance and speed
              steps = max(1, abs(int(distance / self.animation_speed)))
              
              # Animate movement
              for i in range(steps):
                  # Calculate next position
                  progress = (i + 1) / steps
                  new_x = self.x + (target_x - self.x) * progress
                  new_y = self.y + (target_y - self.y) * progress
                  
                  # Draw line segment if pen is down
                  if self.pen_down:
                      self.ctx.beginPath()
                      self.ctx.moveTo(self.x, self.y)
                      self.ctx.lineTo(new_x, new_y)
                      self.ctx.strokeStyle = self.pen_color
                      self.ctx.lineWidth = self.pen_size
                      self.ctx.stroke()
                  
                  # Update position
                  self.x = new_x
                  self.y = new_y
                  
                  # Redraw turtle
                  self.clear_turtle()
                  self.draw_turtle()
                  
                  # Pause for animation frame
                  await asyncio.sleep(0.01)
              
              # Record the path segment if pen was down for validation
              if self.pen_down:
                  self.path_segments.append({
                      'start': self.current_segment_start,
                      'end': (self.x, self.y),
                      'length': distance,
                      'angle': self.heading
                  })
              
              # Update current segment start position
              self.current_segment_start = (self.x, self.y)
          
          async def backward(self, distance):
              await self.forward(-distance)
          
          async def right(self, angle):
              """Turn right with animation"""
              target_heading = (self.heading + angle) % 360
              steps = max(1, abs(int(angle / self.turn_speed)))
              
              for i in range(steps):
                  # Calculate next heading
                  progress = (i + 1) / steps
                  self.heading = (self.heading + angle / steps) % 360
                  
                  # Redraw turtle
                  self.clear_turtle()
                  self.draw_turtle()
                  
                  # Pause for animation frame
                  await asyncio.sleep(0.01)
          
          async def left(self, angle):
              await self.right(-angle)
          
          def penup(self):
              self.pen_down = False
              self.current_segment_start = (self.x, self.y)
          
          def pendown(self):
              self.pen_down = True
              self.current_segment_start = (self.x, self.y)
          
          def pencolor(self, color):
              self.pen_color = color
          
          def pensize(self, size):
              self.pen_size = size
          
          async def goto(self, x, y):
              """Move to position with animation"""
              # Calculate distance and angle to target
              dx = x - self.x
              dy = y - self.y
              distance = math.sqrt(dx**2 + dy**2)
              angle = math.degrees(math.atan2(dy, dx))
              
              # Save pen state
              old_pen_state = self.pen_down
              
              # Turn toward target
              if distance > 0:
                  # Get current heading as starting point
                  current = self.heading
                  # Calculate smallest angle to turn
                  delta = (angle - current) % 360
                  if delta > 180:
                      delta -= 360
                  # Turn to face target
                  await self.right(delta)
                  
                  # Move to target
                  if self.pen_down:
                      # Record the path segment if pen is down
                      self.path_segments.append({
                          'start': self.current_segment_start,
                          'end': (x, y),
                          'length': distance,
                          'angle': self.heading
                      })
                  
                  # Animate the movement
                  steps = max(1, abs(int(distance / self.animation_speed)))
                  for i in range(steps):
                      # Calculate next position
                      progress = (i + 1) / steps
                      new_x = self.x + (x - self.x) * progress
                      new_y = self.y + (y - self.y) * progress
                      
                      # Draw line segment if pen is down
                      if self.pen_down:
                          self.ctx.beginPath()
                          self.ctx.moveTo(self.x, self.y)
                          self.ctx.lineTo(new_x, new_y)
                          self.ctx.strokeStyle = self.pen_color
                          self.ctx.lineWidth = self.pen_size
                          self.ctx.stroke()
                      
                      # Update position
                      self.x = new_x
                      self.y = new_y
                      
                      # Redraw turtle
                      self.clear_turtle()
                      self.draw_turtle()
                      
                      # Pause for animation frame
                      await asyncio.sleep(0.01)
              
              # Ensure exact position
              self.x = x
              self.y = y
              
              # Update the current segment start position
              self.current_segment_start = (self.x, self.y)
              
              # Redraw turtle
              self.clear_turtle()
              self.draw_turtle()
          
          def clear_turtle(self):
              """Erase the turtle while preserving the drawing"""
              # Get the current canvas data
              img_data = self.ctx.getImageData(0, 0, self.width, self.height)
              
              # Create a temporary canvas to store the drawing without the turtle
              if not hasattr(self, 'tempCanvas'):
                  # Create a temporary canvas if it doesn't exist yet
                  from js import document
                  self.tempCanvas = document.createElement("canvas")
                  self.tempCanvas.width = self.width
                  self.tempCanvas.height = self.height
                  self.tempCtx = self.tempCanvas.getContext("2d")
              
              # Clear the temporary canvas
              self.tempCtx.clearRect(0, 0, self.width, self.height)
              
              # Copy the current image data to the temporary canvas
              self.tempCtx.putImageData(img_data, 0, 0)
              
              # Clear the main canvas and redraw from the temporary canvas
              # This ensures any turtle "stamps" are removed
              self.ctx.clearRect(0, 0, self.width, self.height)
              self.ctx.drawImage(self.tempCanvas, 0, 0)
          
          def draw_turtle(self):
              """Draw the turtle at current position and heading"""
              # Save context state
              self.ctx.save()
              
              # Move to turtle position
              self.ctx.translate(self.x, self.y)
              self.ctx.rotate(math.radians(self.heading))
              
              # Draw turtle
              self.ctx.beginPath()
              self.ctx.moveTo(10, 0)  # Nose
              self.ctx.lineTo(-5, 5)  # Bottom right
              self.ctx.lineTo(-5, -5) # Bottom left
              self.ctx.closePath()
              
              # Fill turtle
              self.ctx.fillStyle = "green"
              self.ctx.fill()
              
              # Restore context state
              self.ctx.restore()
          
          def get_path_segments(self):
              """Return the path segments for validation"""
              return self.path_segments
      
      # Create the animated_turtle module
      class AnimatedTurtleModule:
          def __init__(self):
              self.Turtle = AnimatedTurtle
              
              # Provide simple help documentation
              self.__doc__ = """
              Animated Turtle Graphics Module
              
              This module provides a simple turtle graphics system similar
              to Python's standard turtle module, but designed to work in
              web browsers with animation.
              
              To use it:
                from animated_turtle import Turtle
                
                t = Turtle()           # Create a new turtle
                await t.forward(100)   # Move forward 100 pixels
                await t.right(90)      # Turn right 90 degrees
                t.pencolor("red")      # Change pen color to red
                t.penup()              # Lift the pen (stop drawing)
                t.pendown()            # Lower the pen (resume drawing)
                await t.goto(x, y)     # Move to coordinates (x,y)
              """
      
      # Add the module to sys.modules
      sys.modules['animated_turtle'] = AnimatedTurtleModule()
    `);
  }
  
  /**
   * Set up event handlers after rendering
   */
  protected afterRender(): void {
    // Update the UI with saved programs
    this.updateUI();
    
    // Set up event listeners for run and validate buttons
    const runButtons = document.querySelectorAll('.turtle-run-button');
    runButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const sectionId = button.getAttribute('data-section-id');
        if (sectionId) {
          this.runTurtleProgram(sectionId);
        }
      });
    });
    
    const validateButtons = document.querySelectorAll('.turtle-validate-button');
    validateButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const sectionId = button.getAttribute('data-section-id');
        if (sectionId) {
          this.validateTurtleProgram(sectionId);
        }
      });
    });
    
    // Set up event listeners for code editors
    const codeEditors = document.querySelectorAll('.turtle-code-editor');
    codeEditors.forEach(editor => {
      editor.addEventListener('input', (event) => {
        const sectionId = editor.getAttribute('data-section-id');
        if (sectionId) {
          this.handleCodeChange(sectionId, (editor as HTMLTextAreaElement).value);
        }
      });
    });
  }
  
  /**
   * Render a Turtle section
   */
  protected renderTurtleSection(section: TurtleSection, container: HTMLElement): void {
    // First render as a standard section to get the base structure
    this.renderStandardSection(section, container);
    
    // Find the section container we just added
    const sectionContainer = document.getElementById(section.id);
    if (!sectionContainer) return;
    
    // Create the turtle challenge container
    const challengeContainer = document.createElement('div');
    challengeContainer.className = 'turtle-challenge-container';
    
    // Add instructions
    const instructionsDiv = document.createElement('div');
    instructionsDiv.className = 'turtle-instructions';
    instructionsDiv.innerHTML = `<h4>Instructions:</h4><p>${section.instructions}</p>`;
    challengeContainer.appendChild(instructionsDiv);
    
    // Create the turtle commands reference if available
    if (section.turtleCommands && section.turtleCommands.length > 0) {
      const commandsDiv = document.createElement('div');
      commandsDiv.className = 'turtle-commands-reference';
      commandsDiv.innerHTML = '<h4>Available Commands:</h4>';
      
      const commandsList = document.createElement('ul');
      section.turtleCommands.forEach(cmd => {
        const cmdItem = document.createElement('li');
        cmdItem.innerHTML = `<code>await t.${cmd.name}</code> - ${cmd.description}`;
        commandsList.appendChild(cmdItem);
      });
      
      commandsDiv.appendChild(commandsList);
      challengeContainer.appendChild(commandsDiv);
    }
    
    // Create the code editor
    const editorContainer = document.createElement('div');
    editorContainer.className = 'turtle-code-editor-container';
    
    const editorHeader = document.createElement('div');
    editorHeader.className = 'turtle-editor-header';
    editorHeader.innerHTML = '<h4>Your Code:</h4>';
    editorContainer.appendChild(editorHeader);
    
    const codeEditor = document.createElement('textarea');
    codeEditor.className = 'turtle-code-editor';
    codeEditor.id = `${section.id}-editor`;
    codeEditor.setAttribute('data-section-id', section.id);
    codeEditor.value = section.initialCode;
    editorContainer.appendChild(codeEditor);
    
    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'turtle-buttons-container';
    
    // Add run button
    const runButton = document.createElement('button');
    runButton.type = 'button';
    runButton.className = 'turtle-run-button';
    runButton.textContent = 'Run Code';
    runButton.setAttribute('data-section-id', section.id);
    buttonsContainer.appendChild(runButton);
    
    // Add validate button
    const validateButton = document.createElement('button');
    validateButton.type = 'button';
    validateButton.className = 'turtle-validate-button';
    validateButton.textContent = 'Check Solution';
    validateButton.setAttribute('data-section-id', section.id);
    buttonsContainer.appendChild(validateButton);
    
    editorContainer.appendChild(buttonsContainer);
    challengeContainer.appendChild(editorContainer);
    
    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'turtle-canvas-container';
    canvasContainer.id = `${section.id}-canvas-container`;
    challengeContainer.appendChild(canvasContainer);
    
    // Create feedback container
    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = 'turtle-feedback hidden';
    feedbackContainer.id = `${section.id}-feedback`;
    challengeContainer.appendChild(feedbackContainer);
    
    // Add everything to the section container
    sectionContainer.appendChild(challengeContainer);
  }
  
  /**
   * Handle code changes and save to localStorage
   */
  private handleCodeChange(sectionId: string, code: string): void {
    this.userPrograms.set(sectionId, code);
    this.savePrograms();
  }
  
  /**
   * Run a turtle program for a section
   */
  private async runTurtleProgram(sectionId: string): Promise<void> {
    if (!this.pyodideReady) {
      alert('Python environment is not yet ready. Please wait a moment and try again.');
      return;
    }
    
    const code = this.userPrograms.get(sectionId) || this.getSectionById(sectionId)?.initialCode || '';
    const canvasContainer = document.getElementById(`${sectionId}-canvas-container`);
    if (!canvasContainer) return;
    
    // Clear previous canvas and feedback
    canvasContainer.innerHTML = '';
    const feedbackElement = document.getElementById(`${sectionId}-feedback`);
    if (feedbackElement) {
      feedbackElement.classList.add('hidden');
    }
    
    // Create a unique canvas ID for this run
    const canvasId = `turtle-canvas-${sectionId}-${Date.now()}`;
    
    try {
      // Create the canvas in the container
      await (window as any).pyodide.runPythonAsync(`
        from js import document
        canvas = document.createElement("canvas")
        canvas.id = "${canvasId}"
        canvas.width = 400
        canvas.height = 300
        canvas.style.border = "1px solid #ddd"
        canvas.style.backgroundColor = "white"
        document.getElementById("${sectionId}-canvas-container").appendChild(canvas)
      `);
      
      // Run the code with the specific canvas ID
      const pyodide = (window as any).pyodide;
      const indentedCode = code.split('\n').map(line => {
        // Only add indentation to non-empty lines
        return line.trim() ? '  ' + line : line;
      }).join('\n');
      
      const modifiedCode = `
# Redirect output to our buffer
import sys
sys.stdout = console
console.buffer = StringIO()

# Run user code with the specific canvas ID
try:
  ${indentedCode}
  
  # Return paths for validation
  paths = None
  try:
    if 't' in locals():
      paths = t.get_path_segments()
  except:
    pass
  
  paths
except Exception as e:
  print(f"Error: {str(e)}")
  None
`;
      
      // Run the code
      const result = await pyodide.runPythonAsync(modifiedCode);
      
      // Store the paths for validation
      if (result) {
        this.userPrograms.set(`${sectionId}-paths`, JSON.stringify(result));
      }
      
      // Display any output
      const output = await pyodide.runPythonAsync(`console.getvalue()`);
      if (output.trim()) {
        const outputDiv = document.createElement('div');
        outputDiv.className = 'turtle-output';
        outputDiv.innerHTML = `<h4>Output:</h4><pre>${escapeHTML(output)}</pre>`;
        canvasContainer.appendChild(outputDiv);
      }
    } catch (error: any) {
      console.error('Error running turtle program:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'turtle-error';
      errorDiv.textContent = `Error: ${error.message || 'Unknown error'}`;
      canvasContainer.appendChild(errorDiv);
    }
  }
  
  /**
   * Validate a turtle program against the criteria
   */
  private async validateTurtleProgram(sectionId: string): Promise<void> {
    // Get the path segments from the last run
    const pathsJson = this.userPrograms.get(`${sectionId}-paths`);
    if (!pathsJson) {
      alert('Please run your code first before validating.');
      return;
    }
    
    // Get the section
    const section = this.getSectionById(sectionId) as TurtleSection;
    if (!section) return;
    
    // Get feedback element
    const feedbackElement = document.getElementById(`${sectionId}-feedback`);
    if (!feedbackElement) return;
    
    // Parse the path segments
    const paths = JSON.parse(pathsJson);
    
    // Validate based on criteria
    let isValid = false;
    
    try {
      if (section.validationCriteria.type === 'shape') {
        if (section.validationCriteria.shape === 'rectangle') {
          isValid = this.validateRectangle(
            paths, 
            section.validationCriteria.width || 0, 
            section.validationCriteria.height || 0
          );
        } else if (section.validationCriteria.shape === 'octagon') {
          isValid = this.validateOctagon(
            paths, 
            section.validationCriteria.sideLength || 0
          );
        }
      }
      
      // Display feedback
      feedbackElement.textContent = isValid ? section.feedback.correct : section.feedback.incorrect;
      feedbackElement.className = `turtle-feedback ${isValid ? 'correct-feedback' : 'incorrect-feedback'}`;
      
      // If valid, mark as completed
      if (isValid) {
        markSectionCompleted(sectionId, this.lessonId);
        this.updateSidebarCompletions();
        this.checkAllSectionsCompleted();
      }
    } catch (error: any) {
      console.error('Error validating turtle program:', error);
      feedbackElement.textContent = `Error validating: ${error.message || 'Unknown error'}`;
      feedbackElement.className = 'turtle-feedback incorrect-feedback';
    }
  }
  
  /**
   * Validate a rectangle shape
   */
  private validateRectangle(paths: any[], width: number, height: number): boolean {
    // For a rectangle, we need 4 segments forming a closed path
    if (!paths || paths.length < 4) return false;
    
    // Extract relevant segments with pen down
    const segments = paths;
    
    // We need exactly 4 segments for a rectangle
    if (segments.length !== 4) return false;
    
    // Check if the 4 segments form a rectangle with the right dimensions
    // This is a simplified validation that checks if we have 2 segments of length 'width'
    // and 2 segments of length 'height', all connected at 90 degree angles
    
    // Count segments by length (with some tolerance)
    const tolerance = 2; // 2 pixel tolerance
    const widthSegments = segments.filter(s => 
      Math.abs(Math.abs(s.length) - width) < tolerance
    );
    
    const heightSegments = segments.filter(s => 
      Math.abs(Math.abs(s.length) - height) < tolerance
    );
    
    // We need 2 width segments and 2 height segments
    if (widthSegments.length !== 2 || heightSegments.length !== 2) return false;
    
    // For a full validation, we should also check:
    // 1. That segments are connected (end point of one is start point of next)
    // 2. That angles between segments are ~90 degrees
    // 3. That path is closed (end point of last segment is start point of first)
    
    // This is a simplified version that just checks dimensions
    return true;
  }
  
  /**
   * Validate an octagon shape
   */
  private validateOctagon(paths: any[], sideLength: number): boolean {
    // For a regular octagon, we need 8 segments of equal length
    if (!paths || paths.length < 8) return false;
    
    // Extract relevant segments with pen down
    const segments = paths;
    
    // We need exactly 8 segments for an octagon
    if (segments.length !== 8) return false;
    
    // Check if all 8 segments have the expected length (with tolerance)
    const tolerance = 2; // 2 pixel tolerance
    const correctLengthSegments = segments.filter(s => 
      Math.abs(Math.abs(s.length) - sideLength) < tolerance
    );
    
    // All 8 segments should have the correct length
    if (correctLengthSegments.length !== 8) return false;
    
    // For a more complete validation, we could also check:
    // 1. That segments are connected
    // 2. That angles between segments are ~135 degrees (for regular octagon)
    // 3. That path is closed
    
    // This is a simplified version that just checks side lengths
    return true;
  }
  
  /**
   * Get a section by ID
   */
  private getSectionById(sectionId: string): TurtleSection | null {
    if (!this.lesson) return null;
    
    const section = this.lesson.sections.find(s => s.id === sectionId);
    if (!section || section.kind !== 'Turtle') return null;
    
    return section as TurtleSection;
  }
  
  /**
   * Save user programs to localStorage
   */
  private savePrograms(): void {
    try {
      // Convert Map to Object for storage
      const programsObj: { [key: string]: string } = {};
      this.userPrograms.forEach((value, key) => {
        programsObj[key] = value;
      });
      
      localStorage.setItem(`${this.lessonId}_turtle_programs`, JSON.stringify(programsObj));
    } catch (error) {
      console.error('Error saving turtle programs:', error);
    }
  }
  
  /**
   * Load saved programs from localStorage
   */
  private loadSavedPrograms(): void {
    try {
      const savedPrograms = localStorage.getItem(`${this.lessonId}_turtle_programs`);
      if (!savedPrograms) return;
      
      const programsObj = JSON.parse(savedPrograms);
      
      // Convert Object back to Map
      this.userPrograms = new Map(Object.entries(programsObj));
    } catch (error) {
      console.error('Error loading saved turtle programs:', error);
    }
  }
  
  /**
   * Update UI with saved programs
   */
  private updateUI(): void {
    // Apply saved programs to editors
    const editors = document.querySelectorAll('.turtle-code-editor');
    editors.forEach(editor => {
      const sectionId = editor.getAttribute('data-section-id');
      if (!sectionId) return;
      
      const savedCode = this.userPrograms.get(sectionId);
      if (savedCode) {
        (editor as HTMLTextAreaElement).value = savedCode;
      }
    });
    
    // If sections are marked as completed, add success styling
    const storageKey = `python_${this.lessonId}_completed`;
    const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    completedSections.forEach((sectionId: string) => {
      const section = this.getSectionById(sectionId);
      if (!section) return;
      
      // Add success styling to the section container
      const sectionContainer = document.getElementById(sectionId);
      if (sectionContainer) {
        sectionContainer.classList.add('completed-section');
      }
    });
  }
}