// src/ts/lessons/lesson_7.ts
import '../../css/base.css';
import '../../css/lessons.css';
import '../../css/exercises.css';

import { ReflectionLessonController } from '../controllers/reflection-lesson-controller';

class Lesson7Controller extends ReflectionLessonController {
  constructor() {
    super('lesson_7');
  }
  
  // All core functionality is inherited from the base class
}

// Create and export the controller instance
const lesson7Controller = new Lesson7Controller();
export default lesson7Controller;