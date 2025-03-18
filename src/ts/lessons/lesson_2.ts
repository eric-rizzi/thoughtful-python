// lesson_2.ts - Simplified to use the enhanced base controller
import '../../css/base.css';
import '../../css/lessons.css';
import '../../css/exercises.css';

import { CodeLessonController } from '../controllers/code-lesson-controller';

/**
 * Controller for Lesson 2 - Functions and Temperature Conversion
 * Uses the base CodeLessonController which handles all functionality
 */
class Lesson2Controller extends CodeLessonController {
  constructor() {
    super('lesson_2');
  }
  
  // No additional code needed - all functionality is inherited from the base class
}

// Create and export the controller instance
const lesson2Controller = new Lesson2Controller();
export default lesson2Controller;