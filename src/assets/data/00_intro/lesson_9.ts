import type { Lesson, ReflectionSection } from "../../../types/data";

const lessonData: Lesson = {
  title: "Lesson 9: Introduction to Debugging",
  description:
    "Learn to use the interactive debugger to step through your Python code, inspect variables, and understand execution flow.",
  sections: [
    {
      kind: "Information",
      id: "debugger-intro",
      title: "Understanding the Debugger",
      content:
        "Debugging is a crucial skill for programmers. It allows you to pause your program's execution, examine the state of variables, and step through the code line by line. This helps you find errors (bugs) and understand how your program works.\n\nBelow is a simple Python program. We will use the debugger to understand its execution.",
    },
    {
      kind: "Debugger",
      id: "first-debugging-challenge",
      title: "Debugger Challenge: Sum Calculator",
      code: 'def calculate_sum(limit):\n    total = 0\n    for i in range(1, limit + 1):\n        total += i\n    return total\n\nnum = 5\nresult = calculate_sum(num)\nprint(f"The sum up to {num} is {result}")',
    },
    {
      kind: "Reflection",
      id: "debugger-reflection",
      title: "Reflecting on Debugging",
      content:
        "Debugging is a powerful tool. What did you learn about how the program executes by using the debugger? How did the variables change throughout the loops and function calls?",
      prompts: {
        topic: "What did you learn about debugging and program execution?",
        code: "Paste the final code from the debugger here.",
        explanation:
          "Explain how observing the variables in the debugger helped you understand the `calculate_sum` function's execution flow, especially within the loop.",
      },
      rubric: {
        developing:
          "The explanation is brief or contains misconceptions about debugger usage or variable changes.",
        meets:
          "The explanation correctly describes how variables changed and how the debugger helped understand the execution flow.",
        exceeds:
          "The explanation provides insightful observations about the debugger's utility, potentially referencing the call stack or control flow in detail.",
      },
    } as ReflectionSection,
    {
      kind: "Information",
      id: "debugger-conclusion",
      title: "Conclusion: Power of Debugging",
      content:
        "You've just experienced the power of a debugger! It's an invaluable tool for identifying bugs, understanding complex logic, and gaining a deeper insight into how your code behaves. Keep practicing with the debugger as you write more complex programs.",
    },
  ],
};

export default lessonData;
