import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  PRIMMSectionData,
  MultipleChoiceSectionData,
  TestingSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Buncha Shapes",
  guid: "d8f3c921-4a56-4b72-9e15-2c8f7d4a3b91" as LessonId,
  description:
    "Learn how loops eliminate repetition and discover the mathematical patterns behind creating shapes with code.",
  sections: [
    {
      kind: "Information",
      id: "repetition-problem",
      title: "The Repetition Problem",
      content: [
        {
          kind: "text",
          value:
            "At this point you've covered data types, variables, functions, and conditionals. There's only one more thing you need to learn to be considered a competent, beginner programmer: **loops**. Loops are a way of further compacting your ideas in code.\n\nRemember programming the turtle to draw a triangle? You wrote `forward(100)` and `right(120)` three separate times. For a triangle this gets repetitive, but imagine how annoying it would be if you wanted to draw a shape with 100 sides. That's where loops come in.\n\nLoops are powerful because they let you tell the computer to repeat actions without having to write the same code multiple times. They turn you from someone who types instructions into someone who describes patterns.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "star-patterns" as SectionId,
      title: "Beyond Basic Shapes: Stars",
      content: [
        {
          kind: "text",
          value:
            'Not all shapes follow the simple "multiplies to 360°" rule. Stars are special because the turtle actually does two complete rotates: 720 degrees. See if you can create a star like the image below.\n\nHint: the angle is greater than 120 degrees.',
        },
        {
          kind: "image",
          src: "data/05_loops/images/turtle-star.png",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode: "import turtle\n\n# Five-pointed star",
      },
    } as ObservationSectionData,
    {
      kind: "PRIMM",
      id: "four-lefts-primm" as SectionId,
      title: "Four Lefts Make a Right",
      content: [
        {
          kind: "text",
          value:
            "Let's start with a simple, repetitive program. Look at this code carefully and predict what it will draw.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef make_shape():\n  turtle.forward(100)\n  turtle.left(90)\n  turtle.forward(100)\n  turtle.left(90)\n  turtle.forward(100)\n  turtle.left(90)\n  turtle.forward(100)\n  turtle.left(90)\n\nmake_shape()\n",
      },
      predictPrompt: "What shape will this draw?",
      conclusion: "Four right angles add up to a square.",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "pentagon-builder" as SectionId,
      title: "Challenge: Pentagon Builder",
      content: [
        {
          kind: "text",
          value:
            "As stated, loops are a way of encoding patterns to avoid repetition. For example, the code below draws a pentagon in the least efficient way possible.",
        },
        {
          kind: "code",
          value:
            "import turtle\n\ndef make_shape():\n  turtle.forward(80)\n  turtle.right(72)\n  turtle.forward(80)\n  turtle.right(72)\n  turtle.forward(80)\n  turtle.right(72)\n  turtle.forward(80)\n  turtle.right(72)\n  turtle.forward(80)\n  turtle.right(72)\n\nmake_shape()\n",
        },
        {
          kind: "text",
          value:
            "See if you can use a loop to rewrite the program more efficiently. Your loop should draw the exact same pentagon but with only 3 lines additional lines of code (not including the `import`).",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef make_shape():\n  # Your code here converting the code above to a loop\n\n\nmake_shape()",
      },
      testMode: "procedure",
      functionToTest: "__main__",
      visualThreshold: 0.999,
      testCases: [
        {
          description: "Pentagon with side length 100",
          input: [],
          expected: null,
          referenceImage: "images/turtle_pentagon.png",
        },
      ],
    } as TestingSectionData,
    {
      kind: "Testing",
      id: "shape-collection" as SectionId,
      title: "Challenge: Shape Collection",
      content: [
        {
          kind: "text",
          value:
            "Time to create a shape of your own without any hints! You goal is to a hexagon: a shape with 6 sides. To accomplish this goal, do the following:\n- Create a function called `make_hexagon()` that takes a single input: size\n- Inside the function, use a loop to draw a six sided figure\n-Call the `make_hexagon()` function with an input of 55.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode: "import turtle\n\n# Your code here",
      },
      testMode: "function",
      functionToTest: "make_hexagon",
      visualThreshold: 0.999,
      testCases: [
        {
          description: "Hexagon with side length 55",
          input: [],
          expected: null,
          referenceImage: "images/turtle_hexagon.png",
        },
      ],
    } as TestingSectionData,
    {
      kind: "MultipleChoice",
      id: "loop-counting",
      title: "Counting Loop Iterations",
      content: [
        {
          kind: "text",
          value:
            "If there weren't loops in the program above, how many lines of code would be required to create the same shape?",
        },
      ],
      options: [
        "20 lines of code",
        "36 lines lines of code",
        "55 lines of code",
        "72 lines of code",
      ],
      correctAnswer: 3,
      feedback: {
        correct:
          "Correct! The two lines of code inside the loop are run 36 times which means 72 lines of code.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "loops-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Fantastic work! You've transformed from writing repetitive code to describing patterns. You've learned:\n- How `for i in range(n):` repeats code n times\n- The 360÷sides pattern for regular polygons\n- That indentation shows what's \"inside\" the loop\n\nIn the next lesson, you'll have a chance to practice with some less regular shapes and inject a bit of color.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
