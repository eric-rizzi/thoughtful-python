import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  PRIMMSectionData,
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
            "In the previous unit you learned how to create and use your own functions, but you've actually been **using functions from the very beginning**: namely `print()`. The `print()` function takes what you want to show the user as input. \"Inside\" the `print()` function there's lots of code, including calls to other, sub-functions. A single call to `print()` ends up calling layers upon layers of functions that interact with the deepest parts of the computer to change the proper pixels.",
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
          "Correct! A print() call triggers an enormous cascade of operations. Computers do billions of operations per second, and even 'simple' tasks involve staggering complexity.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "functions-into-libraries",
      title: "Arranging Functions",
      content: [
        {
          kind: "text",
          value:
            'In addition to `print()`, Python provides hundreds of different functions for free. These functions are arranged into "libraries" of related functions and are the building blocks of many different programs.\n\nThere are two steps in using a function from a library:\n1. **Import** the library so it\'s functions are available to use\n2. **Use** one of the functions in the library.',
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "random-library" as SectionId,
      title: "Using Libraries",
      content: [
        {
          kind: "text",
          value:
            "The first library we're going to use is the `random` library. Randomness is a really common requirement in many programs, which is why Python provides a bunch of random functions for anyone to use. In this case, we're going to use the `randint()` function from the `random` library. Run the code below **a few times** and see how the output value changes.",
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
      kind: "PRIMM",
      id: "math-ceil-primm" as SectionId,
      title: "The Ceiling",
      content: [
        {
          kind: "text",
          value:
            "The small snippet of code below does two things. First, it imports the `math` library. Then it uses the `ceil()` function within the `math` library on a number with a decimal point. Predict what you think the code will output, then check your prediction.",
        },
      ],
      example: {
        visualization: "console",
        initialCode: "import math\n\nprint(math.ceil(4.2))",
      },
      predictPrompt: "What do you think this program does?",
      conclusion:
        "The `math.ceil()` function takes a number with a decimal point and rounds up to the nearest integer.",
    } as PRIMMSectionData,
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
