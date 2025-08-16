import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  PRIMMSectionData,
  TestingSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Functions Everywhere",
  guid: "ab95ab6a-a2ff-46af-b63c-1066b16fce49" as LessonId,
  description:
    "Discover how Python's built-in functions work and learn to use libraries to extend your programming power.",
  sections: [
    {
      kind: "Information",
      id: "functions-everywhere-intro",
      title: "Functions Everywhere",
      content: [
        {
          kind: "text",
          value:
            "Functions are everywhere in Python. In the previous unit you learned how to make and use your own functions, but you've actually been **using functions from the very beginning**: namely `print()`. The `print()` function takes what you want to show the user as input. \"Inside\" the `print()` function there's lots of code, including calls to other, sub-functions. A single call to `print()` ends up calling layers upon layers of functions that interact with the deepest parts of the computer to change the proper pixels.\n\nIn addition to `print()`, Python provides hundreds of different functions for free. They're part of the \"standard library\" and are the building blocks of many different programs. In this lesson, you'll experience different parts of the Python standard library and see why functions are so powerful.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleSelection",
      id: "function-uses-1",
      title: "Using Functions",
      content: [
        {
          kind: "text",
          value: "Why are functions so useful? Select all that apply.",
        },
      ],
      options: [
        "They let you reuse code without copying and pasting",
        "They make programs run faster",
        "They organize code into logical chunks",
        "They require less memory",
        "They allow you to build on existing functionality",
      ],
      correctAnswers: [0, 2, 4],
      feedback: {
        correct:
          "Correct! Functions help organize, reuse, and build upon code.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "MultipleChoice",
      id: "function-complexity",
      title: "Inside of Functions",
      content: [
        {
          kind: "text",
          value:
            'How many instructions get executed to do a simple `print("Hello, World")` call?',
        },
      ],
      options: [
        "Just 1 - the print statement itself",
        "About 10-20 instructions",
        "Hundreds or thousands of instructions",
        "Millions or billions of instructions",
      ],
      correctAnswer: 3,
      feedback: {
        correct:
          "Correct! A simple print() call triggers an enormous cascade of operations. Modern computers do billions of operations per second, and even 'simple' tasks involve staggering complexity.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Observation",
      id: "random-library" as SectionId,
      title: "Using Libraries",
      content: [
        {
          kind: "text",
          value:
            "Python provides hundreds of different libraries for programmers to use. Libraries are collections of related functions that some other programmer has written. There are two parts to using a function from a library:\n1. **Import** the library\n2. **Use** the function in the library\n\nYou can think of this in terms of an actual library. In order to read a book, you first have to check out the book, then you have to read a particular page of that book.\n\nThe first library you're going to experience is `random`. Randomness is a really common requirement in many programs, which is why Python provides a series of random functions for anyone to use. Run the code below a few times and see how the output value changes.",
        },
      ],
      example: {
        visualization: "console",
        initialCode: "import random\n\nx = random.randint(1, 10)\nprint(x)",
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "import-random-purpose",
      title: "Importing Libraries",
      content: [
        {
          kind: "text",
          value: "What does the line `import random` do?",
        },
      ],
      options: [
        "Creates a random number immediately",
        "Makes the random library's functions available to use",
        "Prints random text to the screen",
        "Generates a random error",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Import makes all the functions in the random library available for you to use in your program.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "randint-inputs",
      title: "Function Inputs",
      content: [
        {
          kind: "text",
          value: "How many inputs does the `random.randint()` function take?",
        },
      ],
      options: ["0", "1", "2", "3"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! `randint()` takes 2 inputs: the minimum value and the maximum value for the random number.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "randint-purpose",
      title: "Understanding randint",
      content: [
        {
          kind: "text",
          value:
            "Based on the code example, what does `random.randint(1, 10)` do?",
        },
      ],
      options: [
        "Always returns the number 1",
        "Creates a random integer between 1 and 10 (including 1 and 10)",
        "Creates a random integer between 1 and 10 (not including 1 and 10)",
        "Creates either 1 or 10",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! `randint()` creates a random integer between the first and second input, including both endpoints.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "random-choice-primm" as SectionId,
      title: "Random Choices",
      content: [
        {
          kind: "text",
          value:
            "The `random` library has more functions than just `randint()`. Below is a program that uses a different random function. Predict what you think the code will output, then run it several times to check your prediction.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'import random\n\ncolors = "roygbiv"\nchosen = random.choice(colors)\nprint(chosen)',
      },
      predictPrompt: "What do you think this program does?",
      conclusion:
        "The `random.choice()` function picks a random character from a string!",
    } as PRIMMSectionData,
    {
      kind: "Observation",
      id: "math-library" as SectionId,
      title: "Math Functions",
      content: [
        {
          kind: "text",
          value:
            "Python also provides a `math` library with advanced mathematical functions. Just like with `random`, you need to import it first.\n\nRun the code below and observe what different math functions do:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "import math\n\nprint(math.sqrt(16))\nprint(math.pow(2, 3))\nprint(math.floor(4.7))\nprint(math.ceil(4.2))",
      },
    } as ObservationSectionData,
    {
      kind: "Testing",
      id: "dice-roller" as SectionId,
      title: "Challenge: Dice Roller",
      content: [
        {
          kind: "text",
          value:
            "Create a program that simulates rolling two six-sided dice. Your program should:\n1. Import the random library\n2. Generate two random numbers between 1 and 6\n3. Print each die value\n4. Print the total\n\nExample output:\n```\nDie 1:\n4\nDie 2\b2\nTotal\n6\n```",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "# Import the random library\n\n# Generate two random dice values\n\n# Print the results\n",
      },
      testCases: [
        {
          input: [null],
          expected: "REGEX:Die 1: [1-6]\\nDie 2: [1-6]\\nTotal: ([2-9]|1[0-2])",
          description: "Test dice output format and valid totals",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "library-reflection" as SectionId,
      title: "Libraries Reflection",
      content: [
        {
          kind: "text",
          value:
            "Libraries are collections of functions that extend Python's capabilities. Without libraries, you'd have to write every function from scratch. The `import` statement is like checking out a book from a library - it gives you access to all the functions inside.\n\nCreate a simple 3-4 line example that uses either the `random` or `math` library, and explain how libraries make programming more powerful. Remember to use the phrase \"as seen in the example above\".",
        },
      ],
      topic: "Using Python Libraries",
      isTopicPredefined: true,
      code: "Create an example using random or math library",
      isCodePredefined: false,
      explanation: "Explain how libraries help programmers (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "library-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Congratulations! You've learned that functions aren't just things you create - they're everywhere in Python. From the humble `print()` to the powerful `random` and `math` libraries, functions are the building blocks that let you create amazing programs.\n\nIn the next lesson, we'll explore a fun library called `turtle` that lets you create graphics by commanding a virtual turtle to move around the screen!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
