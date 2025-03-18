// lesson_1.ts - Refactored to use the base controller classes
import '../../css/base.css';
import '../../css/lessons.css';
import '../../css/exercises.css';

import { CodeLessonController } from '../controllers/code-lesson-controller';

class Lesson1Controller extends CodeLessonController {
  constructor() {
    super('lesson_1');
  }
  
  // All core functionality is inherited from the base classes
}

// Create and export the controller instance
const lesson1Controller = new Lesson1Controller();
export default lesson1Controller;