import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  MultipleChoiceSectionData,
  PRIMMSectionData,
  TestingSectionData,
  DebuggerSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Drawing with Turtles",
  guid: "973a0fb8-67fa-463d-a12d-0df9f55eb547" as LessonId,
  description:
    "Learn to create graphics using a Python library called `turtle` to draw shapes and patterns.",
  sections: [
    {
      kind: "Information",
      id: "turtle-intro",
      title: "Meet Your Turtle",
      content: [
        {
          kind: "text",
          value:
            'One of the oldest ways to teach programming (developed in the 1960\'s) is by graphics. The creators called it a "turtle" because the library lets you create drawings by commanding a virtual turtle. The turtle carries a pen and leaves a trail as it moves. You can tell it to move forward, turn, lift its pen up, put it down, and even change colors. By combining these simple commands, you can create complex drawings.',
        },
        {
          kind: "image",
          src: "https://cdn-blog.adafruit.com/uploads/2019/06/turtlebg.jpg",
          alt: "Example of turtle graphics program creating complex shapes",
          maxWidthPercentage: 40,
        },
        {
          kind: "text",
          value:
            "Turtles are wonderful tool for learning functions because you can see what each line of code does. With this foundation, you can build up to more and more complex shapes.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "first-turtle" as SectionId,
      title: "Your First Turtle Program",
      content: [
        {
          kind: "text",
          value:
            "Let's start with the basics. Run this program and watch what the turtle does. Pay attention to how each command affects the turtle's movement.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\ndef make_T():\n  t.forward(100)\n  t.right(90)\n  t.forward(100)\n  t.left(180)\n  t.forward(200)\n\nmake_T()",
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "turtle-angle",
      title: "Turtle Angles",
      content: [
        {
          kind: "text",
          value: "In the code above, what does `turtle.right(90)` do?",
        },
      ],
      options: [
        "Moves the turtle 90 pixels to the right",
        "Turns the turtle 90 degrees to the right",
        "Draws a line 90 pixels long",
        "Makes the turtle face right",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! The turtle turns 90 degrees to the right. Think of it like making a right-angle turn.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "square-primm" as SectionId,
      title: "Drawing Shapes",
      content: [
        {
          kind: "text",
          value:
            "Now let's try something more interesting. The code below attempts to draw a shape. Predict what shape it will draw, then run it to check.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nt = turtle.Turtle()\n\ndef make_shape():\n  t.forward(100)\n  t.right(90)\n  t.forward(100)\n  t.right(90)\n  t.forward(100)\n  t.right(90)\n  t.forward(100)\n\nmake_shape()",
      },
      predictPrompt:
        "Look at the pattern of forward and right commands. What shape do you think this will draw?",
      conclusion:
        "It draws a square! Each `right(90)` makes a 90-degree turn, and four 90-degree turns bring you back to where you started.",
    } as PRIMMSectionData,
    {
      kind: "Observation",
      id: "turtle-colors" as SectionId,
      title: "Adding Color",
      content: [
        {
          kind: "text",
          value:
            "Turtles can draw in different colors! Run this code to see how color commands work:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\nt = turtle.Turtle()\n\n# Set pen color to red\nt.color("red")\nt.forward(100)\n\n# Change to blue\nt.color("blue")\nt.right(90)\nt.forward(100)\n\n# Change to green\nt.color("green")\nt.right(90)\nt.forward(100)',
      },
    } as ObservationSectionData,
    {
      kind: "Debugger",
      id: "pen-control-debug" as SectionId,
      title: "Pen Control",
      content: [
        {
          kind: "text",
          value:
            "Sometimes you want to move the turtle without drawing. The `penup()` and `pendown()` commands control whether the turtle draws as it moves.\n\nStep through this code and watch when lines are drawn vs. when the turtle just moves:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\nt = turtle.Turtle()\n# Draw first line\nturtle.forward(50)\n\n# Lift pen up\nt.penup()\nt.forward(50)  # No line drawn!\n\n# Put pen down\nt.pendown()\nt.forward(50)",
      },
    } as DebuggerSectionData,
    {
      kind: "Testing",
      id: "draw-triangle" as SectionId,
      title: "Challenge: Draw a Triangle",
      content: [
        {
          kind: "text",
          value:
            "Now it's your turn! Write a program that draws an equilateral triangle (all sides the same length).\n\nHint: A triangle has 3 sides, and the angles add up to 180 degrees. For an equilateral triangle, each turn should be 120 degrees (not 60!).",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\n# Draw your triangle here\n# Each side should be 100 pixels\n\nturtle.done()",
      },
      testCases: [
        {
          input: [null],
          expected: "SHAPE:triangle",
          description: "Test that a triangle is drawn",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "function-turtle-primm" as SectionId,
      title: "Turtle Functions",
      content: [
        {
          kind: "text",
          value:
            "Here's where it gets interesting! We can combine what we know about functions with turtle graphics. Predict what this program will draw:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "import turtle\n\ndef draw_square():\n    turtle.forward(50)\n    turtle.right(90)\n    turtle.forward(50)\n    turtle.right(90)\n    turtle.forward(50)\n    turtle.right(90)\n    turtle.forward(50)\n    turtle.right(90)\n\ndraw_square()\nturtle.penup()\nturtle.forward(100)\nturtle.pendown()\ndraw_square()\n\nturtle.done()",
      },
      predictPrompt:
        "We defined a function to draw a square. What will the complete program draw?",
      conclusion:
        "It draws two squares with a gap between them! Functions let us reuse drawing code.",
    } as PRIMMSectionData,
    {
      kind: "Information",
      id: "turtle-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "You've learned the basics of turtle graphics! With just a few simple commands - `forward()`, `right()`, `left()`, `penup()`, `pendown()`, and `color()` - you can create amazing drawings.\n\nIn the next lesson, we'll use functions to build more complex drawings, starting with a house and working up to an entire neighborhood!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
