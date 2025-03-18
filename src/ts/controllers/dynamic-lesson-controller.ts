/**
 * Base class for dynamic lesson controllers that load from JSON
 */
import { escapeHTML } from '../utils/pyodide-utils';
import { markSectionCompleted, loadCompletionFromStorage } from '../utils/progress-utils';
import { loadLesson, getLessonMapping, getRequiredSections, Lesson, LessonSection, LessonExample } from '../utils/lesson-loader';

export abstract class DynamicLessonController {
  protected lesson: Lesson | null = null;
  protected isInitialized: boolean = false;
  protected lessonMapping: { [key: string]: string } = {};
  
  constructor(protected lessonId: string) {
    // Initialize the lesson controller
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }

  protected async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load lesson data from JSON
      this.lesson = await loadLesson(this.lessonId);
      
      // Generate section to example mapping
      this.lessonMapping = getLessonMapping(this.lesson);
      
      // Initialize lesson-specific data
      await this.initializeLesson();
      
      // Render the lesson content
      this.renderLesson();
      
      // Load completion status
      loadCompletionFromStorage(this.lessonId);
      
      // Update sidebar to show completed sections
      this.updateSidebarCompletions();
      
      // Check if all sections are completed
      this.checkAllSectionsCompleted();
      
      // Mark as initialized
      this.isInitialized = true;
      console.log(`${this.lessonId} controller initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${this.lessonId}:`, error);
      this.showLoadError(error);
    }
  }

  /**
   * Renders the entire lesson, including sidebar and content
   */
  protected renderLesson(): void {
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
    
    // Do any lesson-specific setup after rendering
    this.afterRender();
  }
  
  /**
   * Renders the sidebar navigation
   */
  protected renderSidebar(): void {
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
  
  /**
   * Render a standard section (can be overridden by subclasses)
   */
  protected renderSection(section: LessonSection, container: HTMLElement): void {
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
    
    // Set section content - handle newlines in content
    const contentElement = sectionContainer.querySelector('.section-content') as HTMLElement;
    if (contentElement) {
      // Convert newlines to <br> tags for better formatting
      const formattedContent = section.content.replace(/\n(\d+)\.\s/g, '<br>$1. ');
      contentElement.innerHTML = formattedContent;
    }
    
    // Render examples if present
    const examplesContainer = sectionContainer.querySelector('.examples-container') as HTMLElement;
    if (examplesContainer && section.examples && section.examples.length > 0) {
      section.examples.forEach(example => {
        this.renderExample(example, examplesContainer);
      });
    }
    
    container.appendChild(sectionContainer);
  }
  
  /**
   * Render an example with code editor (can be overridden by subclasses)
   */
  protected renderExample(example: LessonExample, container: HTMLElement): void {
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
  
  /**
   * Updates the sidebar to show which sections are completed
   */
  protected updateSidebarCompletions(): void {
    try {
      // Get completed sections from localStorage
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Mark completed sections in sidebar
      completedSections.forEach((sectionId: string) => {
        const sidebarItem = document.querySelector(`#sidebar-sections li[data-section-id="${sectionId}"]`);
        if (sidebarItem && !sidebarItem.classList.contains('completed')) {
          sidebarItem.classList.add('completed');
        }
      });
    } catch (error) {
      console.error('Error updating sidebar completions:', error);
    }
  }

  /**
   * Checks if all required sections are completed and updates the navigation
   */
  protected checkAllSectionsCompleted(): void {
    if (!this.lesson) return;
    
    try {
      // Get completed sections from localStorage
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Required sections for this lesson
      const requiredSections = getRequiredSections(this.lesson);
      
      // Check if all required sections are completed
      const allCompleted = requiredSections.length > 0 && 
        requiredSections.every(section => completedSections.includes(section));
      
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
  
  /**
   * Display an error when loading fails
   */
  protected showLoadError(error: any): void {
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
  
  /**
   * These methods must be implemented by subclasses
   */
  protected abstract initializeLesson(): Promise<void>;
  protected abstract afterRender(): void;
}