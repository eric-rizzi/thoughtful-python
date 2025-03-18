/**
 * Base class for lessons that include runnable code examples
 */
import { pythonRunner } from '../pyodide';
import { DynamicLessonController } from './dynamic-lesson-controller';
import { initializeCodeEditors, getCodeFromEditor, updateButtonState } from '../utils/editor-utils';
import { runPythonCode, escapeHTML } from '../utils/pyodide-utils';
import { markSectionCompleted } from '../utils/progress-utils';

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