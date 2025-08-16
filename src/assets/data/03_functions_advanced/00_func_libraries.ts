import type {
  CoverageSectionData,
  InformationSectionData,
  Lesson,
  LessonId,
  MatchingSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  ObservationSectionData,
  SectionId,
  TestingSectionData,
  TurtleSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "The Power of Functions",
  guid: "973a0fb8-67fa-463d-a12d-0df9f55eb547" as LessonId,
  description:
    "Experience how functions help encapsulate complex ideas to make building programs easier.",
  sections: [
    {
      kind: "Information",
      id: "functions-everywhere-intro",
      title: "Functions Everywhere",
      content: [
        {
          kind: "text",
          value:
            "Functions are everywhere in Python. In this unit you've learned how to make and use your own functions, but you actually have been **using functions from the very beginning**: namely `print()`. `print()` is a function that takes what you want to show the user as input. \"Inside\" the `print()` function there's lots of code, including calls to other, sub-functions. A single call to `print()` ends up calling layers upon layers of functions that interact with the deepest parts of the computer to change the proper pixels.\n\nIn addition to `print()`, Python provides a bunch of different functions for free. They're part of the \"standard library\" and are the building blocks of many different programs. In this lesson, you'll experience different parts of the Python standard library and see why functions are so powerful.",
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
          value: "Why are functions so useful?",
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
        correct: "Correct!",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "MultipleChoice",
      id: "function-uses-1",
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
      id: "print-function" as SectionId,
      title: "Functions Everywhere",
      content: [
        {
          kind: "text",
          value:
            "Python provides hundreds of different libraries for programmers to use. Libraries are a bunch of related functions that some other programmer has written. There are two parts to using a function from a library:\n1. Import the library\n2. Use the function in the library\nYou can think of this in terms of an actual library. In order to read a book, you first have to check out the book, then you have to read a particular page of that book.\n\nThe first library you're going to experience is `random`. Randomness is a really common requirement in many programs, which is why Python provides a series of random functions for anyone that wants to use it. Run the code below a few times and see how the output value changes.",
        },
      ],
      example: {
        id: "hello-world1",
        title: "Totally Random",
        code: "import random\n\nx = random.randint(1, 10)\nprint(x)",
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "integers-added" as SectionId,
      title: "Operating Integers",
      content: [
        {
          kind: "text",
          value: "What does the line `import random` do?",
        },
      ],
      options: ["7", "34", "333", "An error"],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct. When you use `+` with two integers, the result is addition.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "integers-added" as SectionId,
      title: "Operating Integers",
      content: [
        {
          kind: "text",
          value: "How many inputs does the `random.randint()` function take?",
        },
      ],
      options: ["7", "34", "333", "An error"],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct. When you use `+` with two integers, the result is addition.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "integers-added" as SectionId,
      title: "Operating Integers",
      content: [
        {
          kind: "text",
          value: "What does the `random.randint()` function seem to do?",
        },
      ],
      options: ["7", "34", "333", "An error"],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct. When you use `+` with two integers, the result is addition.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "review-intro",
      title: "Practicing with Interleaving",
      content: [
        {
          kind: "text",
          value:
            "Programming is really just four major concepts: variables, functions, loops, and conditionals. This means you are half way through learning everything that is necessary to be a programmer. This begs the question: why does it take years to become a great programmer? The answer is complexity. Almost everything past those core four topics are techniques to make your programs easier to understand and adapt to new problems.\n\nComplexity is the reason that programming is hard. Writing a 100 line program is easy: you can keep everything in your head at once. Writing a 100,000 line program, however is much more difficult. The single most powerful tool that programmers have to reduce complexity is functions. In the unit, you'll see how functions can be used to encapsulate complex ideas and allow you to reason about a system at a higher level.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
