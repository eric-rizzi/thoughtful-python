import type {
  Lesson,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  ReflectionSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "String Manipulation Review",
  guid: "3ed77482-b004-49dd-bc5d-e588f42883aa",
  description:
    "Reflect on key concepts related to strings and data types in Python.",
  sections: [
    {
      kind: "Information",
      id: "reflection-intro",
      title: "Reflecting on Strings and Data Types",
      content:
        "Throughout the previous lessons, you've worked with strings, user input, f-string formatting, and the importance of data types. This final lesson in the 'Strings' unit is a chance to consolidate your understanding.",
    },
    {
      kind: "MultipleChoice",
      id: "reflection-q1-importance-types",
      title: "Remembering Data Types",
      content:
        "Based on your experiences in the previous lessons (like the 'age calculation' problem), what is one of the most important things to remember about data types when working with user input in Python?",
      options: [
        "Data types are only important for numbers, not for text.",
        "Python automatically converts all input to the correct data type needed for operations.",
        "The `input()` function returns a string, which often needs to be explicitly converted (e.g., to `int` or `float`) before performing mathematical operations.",
        "You should always use f-strings to avoid type errors.",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! This is a crucial takeaway. `input()` gives you a string, and for math, you almost always need to convert it using `int()`, `float()`, etc.",
        incorrect:
          "Consider the `TypeError` encountered when trying to add `1` to the age string directly from `input()`. This highlights the need for explicit type conversion.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleSelection",
      id: "reflection-q2-interpreting-errors",
      title: "Interpreting Error Messages",
      content:
        "Being able to interpret error messages is a vital programming skill. Which of the following are generally helpful pieces of information provided by Python error messages (like a `TypeError` or `ValueError`)? (Select all that apply)",
      options: [
        "The type of error (e.g., TypeError, ValueError).",
        "The line number where Python detected the error.",
        "A brief description of what went wrong.",
        "A suggested way to fix the error.",
        "The names of all variables currently in memory.",
      ],
      correctAnswers: [0, 1, 2],
      feedback: {
        correct:
          "Excellent! Error messages typically tell you the type of error, the line number, and give a description. While Python doesn't always offer a direct fix, this information is key to debugging.",
        incorrect:
          "Python error messages are very informative. They usually specify the error type, the line where it occurred, and a description. While they don't always give a direct solution, they provide essential clues for debugging.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Reflection",
      id: "strings-final-thoughts",
      title: "Final Thoughts on Strings",
      content:
        "Reflect on what you've learned about Python strings in this unit. Create a small code snippet that demonstrates a string manipulation technique you find useful or interesting, and explain it.",
      topic:
        "What string manipulation technique or concept are you demonstrating (e.g., slicing, methods like .upper(), f-strings, concatenation)?",
      isTopicPredefined: false,
      code: "Write a short Python code snippet (3-5 lines) demonstrating this technique.",
      isCodePredefined: false,
      explanation:
        "Briefly explain what your code does and why this technique is useful.",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "strings-unit-conclusion",
      title: "Congratulations!",
      content:
        "You've completed the 'Python Strings Deep Dive' unit! You've practiced using f-strings, handling type conversions, and even built a creative Mad Libs project. Understanding how to work with strings is essential for almost any Python programming task.\n\nKeep practicing these concepts, and you'll become more comfortable manipulating text data in Python.",
    },
  ],
};

export default lessonData;
