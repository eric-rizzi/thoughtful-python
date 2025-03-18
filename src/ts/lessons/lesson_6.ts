// lesson_6.ts - Turtle Graphics Challenge
import '../css/base.css';
import '../css/lessons.css';
import '../css/exercises.css';

import { TurtleLessonController } from '../controllers/turtle-lesson-controller';

/**
 * Controller for Lesson 6 - Turtle Graphics Challenge
 * Uses the TurtleLessonController which handles all turtle functionality
 */
class Lesson6Controller extends TurtleLessonController {
  constructor() {
    super('lesson_6');
  }
  
  // No additional code needed - all functionality is inherited from the base class
}

// Create and export the controller instance
const lesson6Controller = new Lesson6Controller();
export default lesson6Controller;