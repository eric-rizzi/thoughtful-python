/**
 * Base class for lessons that include runnable code examples
 */
import { pythonRunner } from '../pyodide';
import { DynamicLessonController } from './dynamic-lesson-controller';
import { initializeCodeEditors, getCodeFromEditor, updateButtonState } from '../utils/editor-utils';
import { runPythonCode, escapeHTML, generateTestCode, parseTestResults } from '../utils/pyodide-utils';
import { markSectionCompleted } from '../utils/progress-utils';
import { displayTestResults, displayTestError } from '../utils/test-display-utils';

export abstract class CodeLessonController extends DynamicLessonController {
  protected codeEditors: Map<string, any> = new Map();
  
  /**
   * Initialize the Python environment for code execution
   */
  protected async initializeLesson(): Promise<void> {
    try {
      await pythonRunner.initialize();
      console.log(`Python environment ready for ${this.lessonId}`);
    } catch (error) {
      console.error('Failed to initialize Python environment:', error);
      this.showError('Failed to load Python environment. Please refresh the page and try again.');
    }
  }
  
  /**
   * Set up code editors and event handlers after rendering
   */
  protected afterRender(): void {
    // Initialize code editors after rendering
    this.codeEditors = initializeCodeEditors();
    
    // Add event listeners to run buttons
    const runButtons = document.querySelectorAll('.run-button');
    runButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleRunButtonClick(button as HTMLElement);
      });
    });
    
    // Add event listeners to test buttons if they exist
    const testButtons = document.querySelectorAll('.test-button');
    testButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleTestButtonClick(button as HTMLElement);
      });
    });
  }
  
  /**
   * Handle the run button click event for code examples
   */
  protected async handleRunButtonClick(button: HTMLElement): Promise<void> {
    const exampleId = button.getAttribute('data-example-id');
    if (!exampleId) {
      console.error('Run button is missing data-example-id attribute');
      return;
    }
    
    const editorId = `${exampleId}-editor`;
    const outputElement = document.getElementById(`${exampleId}-output`);
    
    if (!outputElement) {
      console.error(`Could not find output element for example: ${exampleId}`);
      return;
    }
    
    // Get code from the editor
    const code = getCodeFromEditor(editorId, this.codeEditors);
    if (!code) return;
    
    // Clear previous output
    outputElement.innerHTML = '';
    
    // Update button state to loading
    updateButtonState(button, true);
    
    try {
      // Run the Python code
      const result = await runPythonCode(code);
      
      // Display the output
      if (result.trim()) {
        outputElement.innerHTML = `<pre class="output-text">${escapeHTML(result)}</pre>`;
      } else {
        outputElement.innerHTML = '<p class="output-empty">Code executed successfully with no output.</p>';
      }
      
      // Mark this section as completed
      const sectionId = this.getSectionIdFromExampleId(exampleId);
      if (sectionId) {
        markSectionCompleted(sectionId, this.lessonId);
        this.updateSidebarCompletions();
        
        // Check if all sections are now completed
        this.checkAllSectionsCompleted();
      }
    } catch (error: any) {
      outputElement.innerHTML = `<pre class="output-error">Error: ${escapeHTML(error.toString())}</pre>`;
    } finally {
      // Restore button state
      updateButtonState(button, false);
    }
  }
  
  /**
   * Handle the test button click event for code examples with test cases
   */
  protected async handleTestButtonClick(button: HTMLElement): Promise<void> {
    const exampleId = button.getAttribute('data-example-id');
    if (!exampleId) {
      console.error('Test button is missing data-example-id attribute');
      return;
    }
    
    const editorId = `${exampleId}-editor`;
    const testResultElement = document.getElementById(`${exampleId}-test-result`);
    
    if (!testResultElement) {
      console.error(`Could not find test result element for example: ${exampleId}`);
      return;
    }
    
    // Get code from the editor
    const code = getCodeFromEditor(editorId, this.codeEditors);
    if (!code) return;
    
    // Update button state to loading
    updateButtonState(button, true, 'Testing...');
    
    try {
      // Find the example with test cases
      const example = this.findExampleById(exampleId);
      if (!example || !example.testCases) {
        throw new Error('Could not find test cases for this example');
      }
      
      // Extract function name from code or use a default
      const functionName = this.extractFunctionName(code) || 'solution_function';
      
      // Generate and run test code
      const testCode = generateTestCode(code, functionName, example.testCases);
      const result = await runPythonCode(testCode);
      
      // Parse test results
      const testResults = parseTestResults(result);
      
      // Display test results
      const allPassed = displayTestResults(testResults, testResultElement);
      
      // If all tests passed, mark this section as completed
      if (allPassed) {
        const sectionId = this.getSectionIdFromExampleId(exampleId);
        if (sectionId) {
          markSectionCompleted(sectionId, this.lessonId);
          this.updateSidebarCompletions();
          
          // Check if all sections are now completed
          this.checkAllSectionsCompleted();
        }
      }
    } catch (error: any) {
      displayTestError(error, testResultElement);
    } finally {
      // Restore button state
      updateButtonState(button, false);
    }
  }
  
  /**
   * Override renderExample to add test button if example has test cases
   */
  protected renderExample(example: any, container: HTMLElement): void {
    // First call the parent class's renderExample
    super.renderExample(example, container);
    
    // Check if this example has test cases
    if (example.testCases && example.testCases.length > 0) {
      // Find the code container for this example
      const exampleContainer = container.querySelector(`.example:last-child`);
      if (!exampleContainer) return;
      
      // Find the run button
      const runButton = exampleContainer.querySelector('.run-button');
      if (!runButton) return;
      
      // Add a test button next to the run button
      const testButton = document.createElement('button');
      testButton.className = 'test-button';
      testButton.textContent = 'Test Solution';
      testButton.setAttribute('data-example-id', example.id);
      
      // Insert the test button after the run button
      runButton.insertAdjacentElement('afterend', testButton);
      
      // Add a test result container
      const codeOutput = exampleContainer.querySelector('.code-output');
      if (!codeOutput) return;
      
      const testResultDiv = document.createElement('div');
      testResultDiv.className = 'test-result';
      testResultDiv.id = `${example.id}-test-result`;
      
      // Insert the test result div after the code output
      codeOutput.insertAdjacentElement('afterend', testResultDiv);
    }
  }
  
  /**
   * Find an example by ID from the loaded lesson data
   */
  protected findExampleById(exampleId: string): any {
    if (!this.lesson) return null;
    
    for (const section of this.lesson.sections) {
      if (section.examples) {
        const example = section.examples.find(ex => ex.id === exampleId);
        if (example) {
          return example;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract the function name from code
   * This is a simple implementation that looks for 'def function_name('
   */
  protected extractFunctionName(code: string): string | null {
    const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    return match ? match[1] : null;
  }
  
  /**
   * Get the section ID corresponding to an example ID
   */
  protected getSectionIdFromExampleId(exampleId: string): string | null {
    return this.lessonMapping[exampleId] || null;
  }
  
  /**
   * Show an error message
   */
  protected showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
  }
}