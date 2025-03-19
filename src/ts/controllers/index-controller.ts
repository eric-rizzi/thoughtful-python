// src/ts/controllers/index-controller.ts
import { loadUnits, Unit } from '../utils/units-loader';
import { BASE_PATH } from '../config';

export class IndexController {
  constructor() {
    // Initialize the controller
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }
  
  private async initialize(): Promise<void> {
    try {
      // Load units data
      const unitsData = await loadUnits();
      
      // Render units on the page
      this.renderUnits(unitsData.units);
    } catch (error) {
      console.error('Failed to initialize index controller:', error);
      this.showLoadError(error);
    }
  }
  
  private renderUnits(units: Unit[]): void {
    const unitsContainer = document.getElementById('units-container');
    if (!unitsContainer) return;
    
    // Clear loading message
    unitsContainer.innerHTML = '';
    
    if (units.length === 0) {
      unitsContainer.innerHTML = '<p>No learning paths available yet. Check back soon!</p>';
      return;
    }
    
    // Create a card for each unit
    units.forEach(unit => {
      const unitCard = document.createElement('a');
      unitCard.href = `${BASE_PATH}/unit.html?id=${unit.id}`;
      unitCard.className = 'unit-card';
      
      // Prepare the image or use a default
      const imagePath = unit.image 
        ? `${BASE_PATH}/images/${unit.image}`
        : `${BASE_PATH}/images/default-unit.png`;
      
      unitCard.innerHTML = `
        <div class="unit-image">
          <img src="${imagePath}" alt="${unit.title}" onerror="this.src='${BASE_PATH}/images/default-unit.png'">
        </div>
        <div class="unit-content">
          <h3 class="unit-title">${unit.title}</h3>
          <p class="unit-description">${unit.description}</p>
          <div class="unit-lessons">${unit.lessons.length} lessons</div>
          <div class="unit-button">Start Learning</div>
        </div>
      `;
      
      unitsContainer.appendChild(unitCard);
    });
  }
  
  private showLoadError(error: any): void {
    const unitsContainer = document.getElementById('units-container');
    if (unitsContainer) {
      unitsContainer.innerHTML = `
        <div class="load-error">
          <h3>Failed to Load Learning Paths</h3>
          <p>We couldn't load the available learning paths. Please try refreshing the page.</p>
          <pre>${error.toString()}</pre>
        </div>
      `;
    }
  }
}