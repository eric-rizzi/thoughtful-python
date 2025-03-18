// lesson_1.ts - Handles the interactive elements for Lesson 1
import { pythonRunner } from '../pyodide';
import '../../css/main.css';
import '../../css/lessons.css';
import '../../css/challenges.css';
import { getSectionIdFromExampleId, LESSON_1_SECTION_MAPPING } from '../utils/section-mappings';
import { loadCompletionFromStorage, markSectionCompleted } from '../utils/progress-utils';

declare global {
  interface Window {
    CodeMirror: any;
  }
}

class Lesson1Controller {
  private runButtons: NodeListOf<Element> = document.querySelectorAll('.run-button');
  private codeEditors: Map<string, any> = new Map();
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
    
    // Initialize code editors
    this.initializeCodeEditors();
    
    // Add click event listeners to all run buttons
    this.runButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleRunButtonClick(button as HTMLElement);
      });
    });
    
    // Load completion status from localStorage
    loadCompletionFromStorage('lesson_1');
    
    // Mark as initialized
    this.isInitialized = true;
    console.log('Lesson 1 controller initialized');
  }

  private initializeCodeEditors(): void {
    // Find all code editor elements
    const editorElements = document.querySelectorAll('.code-editor');
    
    editorElements.forEach(element => {
      const id = element.id;
      
      if (!id) {
        console.warn('Code editor element is missing an ID attribute');
        return;
      }
      
      try {
        // Check if CodeMirror is available
        if (window.CodeMirror) {
          const editor = window.CodeMirror.fromTextArea(element as HTMLTextAreaElement, {
            mode: 'python',
            theme: 'default',
            lineNumbers: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            extraKeys: {
              Tab: (cm: any) => {
                if (cm.somethingSelected()) {
                  cm.indentSelection('add');
                } else {
                  cm.replaceSelection('    ', 'end');
                }
              }
            }
          });
          
          this.codeEditors.set(id, editor);
        } else {
          console.warn('CodeMirror not available, falling back to basic textarea');
        }
      } catch (error) {
        console.error(`Failed to initialize code editor ${id}:`, error);
      }
    });
  }

  private async handleRunButtonClick(button: HTMLElement): Promise<void> {
    const exampleId = button.dataset.exampleId;
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
    let code;
    const cmEditor = this.codeEditors.get(editorId);
    
    if (cmEditor) {
      // Using CodeMirror
      code = cmEditor.getValue();
    } else {
      // Fallback to regular textarea
      const editorElement = document.getElementById(editorId) as HTMLTextAreaElement;
      if (!editorElement) {
        console.error(`Could not find editor element for example: ${exampleId}`);
        return;
      }
      code = editorElement.value;
    }
    
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
      
      // Mark this section as completed
      const sectionId = getSectionIdFromExampleId(exampleId, LESSON_1_SECTION_MAPPING);
      markSectionCompleted(sectionId, exampleId);
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