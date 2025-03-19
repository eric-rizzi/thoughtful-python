// src/ts/pages/index.ts
import '../../css/base.css';
import '../../css/units.css';

import { IndexController } from '../controllers/index-controller';
import { initializePageLayout } from '../utils/html-loader';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize common page components
  initializePageLayout('index');
  
  // Create the index controller
  new IndexController();
});