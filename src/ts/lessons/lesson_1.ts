// lesson_1.ts - Handles the interactive elements for Lesson 1
import { pythonRunner } from '../pyodide';
import '../../css/main.css';
import '../../css/lessons.css';

class Lesson1Controller {
  private runButtons: NodeListOf<Element> = document.querySelectorAll('.run-button');
  private isInitialized: boolean = false;

  constructor() {
    // Initialize Pyodide in the background as soon as possible
    this.initializePyodide();
    
    // Wait for DOM to be fully loaded before setting up event handlers
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }

  private async initializePyodide(): Promise<void> {
    try {
      await pythonRunner.initialize();
      console.log('Python environment ready for Lesson 1');
    } catch (error) {
      console.error('Failed to initialize Python environment:', error);
      this.showError('Failed to load Python environment. Please refresh the page and try again.');
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    // Get all run buttons
    this.runButtons = document.querySelectorAll('.run-button');
    
    if (this.runButtons.length === 0) {
      console.warn('No run buttons found in Lesson 1');
      return;
    }
    
    console.log(`Found ${this.runButtons.length} code examples in Lesson 1`);
    
    // Add click event listeners to all run buttons
    this.runButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleRunButtonClick(button as HTMLElement);
      });
    });
    
    // Mark as initialized
    this.isInitialized = true;
    console.log('Lesson 1 controller initialized');
  }

  private async handleRunButtonClick(button: HTMLElement): Promise<void> {
    const exampleId = button.dataset.exampleId;
    if (!exampleId) {
      console.error('Run button is missing data-example-id attribute');
      return;
    }
    
    const editorElement = document.getElementById(`${exampleId}-editor`);
    const outputElement = document.getElementById(`${exampleId}-output`);
    
    if (!editorElement || !outputElement) {
      console.error(`Could not find editor or output elements for example: ${exampleId}`);
      return;
    }
    
    // Get code from the editor
    const code = editorElement.textContent || '';
    
    // Clear previous output
    outputElement.innerHTML = '';
    
    // Disable button and show loading state
    button.setAttribute('disabled', 'true');
    const originalText = button.textContent;
    button.textContent = 'Running...';
    
    try {
      // Run the Python code
      const result = await pythonRunner.runCode(code);
      
      // Display the output
      if (result.trim()) {
        outputElement.innerHTML = `<pre class="output-text">${this.escapeHTML(result)}</pre>`;
      } else {
        outputElement.innerHTML = '<p class="output-empty">Code executed successfully with no output.</p>';
      }
    } catch (error: any) {
      outputElement.innerHTML = `<pre class="output-error">Error: ${this.escapeHTML(error.toString())}</pre>`;
    } finally {
      // Re-enable the button
      button.removeAttribute('disabled');
      button.textContent = originalText;
    }
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
  }
}

// Create and export the controller instance
const lesson1Controller = new Lesson1Controller();
export default lesson1Controller;