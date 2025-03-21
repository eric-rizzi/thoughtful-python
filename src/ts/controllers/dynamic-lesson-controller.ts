/**
 * Base class for dynamic lesson controllers that load from JSON
 */
import { escapeHTML } from '../utils/pyodide-utils';
import { loadLesson, getLessonMapping, getRequiredSections, Lesson, LessonSection, LessonExample } from '../utils/lesson-loader';
import { LESSON_CONTROLLER_TYPES } from '../config';

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
      
      // Cache lesson data for completion checking in other tabs/contexts
      this.storeLessonData(this.lesson);
      
      // Validate section kinds
      this.validateSectionKinds();
      
      // Generate section to example mapping
      this.lessonMapping = getLessonMapping(this.lesson);
      
      // Initialize lesson-specific data
      await this.initializeLesson();
      
      // Render the lesson content
      this.renderLesson();
      
      // Load completion status
      this.loadCompletionFromStorage();
      
      // Update header and sidebar to show completed sections
      this.updateSidebarCompletions();
       
      // Check if all sections are completed
      this.checkAllSectionsCompleted();
      
      // Update global navigation menu
      this.updateLessonCompletionStatus();
      
      // Mark as initialized
      this.isInitialized = true;
      console.log(`${this.lessonId} controller initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${this.lessonId}:`, error);
      this.showLoadError(error);
    }
  }
  
  /**
   * Store lesson data in localStorage for completion checking in other contexts
   */
  private storeLessonData(lesson: Lesson): void {
    try {
      localStorage.setItem(`python_${this.lessonId}_data`, JSON.stringify(lesson));
    } catch (error) {
      console.warn('Failed to cache lesson data:', error);
    }
  }

  /**
   * Validates that each section has the required properties based on its kind
   */
  protected validateSectionKinds(): void {
    if (!this.lesson) return;
    
    // Define required properties for each kind
    const requiredProperties: { [kind: string]: string[] } = {
      'Information': ['id', 'title', 'content'],
      'Observation': ['id', 'title', 'content', 'examples'],
      'Testing': ['id', 'title', 'content', 'examples'],
      'Prediction': ['id', 'title', 'content', 'functionDisplay', 'predictionTable'],
      'MultipleChoice': ['id', 'title', 'content', 'options', 'correctAnswer', 'feedback'],
      'MultiSelection': ['id', 'title', 'content', 'options', 'correctAnswers', 'feedback'],
      'Turtle': ['id', 'title', 'content', 'instructions', 'initialCode', 'validationCriteria', 'feedback'],
      'Reflection': ['id', 'title', 'content', 'prompts'],
      'Coverage': ['id', 'title', 'content', 'code', 'coverageChallenges', 'inputParams'],
    };
    
    // Validate each section
    this.lesson.sections.forEach((section, index) => {
      const kind = section.kind;
      
      // Check if kind is present
      if (!kind) {
        throw new Error(`Section ${index} in lesson ${this.lessonId} is missing 'kind' property`);
      }
      
      // Check if kind is valid
      if (!requiredProperties[kind]) {
        throw new Error(`Section ${index} in lesson ${this.lessonId} has invalid kind: ${kind}`);
      }
      
      // Check if all required properties exist
      for (const prop of requiredProperties[kind]) {
        if (!(prop in section)) {
          throw new Error(`Section '${section.title}' of kind '${kind}' is missing required property: ${prop}`);
        }
      }
      
      // Specific validations for different section kinds
      if (kind === 'Testing' && section.examples) {
        const hasTestCases = section.examples.some(example => example.testCases && example.testCases.length > 0);
        if (!hasTestCases) {
          throw new Error(`Section '${section.title}' of kind 'Testing' must have at least one example with testCases`);
        }
      }
      
      if (kind === 'Prediction' && section.predictionTable) {
        if (!section.predictionTable.rows || !section.predictionTable.rows.length) {
          throw new Error(`Section '${section.title}' of kind 'Prediction' must have a predictionTable with rows`);
        }
      }
      
      if (kind === 'MultipleChoice') {
        if (!section.options || !section.options.length) {
          throw new Error(`Section '${section.title}' of kind 'MultipleChoice' must have options`);
        }
        if (section.correctAnswer === undefined || section.correctAnswer < 0 || section.correctAnswer >= section.options.length) {
          throw new Error(`Section '${section.title}' of kind 'MultipleChoice' has an invalid correctAnswer: ${section.correctAnswer}`);
        }
      }
      
      if (kind === 'MultiSelection') {
        if (!section.options || !section.options.length) {
          throw new Error(`Section '${section.title}' of kind 'MultiSelection' must have options`);
        }
        if (!section.correctAnswers || !section.correctAnswers.length) {
          throw new Error(`Section '${section.title}' of kind 'MultiSelection' must have correctAnswers`);
        }
        for (const answer of section.correctAnswers) {
          if (answer < 0 || answer >= section.options.length) {
            throw new Error(`Section '${section.title}' of kind 'MultiSelection' has an invalid correctAnswer: ${answer}`);
          }
        }
      }
      
      if (kind === 'Turtle') {
        if (!section.validationCriteria || !section.validationCriteria.type) {
          throw new Error(`Section '${section.title}' of kind 'Turtle' must have validationCriteria with a type property`);
        }
        if (section.validationCriteria.type === 'shape') {
          if (!section.validationCriteria.shape) {
            throw new Error(`Section '${section.title}' of kind 'Turtle' with type 'shape' must specify a shape`);
          }
          if (section.validationCriteria.shape === 'rectangle' && 
              (!section.validationCriteria.width || !section.validationCriteria.height)) {
            throw new Error(`Section '${section.title}' of kind 'Turtle' with shape 'rectangle' must specify width and height`);
          }
          if (section.validationCriteria.shape === 'octagon' && !section.validationCriteria.sideLength) {
            throw new Error(`Section '${section.title}' of kind 'Turtle' with shape 'octagon' must specify sideLength`);
          }
        }
      }
    });
    
    console.log(`All sections in lesson ${this.lessonId} passed validation`);
  }

  /**
   * Renders the entire lesson, including sidebar and content
   */
  protected renderLesson(): void {
    console.log("Rendering again??")
    if (!this.lesson) return;

    // Remove loading message (if it exists)
    const loadingMessage = document.getElementById('loading-message-container');
    if (loadingMessage) {
      console.log("Trying to remove loading message")
      loadingMessage.remove();
    }

    // Render the sidebar navigation
    this.renderSidebar();

    // Clear loading message
    const contentContainer = document.getElementById('lesson-content');
    if (contentContainer) {
      
      // Add lesson title and description
      const titleElement = document.createElement('h2');
      titleElement.textContent = this.lesson.title;
      contentContainer.appendChild(titleElement);
      
      const descriptionElement = document.createElement('p');
      descriptionElement.textContent = this.lesson.description;
      contentContainer.appendChild(descriptionElement);
      
      // Render each section based on its kind
      this.lesson.sections.forEach(section => {
        this.renderSectionByKind(section, contentContainer);
      });
    }
    
    // Do any lesson-specific setup after rendering
    this.afterRender();
  }

  /**
   * Renders a section based on its kind
   */
  protected renderSectionByKind(section: LessonSection, container: HTMLElement): void {
    switch (section.kind) {
      case 'Prediction':
        this.renderPredictionSection(section, container);
        break;
      case 'MultipleChoice':
        this.renderMultipleChoiceSection(section, container);
        break;
      case 'MultiSelection':
        this.renderMultiSelectionSection(section, container);
        break;
      case 'Turtle':
        this.renderTurtleSection(section, container);
        break;
      case 'Reflection':
        this.renderReflectionSection(section, container);
        break;
      case 'Coverage':  // Add this case
        this.renderCoverageSection(section, container);
        break;
      case 'Testing':
      case 'Observation':
      case 'Information':
      default:
        this.renderStandardSection(section, container);
        break;
    }
  }
  
  /**
   * Render a Coverage section
   * This is a placeholder that should be overridden by CoverageLessonController
   */
  protected renderCoverageSection(section: LessonSection, container: HTMLElement): void {
    // By default, just render as a standard section
    // This will be overridden by CoverageLessonController
    this.renderStandardSection(section, container);
  }

  /**
   * Render a MultipleChoice section
   * This is a placeholder that should be overridden by QuizLessonController
   */
  protected renderMultipleChoiceSection(section: LessonSection, container: HTMLElement): void {
    // By default, just render as a standard section
    // This will be overridden by QuizLessonController
    this.renderStandardSection(section, container);
  }
  
  /**
   * Render a MultiSelection section
   * This is a placeholder that should be overridden by QuizLessonController
   */
  protected renderMultiSelectionSection(section: LessonSection, container: HTMLElement): void {
    // By default, just render as a standard section
    // This will be overridden by QuizLessonController
    this.renderStandardSection(section, container);
  }
  
  /**
   * Render a Turtle section
   * This is a placeholder that should be overridden by TurtleLessonController
   */
  protected renderTurtleSection(section: LessonSection, container: HTMLElement): void {
    // By default, just render as a standard section
    // This will be overridden by TurtleLessonController
    this.renderStandardSection(section, container);
  }
  
  /**
   * Render a Reflection section
   * This is a placeholder that should be overridden by ReflectionLessonController
   */
  protected renderReflectionSection(section: LessonSection, container: HTMLElement): void {
    // By default, just render as a standard section
    // This will be overridden by ReflectionLessonController
    this.renderStandardSection(section, container);
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
   * Render a standard section (Information, Observation, Testing)
   */
  protected renderStandardSection(section: LessonSection, container: HTMLElement): void {
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
   * Render a Prediction section
   * This is a placeholder that should be overridden by PredictionLessonController
   */
  protected renderPredictionSection(section: LessonSection, container: HTMLElement): void {
    // By default, just render as a standard section
    // This will be overridden by PredictionLessonController
    this.renderStandardSection(section, container);
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
   * Marks a sidebar section as completed
   */
  protected markSectionCompleted(sectionId: string): void {
    // Find the sidebar link for this section
    const sidebarLink = document.querySelector(`.lesson-sidebar a[href="#${sectionId}"]`);
    if (!sidebarLink) {
      console.warn(`Could not find sidebar link for section: ${sectionId}`);
      return;
    }
    
    // Add completed class to parent li element
    const parentLi = sidebarLink.parentElement;
    if (parentLi && !parentLi.classList.contains('completed')) {
      parentLi.classList.add('completed');
      
      // Show temporary notification
      this.showProgressSavedNotification();
      
      // Store completion in localStorage
      this.saveCompletionToStorage(sectionId);
    }
  }
  
  /**
   * Shows a temporary notification that progress was saved
   */
  protected showProgressSavedNotification(): void {
    // Check if notification already exists
    let notification = document.querySelector('.progress-saved');
    
    if (!notification) {
      // Create new notification
      notification = document.createElement('div');
      notification.className = 'progress-saved';
      notification.textContent = 'Progress saved ✓';
      
      // Add to sidebar
      const sidebar = document.querySelector('.lesson-sidebar');
      if (sidebar) {
        sidebar.appendChild(notification);
      }
    } else {
      // Reset animation if notification exists
      notification.classList.remove('fade-out');
      // Force reflow - need to cast to HTMLElement to access offsetWidth
      (notification as HTMLElement).offsetWidth;
    }
    
    // Fade out after 2 seconds
    setTimeout(() => {
      notification?.classList.add('fade-out');
    }, 2000);
  }
  
  /**
   * Saves section completion status to localStorage
   */
  protected saveCompletionToStorage(sectionId: string): void {
    try {
      // Get existing completed sections
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Add this section if not already included
      if (!completedSections.includes(sectionId)) {
        completedSections.push(sectionId);
        localStorage.setItem(storageKey, JSON.stringify(completedSections));
        
        // Dispatch a custom event to notify that progress has been updated
        window.dispatchEvent(new CustomEvent('lessonProgressUpdated', {
          detail: { lessonId: this.lessonId, sectionId }
        }));
      }
    } catch (error) {
      console.warn('Failed to save progress to localStorage:', error);
    }
  }
  
  /**
   * Loads completion status from localStorage
   */
  protected loadCompletionFromStorage(): void {
    try {
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Mark each completed section
      completedSections.forEach((sectionId: string) => {
        const sidebarLink = document.querySelector(`.lesson-sidebar a[href="#${sectionId}"]`);
        if (sidebarLink && sidebarLink.parentElement) {
          sidebarLink.parentElement.classList.add('completed');
        }
      });
    } catch (error) {
      console.warn('Failed to load progress from localStorage:', error);
    }
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
   * Updates the lesson completion status in the navigation menu
   * This replaces functionality from lesson-progress-tracker.ts
   */
  protected updateLessonCompletionStatus(): void {
    // Get all lesson IDs from your config
    const lessonIds = Object.keys(LESSON_CONTROLLER_TYPES);
    
    // Process each lesson
    lessonIds.forEach(lessonId => {
      const isComplete = this.isLessonComplete(lessonId);
      
      // Find the nav link for this lesson
      const navLink = document.querySelector(`nav li a[href="${lessonId}.html"]`);
      if (navLink) {
        const parentLi = navLink.parentElement;
        
        if (isComplete) {
          // Add completed class to the li element
          if (parentLi && !parentLi.classList.contains('nav-completed')) {
            parentLi.classList.add('nav-completed');
            console.log(`Added nav-completed class to ${lessonId} nav item`);
          }
        } else {
          // Remove completed class if not complete (in case user cleared progress)
          if (parentLi && parentLi.classList.contains('nav-completed')) {
            parentLi.classList.remove('nav-completed');
            console.log(`Removed nav-completed class from ${lessonId} nav item`);
          }
        }
      }
    });
  }
  
  /**
   * Checks if a lesson is completely finished
   * This replaces functionality from lesson-progress-tracker.ts
   */
  protected isLessonComplete(lessonId: string): boolean {
    try {
      const storageKey = `python_${lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Get the required sections for this lesson
      const cachedLessonData = JSON.parse(localStorage.getItem(`python_${lessonId}_data`) || 'null');
      if (!cachedLessonData) {
        return false; // Can't determine completion without lesson data
      }
      
      const requiredSections = getRequiredSections(cachedLessonData);
      
      // If no sections are defined, lesson is not completable
      if (requiredSections.length === 0) {
        return false;
      }
      
      // Check if all required sections are completed
      return requiredSections.every(section => completedSections.includes(section));
    } catch (error) {
      console.warn(`Failed to check lesson completion status for ${lessonId}:`, error);
      return false;
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