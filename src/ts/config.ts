// Map lesson IDs to their controller types
export const LESSON_CONTROLLER_TYPES: { [key: string]: string } = {
  'lesson_1': 'code',
  'lesson_2': 'code',
  'lesson_3': 'prediction',
  'lesson_4': 'code',
  'lesson_5': 'quiz',
  'lesson_6': 'turtle',
  'lesson_7': 'reflection'
};

export const LESSON_TITLES: { [key: string]: string } = {
  'lesson_1': 'Basics',
  'lesson_2': 'Functions',
  'lesson_3': 'Control Flow',
  'lesson_4': 'Data Structures',
  'lesson_5': 'Python Quiz',
  'lesson_6': 'Turtles!',
  'lesson_7': 'Reflection!'
};

export const TOTAL_LESSONS = 7;

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const REPO_NAME = 'thoughtful-python';
export const BASE_PATH = IS_PRODUCTION ? `/${REPO_NAME}` : '';
