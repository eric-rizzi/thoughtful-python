import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  PRIMMSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  TestingSectionData,
  MatchingSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "The Pattern Repeater",
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
            "So far, you've been writing the same code over and over. Remember drawing a square? You wrote `forward(100)` and `right(90)` four separate times. What if you wanted to draw a shape with 100 sides? There has to be a better way!\n\nThat's where **loops** come in. Loops are one of the most powerful concepts in programming because they let you tell the computer to repeat actions without writing the same code multiple times. They turn you from someone who types instructions into someone who describes patterns.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "PRIMM",
      id: "three-lefts-primm" as SectionId,
      title: "Three Lefts Make a Right",
      content: [
        {
          kind: "text",
          value:
            "Let's start with a simple shape drawn the repetitive way. Look at this code carefully and predict what it will draw.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\nt.forward(100)\nt.left(120)\nt.forward(100)\nt.left(120)\nt.forward(100)\nt.left(120)",
      },
      predictPrompt:
        "What shape will this draw? Why do you think the angle is 120 degrees instead of 60 degrees (since triangles have 60-degree angles inside)?",
      conclusion:
        "The turtle turns the OUTSIDE corner (exterior angle), not the inside! For a triangle, the exterior angle is 120°. This is why we use 120° to draw a triangle with 60° interior angles.",
    } as PRIMMSectionData,
    {
      kind: "Observation",
      id: "first-loop" as SectionId,
      title: "Your First Loop",
      content: [
        {
          kind: "text",
          value:
            "Here's the same triangle, but now using a **loop** to eliminate the repetition. Notice how much cleaner this is!\n\nThe key parts are:\n- `for i in range(3):` tells Python to repeat 3 times\n- The **indented** code below is what gets repeated\n- Just like with functions, indentation shows what's 'inside' the loop",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\n# Draw a triangle using a loop\nfor i in range(3):\n    t.forward(100)\n    t.left(120)",
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "loop-mechanics",
      title: "Understanding Loops",
      content: [
        {
          kind: "text",
          value: "How many times will the following loop repeat?",
        },
        {
          kind: "code",
          value: "for i in range(7):\n    print('Hello')",
        },
      ],
      options: ["6 times", "7 times", "8 times", "It depends on i"],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! The range(7) creates a sequence from 0 to 6 (seven numbers), so the loop runs 7 times.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "square-builder" as SectionId,
      title: "Challenge: Square Builder",
      content: [
        {
          kind: "text",
          value:
            "Convert this repetitive square-drawing code to use a loop. Your loop should draw the exact same square but with only 3 lines of code inside your function (not counting the import and turtle setup).",
        },
        {
          kind: "code",
          value:
            "# Current repetitive way:\nt.forward(80)\nt.right(90)\nt.forward(80)\nt.right(90)\nt.forward(80)\nt.right(90)\nt.forward(80)\nt.right(90)",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\n# Convert to a loop:\n# Your code here",
      },
      testCases: [
        {
          input: [null],
          expected: "SHAPE:square[80]",
          description: "Test that a square with side length 80 is drawn",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "pentagon-mystery" as SectionId,
      title: "Pentagon Patterns",
      content: [
        {
          kind: "text",
          value:
            "Now let's explore a pentagon (5-sided shape). Look at this code and predict what will happen, paying special attention to the angle used.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\n# Draw a pentagon\nfor i in range(5):\n    t.forward(80)\n    t.right(72)",
      },
      predictPrompt:
        "This draws a pentagon. Can you figure out why the angle is 72 degrees? Hint: what's 360 ÷ 5?",
      conclusion:
        "The pattern is 360 ÷ number_of_sides! This works for any regular polygon because the turtle makes one complete turn (360°) by the time it returns to the start.",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "shape-collection" as SectionId,
      title: "Challenge: Shape Collection",
      content: [
        {
          kind: "text",
          value:
            "Time to create multiple shapes! Create three separate programs:\n\n1. A hexagon (6 sides, each 60 pixels)\n2. An octagon (8 sides, each 50 pixels)\n3. A nonagon (9 sides, each 45 pixels)\n\nRemember the pattern: angle = 360 ÷ sides\n\nTest each shape individually before moving to the next.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\n# Hexagon (6 sides)\nfor i in range(6):\n    # Your code here\n    pass\n\n# Move to new position\nt.penup()\nt.forward(150)\nt.pendown()\n\n# Octagon (8 sides)\n# Your code here\n\n# Move to new position\nt.penup()\nt.backward(300)\nt.pendown()\n\n# Nonagon (9 sides)\n# Your code here",
      },
      testCases: [
        {
          input: [null],
          expected: "SHAPES:hexagon[60],octagon[50],nonagon[45]",
          description: "Test that all three shapes are drawn correctly",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Matching",
      id: "angle-patterns" as SectionId,
      title: "Shape Angle Patterns",
      content: [
        {
          kind: "text",
          value:
            "You've discovered the pattern! Match each shape with the correct angle the turtle needs to turn:",
        },
      ],
      prompts: [
        { "Triangle (3 sides)": "120°" },
        { "Square (4 sides)": "90°" },
        { "Pentagon (5 sides)": "72°" },
        { "Hexagon (6 sides)": "60°" },
        { "Octagon (8 sides)": "45°" },
        { "Decagon (10 sides)": "36°" },
      ],
      feedback: {
        correct:
          "Perfect! You've mastered the 360÷sides pattern. This is the key to drawing any regular polygon!",
      },
    } as MatchingSectionData,
    {
      kind: "Observation",
      id: "star-patterns" as SectionId,
      title: "Beyond Basic Shapes: Stars",
      content: [
        {
          kind: "text",
          value:
            "Not all shapes follow the simple 360÷sides rule. Stars are special because the turtle turns MORE than it needs to, creating points. Watch how this five-pointed star uses 144° instead of the 72° a pentagon would use:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\n# Five-pointed star\nfor i in range(5):\n    t.forward(100)\n    t.right(144)  # Not 72!\n\n# Try changing 144 to other values like 135 or 160",
      },
    } as ObservationSectionData,
    {
      kind: "Testing",
      id: "star-designer" as SectionId,
      title: "Challenge: Star Designer",
      content: [
        {
          kind: "text",
          value:
            "Create two different star patterns:\n\n1. A 7-pointed star (try angle = 180 - (180÷7) ≈ 154°)\n2. An 8-pointed star with a different pattern (try 135°)\n\nExperiment with different angles to see what patterns you can create!",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\nt.speed(0)\n\n# 7-pointed star\nfor i in range(7):\n    # Your code here\n    pass\n\n# Move to new position\nt.penup()\nt.goto(-150, 0)\nt.pendown()\n\n# 8-pointed star pattern\n# Your code here",
      },
      testCases: [
        {
          input: [null],
          expected: "SHAPES:star7,star8",
          description: "Test that two star patterns are drawn",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "MultipleSelection",
      id: "loop-understanding",
      title: "Loop Mastery Check",
      content: [
        {
          kind: "text",
          value:
            "Which of the following statements about loops are true? Select all that apply.",
        },
      ],
      options: [
        "`for i in range(5):` repeats exactly 5 times",
        "The code inside a loop must be indented",
        "Loops can only be used for drawing shapes",
        "The variable `i` in `for i in range(n):` counts from 0 to n-1",
        "You can use any variable name instead of `i`",
        "Loops eliminate the need to write repetitive code",
      ],
      correctAnswers: [0, 1, 3, 4, 5],
      feedback: {
        correct:
          "Excellent! You understand that loops are a general programming concept for eliminating repetition, not just for turtle graphics.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Reflection",
      id: "loop-patterns-reflection" as SectionId,
      title: "Loop Patterns Reflection",
      content: [
        {
          kind: "text",
          value:
            "Loops transform repetitive code into elegant patterns. You've discovered that regular polygons follow the 360÷sides rule and that stars break this rule in interesting ways.\n\nCreate a simple example that shows how loops eliminate repetition and explain the mathematical pattern you used. Remember to use the phrase 'as seen in the example above'.",
        },
      ],
      topic: "How Loops Create Patterns",
      isTopicPredefined: true,
      code: "Create an example showing a loop drawing a shape",
      isCodePredefined: false,
      explanation:
        "Explain how your loop works and what pattern it follows (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "loops-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Fantastic work! You've transformed from writing repetitive code to describing patterns. You've learned:\n- How `for i in range(n):` repeats code n times\n- The 360÷sides pattern for regular polygons\n- How to create stars by using different angles\n- That indentation shows what's inside the loop\n\nIn the next lesson, we'll explore what happens when you put a loop inside another loop. If one loop can draw a square, imagine what two loops can create!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;