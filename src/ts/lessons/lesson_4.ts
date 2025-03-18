// lesson_4.ts - Refactored to use the base controller classes
import '../../css/main.css';
import '../../css/lessons.css';
import '../../css/challenges.css';
import '../../css/lesson_4.css';

import { CodeLessonController } from '../utils/code-lesson-controller';

class Lesson4Controller extends CodeLessonController {
  constructor() {
    super('lesson_4');
  }
  
  // All core functionality is inherited from the base classes
}

// Create and export the controller instance
const lesson4Controller = new Lesson4Controller();
export default lesson4Controller;