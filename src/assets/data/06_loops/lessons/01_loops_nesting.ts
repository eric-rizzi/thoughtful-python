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
  DebuggerSectionData,
  ReflectionSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Patterns Within Patterns",
  guid: "e9f2d834-6b71-4a89-b523-1e7c9f8d2a56" as LessonId,
  description:
    "Discover the power of nested loops - putting loops inside loops to create complex patterns from simple shapes.",
  sections: [
    {
      kind: "Information",
      id: "nested-intro",
      title: "Beyond Single Shapes",
      content: [
        {
          kind: "text",
          value:
            "In the previous lesson, you used loops to draw individual shapes. But what if you want to draw more complex patterns? For example, what if you want to draw eight squares arranged in a circle or five triangles in a row?\n\nWhenever there's repeating patterns, you should think of using loops. This means if you're making a single polygon, you should use a single loop. This also means if you're repeatedly creating the same shape, you should thing of a **nested loops**. A nested loop is simply a loop inside another loop. The inner loop completes ALL its repetitions before the outer loop continues to its next repetition.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "PRIMM",
      id: "first-nested-primm" as SectionId,
      title: "Your First Nested Loop",
      content: [
        {
          kind: "text",
          value:
            'Let\'s start with something visual. This program has two loops - one "inside" the other. The indentation shows which loop is "inside" which. Use the comments to help you predict what this program will draw:',
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\n# Outer loop: repeat 6 times\nfor i in range(6):\n    # Inner loop: draw a shape\n    for j in range(4):\n        turtle.forward(50)\n        turtle.right(90)\n    \n    # After each shape is completed, rotate\n    turtle.right(60)",
      },
      predictPrompt:
        "The inner loop draws a square (4 sides, 90° turns). The outer loop repeats this 6 times, rotating 60° after each square. What pattern will this create?",
      conclusion:
        "It creates 6 squares arranged in a circle! The inner loop completes a full square, then the turtle rotates 60°, and the process repeats. Since 60° × 6 = 360°, the squares form a complete circle.",
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "loop-counting",
      title: "Counting Loop Iterations",
      content: [
        {
          kind: "text",
          value:
            'The program above was a "nested" loop because there was a loop "inside" another loop. Nested loops can do very complex things because there is a multiplicative effect. The our loop runs six times. The inner loops runs 4 times. This means that the code "within" the inner loop runs 6 x 4 = 24 times.\n\nIf you have nested loops like this, how many times total does the `forward()` function get called?',
        },
        {
          kind: "code",
          value:
            "for i in range(3):\n    for j in range(4):\n        turtle.forward(50)",
        },
      ],
      options: ["3 times", "4 times", "7 times", "12 times"],
      correctAnswer: 3,
      feedback: {
        correct:
          "Correct! The outer loop runs 3 times, and for EACH of those times, the inner loop runs 4 times. So 3 x 4 = 12 total `forward()` calls.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Debugger",
      id: "watch-nesting" as SectionId,
      title: "Watching Nested Loops",
      content: [
        {
          kind: "text",
          value:
            "Let's slow down and watch how nested loops actually work with just some simple prints. Step through this code and pay attention to:\n- The inner loop completing fully before the outer loop continues\n- The fact that the `Hi from the inner loop` line is printed 2 x 3 = 6 times\n- How the `print()` statements around the inner loop only run twice each",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'print("About to start program")\n\nfor i in range(2):\n  print("About to run inner loop")\n  for j in range(3):\n    print("Hi from the inner loop")\n  print("Done inner loop")\n\nprint("All done program")',
      },
    } as DebuggerSectionData,
    {
      kind: "Observation",
      id: "flower-pattern" as SectionId,
      title: "Creating Flower Patterns",
      content: [
        {
          kind: "text",
          value:
            "Nested loops are perfect for creating flower patterns. The inner loop draws one petal, and the outer loop arranges multiple petals in a circle. Run this code and then try changing the numbers to see different flowers.\n\nOne thing to note is that the code uses `turtle.speed(0)` to make the turtle run at max speed.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\nturtle.speed(0)\n\n# Draw a flower with 12 petals\nfor i in range(12):\n    # Draw one petal (square)\n    for j in range(4):\n        turtle.forward(60)\n        turtle.right(90)\n\n    # Rotate for next petal\n    turtle.right(30)  # 360/12 = 30\n\n# Try changing 12 to 8 and 30 to 45!",
      },
    } as ObservationSectionData,
    {
      kind: "Testing",
      id: "shape-ring" as SectionId,
      title: "Challenge: Shape Ring",
      content: [
        {
          kind: "text",
          value:
            "Create a ring of shapes using nested loops:\n\n1. Draw 8 triangles arranged in a circle\n2. Each triangle should have sides of 30 pixels\n3. Remember: triangles use 120° exterior angles\n4. The triangles should be evenly spaced (360° ÷ 8 = 45°)",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\nturtle.speed(0)\n\n# Draw 8 triangles in a circle\n# Your code here\n",
      },
      testCases: [
        {
          input: [null],
          expected: "PATTERN:ring_triangles_8",
          description: "Test that 8 triangles are arranged in a circle",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "grid-pattern-primm" as SectionId,
      title: "Grid Patterns",
      content: [
        {
          kind: "text",
          value:
            "Nested loops can also create grid patterns. This code draws squares in rows. Predict what the pattern will look like:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\nturtle.speed(0)\n\n# Starting position\nturtle.penup()\nturtle.goto(-100, 100)\nturtle.pendown()\n\nfor row in range(3):\n    for col in range(4):\n        # Draw a small square\n        for side in range(4):\n            turtle.forward(20)\n            turtle.right(90)\n        \n        # Move to next column position\n        turtle.penup()\n        turtle.forward(30)\n        turtle.pendown()\n    \n    # Move to next row\n    turtle.penup()\n    turtle.backward(120)  # 30 * 4 = 120\n    turtle.right(90)\n    turtle.forward(30)\n    turtle.left(90)\n    turtle.pendown()",
      },
      predictPrompt:
        "This has THREE nested loops! The innermost draws a square, the middle loop draws a row of squares, and the outer loop creates multiple rows. How many squares total will be drawn?",
      conclusion:
        "It draws a 3×4 grid of squares (12 total)! This shows how nested loops can create structured patterns. Notice how we use penup() and pendown() to move without drawing.",
    } as PRIMMSectionData,
    {
      kind: "MultipleSelection",
      id: "nesting-concepts",
      title: "Understanding Nested Loops",
      content: [
        {
          kind: "text",
          value:
            "Which of these statements about nested loops are true? Select all that apply.",
        },
      ],
      options: [
        "The inner loop completes all its iterations before the outer loop continues",
        "You can have loops inside loops inside loops (triple nesting)",
        "The inner loop variable (like j) resets each time the outer loop runs",
        "Nested loops can only be used for drawing shapes",
        "Indentation shows which loop is inside which",
        "If outer loop runs m times and inner runs n times, the inner code executes m×n times",
      ],
      correctAnswers: [0, 1, 2, 4, 5],
      feedback: {
        correct:
          "Excellent! You understand that nested loops are about repetition patterns, and the indentation is crucial for showing the structure.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Testing",
      id: "spiral-flowers" as SectionId,
      title: "Challenge: Spiral of Flowers",
      content: [
        {
          kind: "text",
          value:
            "Create a spiral pattern where each 'flower' gets progressively larger:\n\n1. Draw 5 flowers total\n2. Each flower should have 6 square petals\n3. The first flower's squares should be 20 pixels\n4. Each subsequent flower's squares should be 10 pixels larger\n5. Move the turtle forward 50 pixels between flowers\n\nHint: You'll need to calculate size based on which flower you're drawing!",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\nturtle.speed(0)\n\n# Draw 5 flowers in a line, each bigger than the last\nfor flower_num in range(5):\n    # Calculate size for this flower\n    size = 20 + (flower_num * 10)\n    \n    # Draw one flower with 6 square petals\n    # Your code here\n    \n    # Move to position for next flower\n    # Your code here\n    pass",
      },
      testCases: [
        {
          input: [null],
          expected: "PATTERN:growing_flowers_5",
          description: "Test that 5 flowers of increasing size are drawn",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "rotation-pattern-primm" as SectionId,
      title: "Rotating Patterns",
      content: [
        {
          kind: "text",
          value:
            "Here's a mesmerizing pattern created with nested loops. The outer loop rotates the entire drawing angle slightly each time:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\nturtle.speed(0)\n\nfor rotation in range(8):\n    # Draw one square\n    for side in range(4):\n        turtle.forward(70)\n        turtle.right(90)\n    \n    # Rotate slightly for next square\n    turtle.right(45)  # 360/8 = 45",
      },
      predictPrompt:
        "Each iteration draws a square, then rotates 45°. With 8 iterations and 45° each time, what will the final pattern look like?",
      conclusion:
        "It creates a beautiful rotating square pattern! The squares overlap to create an 8-pointed star design. This technique of slight rotations can create amazing geometric art.",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "custom-mandala" as SectionId,
      title: "Challenge: Create a Mandala",
      content: [
        {
          kind: "text",
          value:
            "Time to create your own mandala (circular pattern) using nested loops! Requirements:\n\n1. Use at least two levels of nesting\n2. The outer loop should run at least 6 times\n3. Include rotation to create a circular pattern\n4. Use at least one shape from Lesson 1 (triangle, pentagon, hexagon, etc.)\n5. Make it beautiful!\n\nBe creative - combine what you've learned about shapes, patterns, and nesting.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\nturtle.speed(0)\n\n# Create your mandala here\n# Remember: outer loop for rotation, inner loop(s) for shapes\n",
      },
      testCases: [
        {
          input: [null],
          expected: "PATTERN:mandala",
          description:
            "Test that a circular pattern with nested loops is created",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "nested-loops-reflection" as SectionId,
      title: "Nested Loops Reflection",
      content: [
        {
          kind: "text",
          value:
            "Nested loops multiply the power of repetition. You've seen how an inner loop that draws a simple shape, combined with an outer loop that rotates or repositions, can create complex patterns.\n\nCreate a simple example of nested loops and explain how the inner and outer loops work together. Remember to use the phrase 'as seen in the example above'.",
        },
      ],
      topic: "How Nested Loops Create Complex Patterns",
      isTopicPredefined: true,
      code: "Create an example with nested loops drawing a pattern",
      isCodePredefined: false,
      explanation:
        "Explain how your inner and outer loops work together (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "nested-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Amazing work! You've unlocked the power of nested loops and discovered how patterns within patterns create complexity from simplicity. You learned:\n- Inner loops complete fully before outer loops continue\n- Loop variables reset for each outer loop iteration\n- Two loops multiply their repetitions (m×n total iterations)\n- Nested loops can create flowers, grids, mandalas, and more\n\nIn the next lesson, we'll explore how to use the loop variable itself as a tool for creating dynamic, changing patterns. What if each repetition could be slightly different from the last?",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
