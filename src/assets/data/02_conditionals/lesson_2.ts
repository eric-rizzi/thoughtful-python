import type {
  Lesson,
  MultipleChoiceSectionData,
  PRIMMSectionData,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Debugging Conditionals",
  description:
    "Learn to identify and fix common syntax errors related to conditional statements.",
  sections: [
    {
      kind: "Information",
      id: "cond2-intro",
      title: "Finding and Fixing Errors",
      content:
        "Syntax errors prevent your code from running. Learning to read error messages and identify common mistakes (like typos or incorrect operators) is a crucial debugging skill. Let's look at some code with errors.",
    },
    {
      kind: "PRIMM",
      id: "primm-syntax-errors",
      title: "Predict, Run, Investigate: Syntax Errors",
      content:
        "This code intends to ask if someone is a student and print a message. However, it contains syntax errors. Predict what will happen when you try to run it.",
      examples: [
        {
          id: "primm-syntax-example",
          code: '# CODE WITH ERRORS (for display only):\nanswer = input("Are you a student? ")\nif answer.lower() = "yes": # Error 1: Assignment instead of comparison\n  print("Good luck on your tests!")\n  else: # Error 2: IndentationError\n  print("Pay your rent!")',
          predictPrompt:
            "This code has two main syntax errors. Where do you think the FIRST error Python will report occurs, and what kind of error might it be?",
        },
      ],
      conclusion:
        "Python stops at the first `SyntaxError` it finds. Using a single equals sign `=` for comparison instead of `==` is a common mistake. Always use `==` when checking for equality in conditions!",
    } as PRIMMSectionData,
    {
      kind: "Information",
      id: "cond2-explain-errors",
      title: "Understanding the Errors",
      content:
        'The code had two primary errors:\n1. **`SyntaxError: invalid syntax`** on the line `if answer.lower() = "yes":`. This is because `=` is used for *assignment*, while `==` is used for *comparison*. The `if` statement requires a comparison.\n2. **`IndentationError: expected an indented block`** (or similar) pointing to the `else:` line. This occurs because the `else:` keyword must be at the same indentation level as its corresponding `if` statement. In the original code, it was indented further.',
    },
    {
      kind: "MultipleChoice",
      id: "cond2-q-lower-helpful",
      title: "Why Use `.lower()` Here?",
      content:
        'Why is using `answer.lower()` helpful in the condition `if answer.lower() == "yes":` (once the syntax errors are fixed)?',
      options: [
        "It converts the answer to uppercase.",
        "It makes the code run faster.",
        "It allows the user to type 'yes', 'YES', 'Yes', etc., and still have the condition be true.",
        "It's required before using the `==` operator.",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! It makes the comparison case-insensitive, so the user's input matches 'yes' regardless of capitalization.",
        incorrect:
          "The `.lower()` method converts the string to all lowercase letters, making the comparison flexible regarding the user's input capitalization.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "cond2-task-fix",
      title: "Challenge: Fixing the Syntax",
      content:
        "Fix both syntax errors (`=` vs `==` and the indentation of `else`) in the provided code so that it runs correctly.",
      example: {
        id: "cond2-challenge-code",
        title: "Implement Your Fixes",
        description: "Correct the code below.",
        code: '# CODE WITH ERRORS:\nanswer = input("Are you a student? (y/n) ") # Changed prompt slightly\nif answer.lower() = "y": # Fix 1: Comparison operator\n  print("Good luck on your tests!")\n  else: # Fix 2: Indentation\n  print("Pay your rent!")',
        testCases: [
          {
            input: "y",
            expected: "Good luck on your tests!",
            description: "Input 'y'",
          },
          {
            input: "Y",
            expected: "Good luck on your tests!",
            description: "Input 'Y'",
          },
          {
            input: "yes",
            expected: "Pay your rent!",
            description: "Input 'yes' (doesn't match 'y')",
          },
          {
            input: "n",
            expected: "Pay your rent!",
            description: "Input 'n'",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
  ],
};

export default lessonData;
