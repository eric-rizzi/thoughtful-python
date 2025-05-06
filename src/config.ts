// src/config.ts

// Base path for deployment (e.g., '/' for root, '/repo-name/' for GitHub Pages)
// Vite automatically sets this based on the 'base' config in vite.config.ts
export const BASE_PATH = import.meta.env.BASE_URL;

// ... rest of your config ...
export const LESSON_CONTROLLER_TYPES: { [key: string]: string } = {
  lesson_1: "code",
  lesson_2: "code",
  lesson_3: "prediction",
  lesson_4: "code",
  lesson_5: "quiz",
  lesson_6: "turtle",
  lesson_7: "reflection",
  lesson_8: "coverage",
};

export const LESSON_TITLES: { [key: string]: string } = {
  lesson_1: "Basics",
  lesson_2: "Functions",
  lesson_3: "Control Flow",
  lesson_4: "Data Structures",
  lesson_5: "Python Quiz",
  lesson_6: "Turtles!",
  lesson_7: "Reflection!",
  lesson_8: "Code Coverage",
};

export const TOTAL_LESSONS = 8; // Make sure this matches your actual number of lessons
