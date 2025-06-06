import type {
  Lesson,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Python Knowledge Quiz",
  guid: "3ad2a551-618e-4398-918a-02342f824ab1",
  description:
    "Test your knowledge of Python fundamentals with this interactive quiz.",
  sections: [
    {
      kind: "Information",
      id: "quiz-intro",
      title: "Quiz Introduction",
      content:
        "This quiz will test your understanding of the Python concepts we've covered in the previous lessons. Complete all questions to demonstrate your knowledge. Each question you answer correctly will be marked with a checkmark in the sidebar.",
    },
    {
      kind: "MultipleChoice",
      id: "question-1",
      title: "Question 1: Print Function",
      content: "What is the primary purpose of the print() function in Python?",
      options: [
        "To create a printed copy of your code",
        "To display output to the console",
        "To format Python code properly",
        "To save data to a file",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! The print() function is used to display output to the console.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "question-2",
      title: "Question 2: Function Definition",
      content:
        "Which of the following is the correct way to define a function in Python?",
      options: [
        "function my_function():",
        "def my_function():",
        "define my_function():",
        "func my_function():",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! In Python, functions are defined using the 'def' keyword followed by the function name and parentheses.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "question-3",
      title: "Question 3: Temperature Conversion",
      content: "What is the result of calling celsius_to_fahrenheit(0)?",
      options: ["0", "32", "100", "273.15"],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! When converting 0°C to Fahrenheit using the formula F = (C x 9/5) + 32, we get 32°F.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "question-4",
      title: "Question 4: Lists in Python",
      content: "Which of the following correctly creates a list in Python?",
      options: [
        "my_list = (1, 2, 3, 4)",
        "my_list = {1, 2, 3, 4}",
        "my_list = [1, 2, 3, 4]",
        "my_list = <1, 2, 3, 4>",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! Lists in Python are created using square brackets [].",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleSelection",
      id: "question-5",
      title: "Question 5: Valid Python Data Structures",
      content:
        "Which of the following are built-in data structures in Python? (Select all that apply)",
      options: ["Lists", "Dictionaries", "Arrays", "Sets", "Tuples", "Structs"],
      correctAnswers: [0, 1, 3, 4],
      feedback: {
        correct:
          "Correct! Lists, dictionaries, sets, and tuples are all built-in data structures in Python.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "MultipleSelection",
      id: "question-6",
      title: "Question 6: Comments in Python",
      content:
        "Which of the following are valid ways to create comments in Python? (Select all that apply)",
      options: [
        "// This is a comment",
        "# This is a comment",
        "/* This is a comment */",
        "''' This is a multi-line comment '''",
        "<!-- This is a comment -->",
      ],
      correctAnswers: [1, 3],
      feedback: {
        correct:
          "Correct! In Python, you can use the # symbol for single-line comments and triple quotes (''' or \"\"\") for multi-line comments or docstrings.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Information",
      id: "quiz-conclusion",
      title: "Quiz Conclusion",
      content:
        "Congratulations on completing the Python fundamentals quiz! Your results show how well you've grasped the core concepts we've covered so far. If you missed any questions, consider revisiting the related lessons to strengthen your understanding.",
    },
  ],
};

export default lessonData;
