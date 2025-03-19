// src/ts/lessons/coverage-lesson.ts
import '../../css/base.css';
import '../../css/lessons.css';
import '../../css/exercises.css';

import { CoverageLessonController } from '../controllers/coverage-lesson-controller';

/**
 * Controller for Coverage Lessons
 * Uses the CoverageLessonController which handles all coverage functionality
 */
class CoverageLesson extends CoverageLessonController {
  constructor() {
    super('lesson_8');
  }
  
  // No additional code needed - all functionality is inherited from the base class
}

// Create and export the controller instance
// Update with the correct lesson ID
const coverageLessonController = new CoverageLesson();
export default coverageLessonController;
