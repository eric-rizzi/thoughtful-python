// src/ts/pages/unit.ts
import '../../css/base.css';
import '../../css/units.css';

import { UnitController } from '../controllers/unit-controller';
import { initializePageLayout } from '../utils/html-loader';

// Get the unit ID from the URL query parameter
function getUnitIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

document.addEventListener('DOMContentLoaded', () => {
  // Get the unit ID from the URL
  const unitId = getUnitIdFromUrl();
  
  if (!unitId) {
    // No unit ID provided - show error
    const contentContainer = document.getElementById('unit-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="load-error">
          <h3>Unit Not Found</h3>
          <p>No unit ID was provided. Please return to the home page and select a learning path.</p>
          <a href="index.html" class="back-to-units">Back to Learning Paths</a>
        </div>
      `;
    }
    return;
  }
  
  // Initialize common page components
  initializePageLayout('unit');
  
  // Create the unit controller
  new UnitController(unitId);
});