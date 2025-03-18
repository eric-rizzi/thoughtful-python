// lesson_5.ts - Quiz lesson
import '../../css/base.css';
import '../../css/lessons.css';
import '../../css/exercises.css';

import { QuizLessonController } from '../controllers/quiz-lesson-controller';

/**
 * Controller for Lesson 5 - Python Knowledge Quiz
 * Uses the QuizLessonController which handles all quiz functionality
 */
class Lesson5Controller extends QuizLessonController {
  constructor() {
    super('lesson_5');
  }
  
  // No additional code needed - all functionality is inherited from the base class
}

// Create and export the controller instance
const lesson5Controller = new Lesson5Controller();
export default lesson5Controller;