// lesson-controller-factory.ts
import { CodeLessonController } from './controllers/code-lesson-controller';
import { PredictionLessonController } from './controllers/prediction-lesson-controller';
import { QuizLessonController } from './controllers/quiz-lesson-controller';
import { TurtleLessonController } from './controllers/turtle-lesson-controller';
import { ReflectionLessonController } from './controllers/reflection-lesson-controller';

// Map lesson IDs to their controller types
const LESSON_CONTROLLER_TYPES: { [key: string]: string } = {
  'lesson_1': 'code',
  'lesson_2': 'code',
  'lesson_3': 'prediction',
  'lesson_4': 'code',
  'lesson_5': 'quiz',
  'lesson_6': 'turtle',
  'lesson_7': 'reflection'
};

// Factory to create the appropriate controller based on lesson ID
export function createLessonController(lessonId: string) {
  const controllerType = LESSON_CONTROLLER_TYPES[lessonId] || 'code';
  
  switch (controllerType) {
    case 'prediction':
      return new PredictionLessonControllerImpl(lessonId);
    case 'quiz':
      return new QuizLessonControllerImpl(lessonId);
    case 'turtle':
      return new TurtleLessonControllerImpl(lessonId);
    case 'reflection':
      return new ReflectionLessonControllerImpl(lessonId);
    case 'code':
    default:
      return new CodeLessonControllerImpl(lessonId);
  }
}

// Concrete implementations 
class CodeLessonControllerImpl extends CodeLessonController {
  constructor(lessonId: string) { super(lessonId); }
}

class PredictionLessonControllerImpl extends PredictionLessonController {
  constructor(lessonId: string) { super(lessonId); }
}

class QuizLessonControllerImpl extends QuizLessonController {
  constructor(lessonId: string) { super(lessonId); }
}

class TurtleLessonControllerImpl extends TurtleLessonController {
  constructor(lessonId: string) { super(lessonId); }
}

class ReflectionLessonControllerImpl extends ReflectionLessonController {
  constructor(lessonId: string) { super(lessonId); }
}