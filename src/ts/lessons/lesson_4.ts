// lesson_4.ts - Dynamic lesson loaded from JSON
import { pythonRunner } from '../pyodide';
import '../../css/main.css';
import '../../css/lessons.css';
import '../../css/challenges.css';
import '../../css/lesson_4.css';

// Import utilities
import { initializeCodeEditors, getCodeFromEditor, updateButtonState } from '../utils/editor-utils';
import { escapeHTML, runPythonCode } from '../utils/pyodide-utils';
import { markSectionCompleted, loadCompletionFromStorage } from '../utils/progress-utils';
import { LESSON_4_SECTION_MAPPING } from '../utils/section-mappings';
import { loadLesson, getLessonMapping, getRequiredSections, Lesson, LessonSection, LessonExample } from '../utils/lesson-loader';

// Add to the REQUIRED_SECTIONS in lesson-progress-tracker.ts
declare global {
  interface Window {
    REQUIRED_SECTIONS?: { [key: string]: string[] };
  }
}

class Lesson4Controller {
  private lessonId = 'lesson_4';
  private lesson: Lesson | null = null;
  private codeEditors: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  private lessonMapping: { [key: string]: string } = {};

  constructor() {
    // Initialize the lesson controller
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load lesson data from JSON
      this.lesson = await loadLesson(this.lessonId);
      
      // Generate section to example mapping
      this.lessonMapping = getLessonMapping(this.lesson);
      
      // Update the global LESSON_4_SECTION_MAPPING
      Object.assign(LESSON_4_SECTION_MAPPING, this.lessonMapping);
      
      // Update required sections for lesson progress tracking
      const requiredSections = getRequiredSections(this.lesson);
      if (window.REQUIRED_SECTIONS) {
        window.REQUIRED_SECTIONS[this.lessonId] = requiredSections;
      }
      
      // Render the lesson content
      this.renderLesson();
      
      // Initialize Pyodide
      this.initializePyodide();
      
      // Load completion status
      loadCompletionFromStorage(this.lessonId);
      
      // Mark as initialized
      this.isInitialized = true;
      console.log(`${this.lessonId} controller initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${this.lessonId}:`, error);
      this.showLoadError(error);
    }
  }

  private async initializePyodide(): Promise<void> {
    try {
      await pythonRunner.initialize();
      console.log('Python environment ready for dynamic lesson');
    } catch (error) {
      console.error('Failed to initialize Python environment:', error);
      this.showError('Failed to load Python environment. Please refresh the page and try again.');
    }
  }

  private renderLesson(): void {
    if (!this.lesson) return;
    
    // Render the sidebar navigation
    this.renderSidebar();
    
    // Clear loading message
    const contentContainer = document.getElementById('lesson-content');
    if (contentContainer) {
      contentContainer.innerHTML = '';
      
      // Add lesson title and description
      const titleElement = document.createElement('h2');
      titleElement.textContent = this.lesson.title;
      contentContainer.appendChild(titleElement);
      
      const descriptionElement = document.createElement('p');
      descriptionElement.textContent = this.lesson.description;
      contentContainer.appendChild(descriptionElement);
      
      // Render each section
      this.lesson.sections.forEach(section => {
        this.renderSection(section, contentContainer);
      });
    }
    
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
    
    // Check for completed sections
    this.checkAllSectionsCompleted();
  }

  private renderSidebar(): void {
    if (!this.lesson) return;
    
    const sidebarContainer = document.getElementById('sidebar-sections');
    if (sidebarContainer) {
      sidebarContainer.innerHTML = '';
      
      // Create sidebar items for each section
      this.lesson.sections.forEach(section => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-section-id', section.id);
        
        // Check if this section is completed
        const storageKey = `python_${this.lessonId}_completed`;
        const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (completedSections.includes(section.id)) {
          listItem.classList.add('completed');
        }
        
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = section.title;
        
        listItem.appendChild(link);
        sidebarContainer.appendChild(listItem);
      });
    }
  }

  private renderSection(section: LessonSection, container: HTMLElement): void {
    // Use template to create section
    const template = document.getElementById('section-template') as HTMLTemplateElement;
    if (!template) return;
    
    const sectionElement = template.content.cloneNode(true) as DocumentFragment;
    const sectionContainer = sectionElement.querySelector('.lesson-section') as HTMLElement;
    if (!sectionContainer) return;
    
    // Set section ID and title
    sectionContainer.id = section.id;
    const titleElement = sectionContainer.querySelector('.section-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = section.title;
    }
    
    // Set section content
    const contentElement = sectionContainer.querySelector('.section-content') as HTMLElement;
    if (contentElement) {
      contentElement.textContent = section.content;
    }
    
    // Render examples
    const examplesContainer = sectionContainer.querySelector('.examples-container') as HTMLElement;
    if (examplesContainer && section.examples && section.examples.length > 0) {
      section.examples.forEach(example => {
        this.renderExample(example, examplesContainer);
      });
    }
    
    container.appendChild(sectionContainer);
  }

  private renderExample(example: LessonExample, container: HTMLElement): void {
    // Use template to create example
    const template = document.getElementById('example-template') as HTMLTemplateElement;
    if (!template) return;
    
    const exampleElement = template.content.cloneNode(true) as DocumentFragment;
    const exampleContainer = exampleElement.querySelector('.example') as HTMLElement;
    if (!exampleContainer) return;
    
    // Set example title and description
    const titleElement = exampleContainer.querySelector('.example-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = example.title;
    }
    
    const descriptionElement = exampleContainer.querySelector('.example-description') as HTMLElement;
    if (descriptionElement) {
      descriptionElement.textContent = example.description;
    }
    
    // Set up code editor
    const codeEditor = exampleContainer.querySelector('.code-editor') as HTMLTextAreaElement;
    if (codeEditor) {
      codeEditor.id = `${example.id}-editor`;
      codeEditor.value = example.code;
    }
    
    // Set up run button
    const runButton = exampleContainer.querySelector('.run-button') as HTMLButtonElement;
    if (runButton) {
      runButton.setAttribute('data-example-id', example.id);
    }
    
    // Set up output container
    const outputContainer = exampleContainer.querySelector('.code-output') as HTMLElement;
    if (outputContainer) {
      outputContainer.id = `${example.id}-output`;
    }
    
    // Set header title
    const headerTitle = exampleContainer.querySelector('.example-header-title') as HTMLElement;
    if (headerTitle) {
      headerTitle.textContent = example.title;
    }
    
    container.appendChild(exampleContainer);
  }

  private async handleRunButtonClick(button: HTMLElement): Promise<void> {
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
      
      // Mark the section as completed
      const sectionId = this.getSectionIdFromExampleId(exampleId);
      if (sectionId) {
        markSectionCompleted(sectionId, this.lessonId);
        this.updateSidebarCompletion(sectionId);
        
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

  private getSectionIdFromExampleId(exampleId: string): string | null {
    return this.lessonMapping[exampleId] || null;
  }

  private updateSidebarCompletion(sectionId: string): void {
    const sidebarItem = document.querySelector(`#sidebar-sections li[data-section-id="${sectionId}"]`);
    if (sidebarItem) {
      sidebarItem.classList.add('completed');
    }
  }

  /**
   * Checks if all sections in the lesson are completed and updates the navigation
   */
  private checkAllSectionsCompleted(): void {
    if (!this.lesson) return;
    
    try {
      // Get completed sections from localStorage
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Required sections for this lesson
      const requiredSections = getRequiredSections(this.lesson);
      
      // Check if all required sections are completed
      const allCompleted = requiredSections.every(section => 
        completedSections.includes(section)
      );
      
      console.log(`${this.lessonId} completion check:`, {
        completedSections,
        requiredSections,
        allCompleted
      });
      
      if (allCompleted) {
        // Mark the lesson as completed in navigation
        const navItem = document.querySelector(`nav li a[href="${this.lessonId}.html"]`)?.parentElement;
        if (navItem) {
          navItem.classList.add('nav-completed');
          console.log(`Added nav-completed class to ${this.lessonId} nav item`);
        } else {
          console.warn(`Could not find ${this.lessonId} nav item`);
        }
      }
    } catch (error) {
      console.error('Error checking lesson completion:', error);
    }
  }

  private showLoadError(error: any): void {
    const contentContainer = document.getElementById('lesson-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="load-error">
          <h3>Failed to Load Lesson</h3>
          <p>We couldn't load the lesson content. Please try refreshing the page.</p>
          <pre>${escapeHTML(error.toString())}</pre>
        </div>
      `;
    }
    
    const sidebarContainer = document.getElementById('sidebar-sections');
    if (sidebarContainer) {
      sidebarContainer.innerHTML = `
        <li class="sidebar-error">Error loading lesson content</li>
      `;
    }
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
  }
}

// Create and export the controller instance
const lesson4Controller = new Lesson4Controller();
export default lesson4Controller;
