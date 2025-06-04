import type { Lesson, PredictionSectionData } from "../../../types/data";

const lessonData: Lesson = {
  title: "Predicting Function Output",
  guid: "5c3c6f3b-722f-4b19-b3ed-d532b7961f92",
  description:
    "Practice predicting how functions will behave with different inputs without running code, an essential skill for effective programming.",
  sections: [
    {
      kind: "Information",
      id: "understanding",
      title: "Understanding Function Behavior",
      content:
        "Being able to predict how a function behaves is a crucial skill for programmers. In this exercise, you'll analyze a function and predict its output for different inputs without running the code.",
    },
    {
      kind: "Prediction",
      id: "prediction",
      title: "Predict the Output",
      content:
        'For each set of inputs below, predict what the function will return. Type your answer in the "Output" column.',
      functionDisplay: {
        title: "Function: Find the Largest of Three Numbers",
        code: 'def find_largest(a, b, c):\n    """Find the largest of three numbers"""\n    if a >= b and a >= c:\n        return a\n    elif b >= a and b >= c:\n        return b\n    else:\n        return c',
      },
      predictionTable: {
        columns: ["a", "b", "c", "Your Prediction", "Status"],
        rows: [
          {
            inputs: [5, 3, 1],
            expected: 5,
            description: "First number is largest",
          },
          {
            inputs: [2, 7, 5],
            expected: 7,
            description: "Second number is largest",
          },
          {
            inputs: [8, 8, 4],
            expected: 8,
            description: "First and second numbers are equal and largest",
          },
          {
            inputs: [-1, -3, -5],
            expected: -1,
            description: "All negative numbers",
          },
        ],
      },
      completionMessage:
        "Great job! You've correctly predicted all the function outputs. This shows you understand how the function evaluates different inputs.",
    } as PredictionSectionData,
    {
      kind: "Information",
      id: "explanation",
      title: "Understanding the Logic",
      content:
        "The find_largest function works by:\n1. Comparing a with both b and c. If a is greater than or equal to both, it returns a.\n2. If the first condition fails, it checks if b is greater than or equal to both a and c. If true, it returns b.\n3. If neither condition is true, it returns c.\n\nThis function has some interesting edge cases. What happens when two or all three numbers are equal? The function will return the first number in the comparison that satisfies the condition.",
    },
  ],
};

export default lessonData;
