// lesson_3.ts - Refactored to use the base controller classes
import '../../css/main.css';
import '../../css/lessons.css';
import '../../css/challenges.css';
import '../../css/lesson_3.css';
import '../../css/lesson_4.css';

import { PredictionLessonController } from '../controllers/prediction-lesson-controller';

class Lesson3Controller extends PredictionLessonController {
  constructor() {
    super('lesson_3');
  }
  
  // All core functionality is inherited from the base classes
}

// Create and export the controller instance
const lesson3Controller = new Lesson3Controller();
export default lesson3Controller;