import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  PRIMMSectionData,
  TestingSectionData,
  MultipleChoiceSectionData,
  DebuggerSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Building with Inputs",
  guid: "a707da7a-de11-4470-8d08-d537748c0982" as LessonId,
  description:
    "Learn how to make turtle functions more flexible by adding inputs - create reusable building blocks for complex drawings.",
  sections: [
    {
      kind: "Information",
      id: "inputs-intro",
      title: "Making Functions Flexible",
      content: [
        {
          kind: "text",
          value:
            "Imagine if every LEGO block was exactly the same size. Building anything interesting would be nearly impossible! The same is true for functions. In the previous lesson, you drew shapes, but they were always the same size. What if you want a big square for a house and a small square for a window?\n\nThat's where function inputs come in. Just like you learned with basic functions, we can add inputs to our turtle functions to make them flexible and reusable.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "size-input" as SectionId,
      title: "Adding a Size Input",
      content: [
        {
          kind: "text",
          value:
            "Let's improve our square-drawing function from the previous lesson by adding a `size` and a `color` input. Now we can draw squares of any size and any color without rewriting the function! Run this code and see what happens:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\n\ndef draw_square(size, color):\n  turtle.color(color)\n  turtle.forward(size)\n  turtle.right(90)\n  turtle.forward(size)\n  turtle.right(90)\n  turtle.forward(size)\n  turtle.right(90)\n  turtle.forward(size)\n\n# Draw squares of different sizes\ndraw_square(100, "red")\ndraw_square(75, "yellow")\ndraw_square(50, "blue")',
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "function-benefit",
      title: "Function Benefits",
      content: [
        {
          kind: "text",
          value:
            "What's the benefit of adding the `size` and `color` inputs to our square function?",
        },
      ],
      options: [
        "It makes the function run faster",
        "It lets us draw different types of squares",
        "It makes the go from black to red",
        "It is required by Python for a function to execute",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Inputs make functions flexible and reusable for different situations.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "triangle-size-primm" as SectionId,
      title: "Triangle with Input",
      content: [
        {
          kind: "text",
          value:
            "Here's a triangle function that takes a size input. Predict what will be drawn when we call it with different sizes:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef draw_triangle(size):\n  turtle.forward(size)\n  turtle.left(120)\n  turtle.forward(size)\n  turtle.left(120)\n  turtle.forward(size)\n  turtle.left(120)\n\n# Draw triangles\ndraw_triangle(80)\nturtle.penup()\nturtle.forward(100)\nturtle.pendown()\ndraw_triangle(40)",
      },
      predictPrompt:
        "Two triangles will be drawn. How will they differ? Where will they appear?",
      conclusion:
        "The first triangle has sides of 80 pixels, the second has sides of 40 pixels. The turtle moves between them without drawing a line because of `penup()`!",
    } as PRIMMSectionData,
    {
      kind: "Debugger",
      id: "position-inputs-debug" as SectionId,
      title: "Position Inputs",
      content: [
        {
          kind: "text",
          value:
            "To build complex drawings, we need to control WHERE shapes are drawn. This function takes x and y coordinates as inputs.\n\nStep through this code and watch how the turtle jumps to different positions before drawing each square:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef draw_square_at(x, y, size):\n  # Move to position without drawing\n  turtle.penup()\n  turtle.goto(x, y)\n  turtle.pendown()\n\n    # Draw the square\n  turtle.forward(size)\n  turtle.right(90)\n  turtle.forward(size)\n  turtle.right(90)\n  turtle.forward(size)\n  turtle.right(90)\n  turtle.forward(size)\n  turtle.right(90)\n\n# Draw squares in different positions\ndraw_square_at(-100, 50, 40)\ndraw_square_at(50, 50, 40)\ndraw_square_at(-25, -50, 40)",
      },
    } as DebuggerSectionData,
    {
      kind: "Testing",
      id: "rectangle-function" as SectionId,
      title: "Challenge: Rectangle Function",
      content: [
        {
          kind: "text",
          value:
            "Create a function called `draw_rectangle(width, height)` that draws a rectangle with the given width and height.\n\nThen use your function to draw:\n1. A rectangle that's 100 pixels wide and 50 pixels tall\n2. A rectangle that's 30 pixels wide and 20 pixels tall\n3. A rectangle that's 75 pixels wide and 100 pixels tall\n\nHint: Since the turtle is facing up, our should move `height` first.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef draw_rectangle(width, height):\n  # Your code here\n  pass\n\n# Test your function\ndraw_rectangle(100, 50)\ndraw_rectangle(30, 20)\ndraw_rectangle(75, 100)",
      },
      testMode: "procedure",
      functionToTest: "__main__",
      visualThreshold: 0.999,
      testCases: [
        {
          description: "Three rectangles",
          input: [],
          expected: null,
          referenceImage: "images/turtle_rectangles.png",
        },
      ],
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "house-parts-pimm" as SectionId,
      title: "Building House Parts",
      content: [
        {
          kind: "text",
          value:
            "Now we're getting somewhere! This program uses functions with inputs to draw parts of a house. Predict what this will draw:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\n\ndef draw_rectangle(width, height):\n  turtle.forward(width)\n  turtle.right(90)\n  turtle.forward(height)\n  turtle.right(90)\n  turtle.forward(width)\n  turtle.right(90)\n  turtle.forward(height)\n  turtle.right(90)\n\ndef draw_door(width, height, color):\n  turtle.color(color)\n  draw_rectangle(width, height)\n  turtle.color("black")  # Reset color\n\n# Draw a door\ndraw_door(30, 60, "brown")\n\n# Move and draw a window\nturtle.penup()\nturtle.goto(60, 0)\nturtle.pendown()\ndraw_rectangle(40, 40)',
      },
      predictPrompt:
        "What two shapes will be drawn? What will be different about them?",
      conclusion:
        "The door is a brown rectangle (30x60), and the window is a black square (40x40). Notice how we reused the rectangle function!",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "house-base-challenge" as SectionId,
      title: "Challenge: House Base",
      content: [
        {
          kind: "text",
          value:
            "Time to start building a house of your own! Create a function called `draw_house_base(size)` that:\n1. Draws a square for the house body using the given size\n2. Draws a triangle roof on top (also using the same size)\n\nThe roof should sit directly on top of the square. Test your function by calling it with size 50.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef draw_house_base(size):\n  # Draw the square base\n\n  # Move to the top left of the house\n\n  # Draw the triangle roof\n  # Hint: The roof starts where the square ends\n\n  pass\n\n# Test your function\ndraw_house_base(50)",
      },
      testMode: "procedure",
      functionToTest: "draw_house_base",
      visualThreshold: 0.999,
      testCases: [
        {
          description: "House with side length of 50",
          input: [50],
          expected: null,
          referenceImage: "images/turtle_house_50.png",
        },
        {
          description: "House with side length of 75",
          input: [75],
          expected: null,
          referenceImage: "images/turtle_house_75.png",
        },
      ],
    } as TestingSectionData,
    {
      kind: "Information",
      id: "inputs-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Excellent work! You've learned how to make turtle functions flexible with inputs. You can now:\n- Control the size of your shapes\n- Change colors dynamically\n- Position shapes anywhere on screen\n- Reuse functions to build complex drawings\n\nIn the final lesson, we'll combine everything you've learned to build an entire neighborhood with different houses, trees, and maybe even some clouds!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
