// src/ts/controllers/unit-controller.ts
import { loadUnitById, Unit } from '../utils/units-loader';
import { BASE_PATH, LESSON_TITLES } from '../config';
import { loadLesson, Lesson, LessonSection } from '../utils/lesson-loader';

/**
 * Helper function to get required sections from a lesson
 * @param lesson - The lesson data
 * @returns Array of section IDs
 */
function getRequiredSections(lesson: Lesson): string[] {
  // For certain kinds of sections, we might have different completion requirements
  const requiredSections: string[] = [];
  
  lesson.sections.forEach((section: LessonSection) => {
    switch(section.kind) {
      case 'Testing':
      case 'Prediction':
      case 'Observation':
      case 'MultipleChoice':
      case 'MultiSelection':
      case 'Turtle':
        // These kinds of sections require interaction to complete
        requiredSections.push(section.id);
        break;
      case 'Information':
        // Information sections are optional for completion
        // They can be marked as completed by viewing them, but aren't required
        break;
      default:
        // For any other kind, include it by default
        requiredSections.push(section.id);
    }
  });
  
  return requiredSections;
}

export class UnitController {
  private unit: Unit | null = null;
  private lessonData: Map<string, Lesson> = new Map();
  
  constructor(private unitId: string) {
    // Initialize the unit controller
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }
  
  private async initialize(): Promise<void> {
    try {
      // Load the unit data
      this.unit = await loadUnitById(this.unitId);
      
      if (!this.unit) {
        this.showLoadError(new Error(`Unit with ID ${this.unitId} not found`));
        return;
      }
      
      // Update the page title
      document.title = `${this.unit.title} - Python in the Browser`;
      
      // Load all lesson data for this unit
      await this.loadLessonData();
      
      // Render the unit content
      this.renderUnitContent();
      
    } catch (error) {
      console.error(`Failed to initialize unit ${this.unitId}:`, error);
      this.showLoadError(error);
    }
  }
  
  private async loadLessonData(): Promise<void> {
    if (!this.unit) return;
    
    // Load each lesson's data in parallel
    const loadPromises = this.unit.lessons.map(async (lessonId) => {
      try {
        const lesson = await loadLesson(lessonId);
        this.lessonData.set(lessonId, lesson);
      } catch (error) {
        console.error(`Failed to load lesson ${lessonId}:`, error);
        // Continue with other lessons even if one fails
      }
    });
    
    await Promise.all(loadPromises);
  }
  
  private renderUnitContent(): void {
    if (!this.unit) return;
    
    const unitContainer = document.getElementById('unit-content');
    if (!unitContainer) return;
    
    // Clear loading message
    unitContainer.innerHTML = '';
    
    // Add back to units link
    const backLink = document.createElement('a');
    backLink.href = `${BASE_PATH}/index.html`;
    backLink.className = 'back-to-units';
    backLink.innerHTML = '&larr; Back to Learning Paths';
    unitContainer.appendChild(backLink);
    
    // Create unit header
    const unitHeader = document.createElement('div');
    unitHeader.className = 'unit-header';
    unitHeader.innerHTML = `
      <h2>${this.unit.title}</h2>
      <p>${this.unit.description}</p>
    `;
    unitContainer.appendChild(unitHeader);
    
    // Create lessons list
    const lessonsContainer = document.createElement('div');
    lessonsContainer.className = 'lessons-list';
    
    // Add each lesson card
    this.unit.lessons.forEach((lessonId, index) => {
      const lesson = this.lessonData.get(lessonId);
      if (!lesson) return; // Skip if lesson data not loaded
      
      const lessonCard = document.createElement('a');
      lessonCard.href = `${BASE_PATH}/${lessonId}.html`;
      lessonCard.className = 'lesson-card';
      
      // Get completion status
      const completionStatus = this.getLessonCompletionStatus(lessonId);
      
      lessonCard.innerHTML = `
        <div class="lesson-number">Lesson ${index + 1}</div>
        <h3>${lesson.title}</h3>
        <p class="lesson-description">${lesson.description}</p>
        <div class="lesson-status">
          <span class="status-dot status-${completionStatus.class}"></span>
          ${completionStatus.text}
        </div>
      `;
      
      lessonsContainer.appendChild(lessonCard);
    });
    
    unitContainer.appendChild(lessonsContainer);
  }
  
  private getLessonCompletionStatus(lessonId: string): { text: string; class: string } {
    try {
      // Check if the lesson has any completed sections
      const storageKey = `python_${lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (completedSections.length === 0) {
        return { text: 'Not started', class: 'not-started' };
      }
      
      // Get the cached lesson data to check for total required sections
      const cachedLessonData = JSON.parse(localStorage.getItem(`python_${lessonId}_data`) || 'null');
      if (!cachedLessonData) {
        return { text: 'In progress', class: 'in-progress' };
      }
      
      // Get required sections from the cached data
      const requiredSections = getRequiredSections(cachedLessonData);
      
      // Calculate completion status
      if (requiredSections.length === 0) {
        // If no required sections, just show in progress
        return { text: 'In progress', class: 'in-progress' };
      }
      
      // Check how many required sections are completed
      const completedRequiredCount = requiredSections.filter(section => 
        completedSections.includes(section)
      ).length;
      
      if (completedRequiredCount >= requiredSections.length) {
        return { text: 'Completed', class: 'completed' };
      } else {
        const percentage = Math.floor((completedRequiredCount / requiredSections.length) * 100);
        return { text: `${percentage}% complete`, class: 'in-progress' };
      }
    } catch (error) {
      console.warn(`Failed to check lesson completion status for ${lessonId}:`, error);
      return { text: 'Not started', class: 'not-started' };
    }
  }
  
  private showLoadError(error: any): void {
    const contentContainer = document.getElementById('unit-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="load-error">
          <h3>Failed to Load Unit</h3>
          <p>We couldn't load the unit content. Please try refreshing the page.</p>
          <pre>${error.toString()}</pre>
        </div>
      `;
    }
  }
}