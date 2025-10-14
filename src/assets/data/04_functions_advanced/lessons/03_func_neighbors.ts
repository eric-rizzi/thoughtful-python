import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  TestingSectionData,
  ObservationSectionData,
  PRIMMSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  ReflectionSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Advanced Functions Challenge",
  guid: "e32ef864-111e-4647-b877-fb321a196c80" as LessonId,
  description:
    "Put together everything you've learned about functions and turtle graphics to build an entire neighborhood.",
  sections: [
    {
      kind: "Information",
      id: "challenge-intro",
      title: "Building a Neighborhood",
      content: [
        {
          kind: "text",
          value:
            "You've come a long way! You've learned about libraries, turtle graphics, and how to make functions flexible with inputs. Now comes the real test: can you combine everything to create something complex?\n\nIn this challenge, you'll build an entire neighborhood. This isn't meant to be easy - complex programs rarely are. But here's the thing: you have all the tools you need. Functions let you break big problems into smaller pieces. Inputs let you create variety. Libraries give you powerful tools.\n\nLet's see what you can build!",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "provided-functions" as SectionId,
      title: "Your Building Blocks",
      content: [
        {
          kind: "text",
          value:
            "Here are some functions to get you started. Run this code to see what each function does. You'll use these as building blocks for your neighborhood:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\nimport random\n\ndef draw_square(size):\n    for i in range(4):\n        turtle.forward(size)\n        turtle.right(90)\n\ndef draw_triangle(size):\n    for i in range(3):\n        turtle.forward(size)\n        turtle.left(120)\n\ndef draw_house(x, y, size, house_color, roof_color):\n    # Move to position\n    turtle.penup()\n    # t.goto(x, y)\n    turtle.pendown()\n    \n    # Draw house body\n    turtle.color(house_color)\n    draw_square(size)\n    \n    # Draw roof\n    turtle.color(roof_color)\n    draw_triangle(size)\n\n# Demo the function\ndraw_house(-50, 0, 80, "lightblue", "red")',
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "function-understanding",
      title: "Understanding the Code",
      content: [
        {
          kind: "text",
          value:
            "In the `draw_house` function, what does `t.begin_fill()` and `t.end_fill()` do?",
        },
      ],
      options: [
        "They make the turtle draw faster",
        "They fill in the shape with color",
        "They lift the pen up and down",
        "They change the line thickness",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! These commands fill the shape between them with the current color.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "tree-function-primm" as SectionId,
      title: "Adding Nature",
      content: [
        {
          kind: "text",
          value:
            "A neighborhood needs trees! Here's a function that draws trees. Predict what this tree will look like:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\nt = turtle.Turtle()\nt.speed(0)\n\ndef draw_tree(x, y, trunk_width, trunk_height, leaves_size):\n    # Move to position\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    \n    # Draw trunk\n    turtle.color("brown")\n    turtle.begin_fill()\n    turtle.forward(trunk_width)\n    turtle.left(90)\n    turtle.forward(trunk_height)\n    turtle.left(90)\n    turtle.forward(trunk_width)\n    turtle.left(90)\n    turtle.forward(trunk_height)\n    turtle.left(90)\n    turtle.end_fill()\n    \n    # Move to top of trunk for leaves\n    turtle.penup()\n    turtle.forward(trunk_width/2)\n    turtle.left(90)\n    turtle.forward(trunk_height)\n    turtle.right(90)\n    turtle.pendown()\n    \n    # Draw leaves (circle)\n    turtle.color("green")\n    turtle.begin_fill()\n    turtle.circle(leaves_size)\n    turtle.end_fill()\n\n# Draw a tree\ndraw_tree(0, -50, 20, 60, 40)',
      },
      predictPrompt:
        "What will this tree look like? What are the different parts?",
      conclusion:
        "The tree has a brown rectangular trunk and green circular leaves on top. The inputs control the size of each part!",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "simple-street" as SectionId,
      title: "Challenge Part 1: Simple Street",
      content: [
        {
          kind: "text",
          value:
            "Create a simple street scene with:\n1. Three houses in a row (use different colors)\n2. Each house should be 60 pixels wide\n3. Space them 80 pixels apart\n\nUse the `draw_house` function provided. Remember: the x, y coordinates set where the house is drawn.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\nimport random\nt = turtle.Turtle()\nt.speed(0)\n\ndef draw_square(size):\n    for i in range(4):\n        turtle.forward(size)\n        turtle.right(90)\n\ndef draw_triangle(size):\n    for i in range(3):\n        turtle.forward(size)\n        turtle.left(120)\n\ndef draw_house(x, y, size, house_color, roof_color):\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    \n    turtle.color(house_color)\n    turtle.begin_fill()\n    draw_square(size)\n    turtle.end_fill()\n    \n    turtle.color(roof_color)\n    turtle.begin_fill()\n    draw_triangle(size)\n    turtle.end_fill()\n\n# Draw three houses in a row\n# Your code here\n",
      },
      testCases: [
        {
          input: [null],
          expected: "SHAPE:three_houses",
          description: "Test that three houses are drawn",
        },
      ],
      testMode: "procedure",
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "MultipleSelection",
      id: "neighborhood-planning",
      title: "Planning a Neighborhood",
      content: [
        {
          kind: "text",
          value:
            "What elements would make a neighborhood scene more realistic? Select all that apply:",
        },
      ],
      options: [
        "Trees between houses",
        "A sun in the sky",
        "Different sized houses",
        "A road or sidewalk",
        "Windows and doors on houses",
        "Clouds in the sky",
        "Cars on the street",
      ],
      correctAnswers: [0, 1, 2, 3, 4, 5, 6],
      feedback: {
        correct:
          "All of these would add realism! Let's see how many you can implement.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Observation",
      id: "helper-functions" as SectionId,
      title: "More Building Blocks",
      content: [
        {
          kind: "text",
          value:
            "Here are some additional functions to help build your neighborhood. Study how they work:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\nt = turtle.Turtle()\nt.speed(0)\n\ndef draw_sun(x, y, size):\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    turtle.color("yellow")\n    turtle.begin_fill()\n    turtle.circle(size)\n    turtle.end_fill()\n\ndef draw_cloud(x, y):\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    turtle.color("lightgray")\n    # Draw three overlapping circles\n    for offset in [0, 15, 30]:\n        turtle.penup()\n        turtle.goto(x + offset, y)\n        turtle.pendown()\n        turtle.begin_fill()\n        turtle.circle(20)\n        turtle.end_fill()\n\ndef draw_road(y_position, width):\n    turtle.penup()\n    turtle.goto(-200, y_position)\n    turtle.pendown()\n    turtle.color("gray")\n    turtle.begin_fill()\n    turtle.forward(400)\n    turtle.right(90)\n    turtle.forward(width)\n    turtle.right(90)\n    turtle.forward(400)\n    turtle.right(90)\n    turtle.forward(width)\n    turtle.right(90)\n    turtle.end_fill()\n\n# Demo\ndraw_sun(100, 100, 30)\ndraw_cloud(-100, 100)\ndraw_road(-100, 50)',
      },
    } as ObservationSectionData,
    {
      kind: "PRIMM",
      id: "random-neighborhood-primm" as SectionId,
      title: "Adding Randomness",
      content: [
        {
          kind: "text",
          value:
            "Real neighborhoods have variety! This code uses the `random` library to create variation. Predict what will change each time you run it:",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\nimport random\nt = turtle.Turtle()\nt.speed(0)\n\ndef draw_square(size):\n    for i in range(4):\n        turtle.forward(size)\n        turtle.right(90)\n\ndef draw_triangle(size):\n    for i in range(3):\n        turtle.forward(size)\n        turtle.left(120)\n\ndef draw_random_house(x, y):\n    # Random house color\n    house_colors = ["lightblue", "lightyellow", "lightgreen", "pink"]\n    house_color = random.choice(house_colors)\n    \n    # Random roof color\n    roof_colors = ["red", "brown", "darkgreen", "blue"]\n    roof_color = random.choice(roof_colors)\n    \n    # Random size between 50 and 80\n    size = random.randint(50, 80)\n    \n    # Draw the house\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    \n    turtle.color(house_color)\n    turtle.begin_fill()\n    draw_square(size)\n    turtle.end_fill()\n    \n    turtle.color(roof_color)\n    turtle.begin_fill()\n    draw_triangle(size)\n    turtle.end_fill()\n\n# Draw three random houses\nfor x in [-100, 0, 100]:\n    draw_random_house(x, 0)',
      },
      predictPrompt: "What will be different each time you run this code?",
      conclusion:
        "Each house has a random color, roof color, and size! The `random` library makes each run unique.",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "complete-neighborhood" as SectionId,
      title: "Final Challenge: Complete Neighborhood",
      content: [
        {
          kind: "text",
          value:
            "Time for the ultimate challenge! Create a complete neighborhood scene that includes:\n1. At least 4 houses (bonus: use randomness for variety)\n2. At least 2 trees\n3. A road or sidewalk\n4. At least one element in the sky (sun, clouds)\n5. Any other creative additions you want!\n\nThis is your chance to show everything you've learned. Use functions to organize your code. Use inputs to create variety. Use loops to avoid repetition. Most importantly - have fun with it!",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          'import turtle\nimport random\nt = turtle.Turtle()\nt.speed(0)\n\n# All the helper functions from before\ndef draw_square(size):\n    for i in range(4):\n        turtle.forward(size)\n        turtle.right(90)\n\ndef draw_triangle(size):\n    for i in range(3):\n        turtle.forward(size)\n        turtle.left(120)\n\ndef draw_rectangle(width, height):\n    for i in range(2):\n        turtle.forward(width)\n        turtle.right(90)\n        turtle.forward(height)\n        turtle.right(90)\n\ndef draw_house(x, y, size, house_color, roof_color):\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    \n    turtle.color(house_color)\n    turtle.begin_fill()\n    draw_square(size)\n    turtle.end_fill()\n    \n    turtle.color(roof_color)\n    turtle.begin_fill()\n    draw_triangle(size)\n    turtle.end_fill()\n\ndef draw_tree(x, y, trunk_width, trunk_height, leaves_size):\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    \n    turtle.color("brown")\n    turtle.begin_fill()\n    draw_rectangle(trunk_width, trunk_height)\n    turtle.end_fill()\n    \n    turtle.penup()\n    turtle.forward(trunk_width/2)\n    turtle.left(90)\n    turtle.forward(trunk_height)\n    turtle.right(90)\n    turtle.pendown()\n    \n    turtle.color("green")\n    turtle.begin_fill()\n    turtle.circle(leaves_size)\n    turtle.end_fill()\n\ndef draw_sun(x, y, size):\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    turtle.color("yellow")\n    turtle.begin_fill()\n    turtle.circle(size)\n    turtle.end_fill()\n\ndef draw_cloud(x, y):\n    turtle.penup()\n    turtle.goto(x, y)\n    turtle.pendown()\n    turtle.color("lightgray")\n    for offset in [0, 15, 30]:\n        turtle.penup()\n        turtle.goto(x + offset, y)\n        turtle.pendown()\n        turtle.begin_fill()\n        turtle.circle(20)\n        turtle.end_fill()\n\n# Create your neighborhood here!\n# Start with a road, then add houses, trees, and sky elements\n',
      },
      testCases: [
        {
          input: [null],
          expected: "SHAPE:neighborhood",
          description: "Test that a complete neighborhood is drawn",
        },
      ],
      testMode: "procedure",
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "inputs-reflection" as SectionId,
      title: "Function Inputs Reflection",
      content: [
        {
          kind: "text",
          value:
            'Function inputs transform rigid code into flexible building blocks. By adding inputs like size, color, and position, one function can create many different outputs.\n\nCreate a simple example showing how inputs make turtle functions more powerful. Remember to use the phrase "as seen in the example above".',
        },
      ],
      topic: "Making Turtle Functions Flexible",
      isTopicPredefined: true,
      code: "Show a turtle function that uses inputs effectively",
      isCodePredefined: false,
      explanation:
        "Explain how inputs make your function reusable (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "challenge-conclusion",
      title: "Reflection on Complexity",
      content: [
        {
          kind: "text",
          value:
            "If you made it this far, congratulations. Seriously. You just built something complex using all the programming concepts you've learned:\n\n- **Libraries** gave you powerful tools (turtle, random)\n- **Functions** let you break the problem into manageable pieces\n- **Inputs** made your functions flexible and reusable\n- **Loops** helped you avoid repetition\n- **Variables** stored important values\n\nLook back at your neighborhood. Every house, every tree, every cloud represents dozens of function calls, hundreds of turtle movements, and thousands of computer instructions. Yet it all started with simple commands like `forward()` and `right()`.\n\nThis is the power of programming: building complexity from simplicity, one function at a time. You're not just drawing pictures - you're thinking like a programmer.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
