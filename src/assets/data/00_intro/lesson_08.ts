import type {
  CoverageSectionData,
  InformationSectionData,
  Lesson,
  LessonId,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Code Coverage and Execution Paths",
  guid: "d6b6048d-ebb0-4ac8-9b06-60ad1134ef98" as LessonId,
  description:
    "Learn to understand how code executes by exploring different execution paths through a program.",
  sections: [
    {
      kind: "Information",
      id: "coverage-intro",
      title: "Understanding Code Coverage",
      content: [
        {
          kind: "text",
          value:
            "Code coverage is a measure of how much of your code is executed during testing. In this lesson, you'll explore different execution paths through a program by providing inputs that trigger specific code paths.\n\nThis exercise will help you understand how conditionals work and how different inputs affect which lines of code are executed.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Coverage",
      id: "simple-coverage",
      title: "Simple Branching Exercise",
      content: [
        {
          kind: "text",
          value:
            "Let's start with a simple example. The following function analyzes a number and prints different messages based on its value. Try to find inputs that will reach each part of the code.",
        },
      ],
      code: 'def analyze_number(x):\n    if x < 0:\n        print("Line 1")\n        if x < -10:\n            print("Line 2")\n    elif x == 0:\n        print("Line 3")\n    else:  # x > 0\n        print("Line 4")\n        if x > 10:\n            print("Line 5")\n        if x % 2 == 0:\n            print("Line 6")\n        if x % 3 == 0:\n            print("Line 7")\n\n# Call the function with the input value\nanalyze_number(input_var_1_here)',
      coverageChallenges: [
        {
          id: "challenge-1",
          expectedOutput: "Line 1",
          hint: "Try a negative number that's greater than -10.",
        },
        {
          id: "challenge-2",
          expectedOutput: "Line 3",
          hint: "What number equals zero?",
        },
        {
          id: "challenge-3",
          expectedOutput: "Line 4",
          hint: "Try a positive even number that's not greater than 10.",
        },
      ],
      inputParams: [
        {
          name: "input_var_1_here",
          type: "number",
          placeholder: "Enter a number",
        },
      ],
    } as CoverageSectionData,
    {
      kind: "Information",
      id: "coverage-conclusion",
      title: "Understanding Code Paths",
      content: [
        {
          kind: "text",
          value:
            'Great job exploring different execution paths through code! Understanding how inputs affect which parts of code execute is a critical skill for programming.\n\nKey takeaways:\n\n1. Each condition in your code creates a branch point where execution can go in different directions.\n2. When you have nested conditions, you must satisfy all parent conditions to reach the inner code blocks.\n3. The same output can sometimes be produced by different inputs, but the execution paths may differ.\n4. Testing edge cases (like zero, negative numbers, boundary values) is important to ensure all code paths work correctly.\n\nIn real-world programming, tools called "code coverage analyzers" help developers measure which parts of their code are being executed by tests. Aiming for high code coverage helps ensure that your program has been thoroughly tested under different conditions.',
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
