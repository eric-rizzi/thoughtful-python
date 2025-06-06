import type { Lesson, TurtleSectionData } from "../../../types/data";

const lessonData: Lesson = {
  title: "Turtle Graphics Challenge",
  guid: "5831a4e6-9d52-42bb-9a45-c3cd5ba53a51",
  description:
    "Apply your Python skills to create shapes using Turtle Graphics. This fun challenge will test your ability to use loops and coordinate geometry.",
  sections: [
    {
      kind: "Information",
      id: "turtle-intro",
      title: "Introduction to Turtle Graphics",
      content:
        "Turtle Graphics is a fun way to visualize programming. Imagine a turtle that can move around the screen, leaving a trail as it goes. You can control the turtle with simple commands like forward, backward, left, and right.\n\nIn this lesson, you'll complete two drawing challenges using the turtle. As a reward for completing the quiz in the previous lesson, you can now unleash your creativity with these visual challenges!",
    },
    {
      kind: "Turtle",
      id: "square-challenge",
      title: "Challenge 1: Draw a Rectangle",
      content:
        "Your first challenge is to draw a rectangle that is exactly 100 pixels wide and 50 pixels high using the turtle. The rectangle can be positioned anywhere on the canvas, but it must have the exact dimensions specified.",
      instructions:
        "Use the turtle commands to draw your rectangle. Remember that a rectangle has 4 sides, with opposite sides of equal length.",
      initialCode:
        "# Use the turtle to draw a rectangle 100x50 pixels\nimport turtle\nt = turtle.Turtle()\nt.forward(100)\nt.left(90)\nt.forward(50)\nt.left(90)\nt.forward(100)\nt.left(90)\nt.forward(50)\n",
      validationCriteria: {
        type: "commands",
        expectedJsCommands: [
          { type: "clear" },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 90 },
          {
            type: "forward",
            distance: 50,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 90 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 90 },
          {
            type: "forward",
            distance: 50,
            penDown: true,
            color: "black",
          },
        ],
      },
      turtleCommands: [
        {
          name: "forward(distance)",
          description: "Move the turtle forward by the specified distance",
        },
        {
          name: "backward(distance)",
          description: "Move the turtle backward by the specified distance",
        },
        {
          name: "right(angle)",
          description:
            "Turn the turtle right by the specified angle (in degrees)",
        },
        {
          name: "left(angle)",
          description:
            "Turn the turtle left by the specified angle (in degrees)",
        },
        {
          name: "penup()",
          description: "Stop the turtle from drawing as it moves",
        },
        {
          name: "pendown()",
          description: "Start the turtle drawing as it moves",
        },
      ],
      feedback: {
        correct:
          "Great job! You've successfully drawn a 100x50 pixel rectangle. Notice how you need to turn 90 degrees at each corner of the rectangle.",
        incorrect:
          "Your drawing doesn't appear to be a 100x50 pixel rectangle. Remember that a rectangle has 4 sides with opposite sides of equal length. Try again!",
      },
    } as TurtleSectionData,
    {
      kind: "Turtle",
      id: "octagon-challenge",
      title: "Challenge 2: Draw an Octagon",
      content:
        "Your second challenge is to draw a regular octagon (an 8-sided shape with all sides of equal length and all interior angles equal). Each side should be exactly 100 pixels long.",
      instructions:
        "Use the turtle commands to draw your octagon. A regular octagon has 8 equal sides and 8 equal interior angles of 135 degrees. Think about how many degrees the turtle needs to turn at each vertex to create an octagon.",
      initialCode:
        "# Use the turtle to draw a regular octagon with sides of 100 pixels each\nimport turtle\nt = turtle.Turtle()\nfor _ in range(8):\n    t.forward(100)\n    t.left(45)\n",
      validationCriteria: {
        type: "commands",
        expectedJsCommands: [
          { type: "clear" },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
          {
            type: "forward",
            distance: 100,
            penDown: true,
            color: "black",
          },
          { type: "left", angle: 45 },
        ],
      },
      turtleCommands: [
        {
          name: "forward(distance)",
          description: "Move the turtle forward by the specified distance",
        },
        {
          name: "backward(distance)",
          description: "Move the turtle backward by the specified distance",
        },
        {
          name: "right(angle)",
          description:
            "Turn the turtle right by the specified angle (in degrees)",
        },
        {
          name: "left(angle)",
          description:
            "Turn the turtle left by the specified angle (in degrees)",
        },
        {
          name: "penup()",
          description: "Stop the turtle from drawing as it moves",
        },
        {
          name: "pendown()",
          description: "Start the turtle drawing as it moves",
        },
      ],
      feedback: {
        correct:
          "Excellent! You've successfully drawn a regular octagon with sides of 100 pixels each. You've mastered the basics of Turtle Graphics!",
        incorrect:
          "Your drawing doesn't appear to be a regular octagon with 100-pixel sides. Remember that a regular octagon has 8 equal sides and requires turning 45 degrees at each corner. Try again!",
      },
    } as TurtleSectionData,
    {
      kind: "Information",
      id: "turtle-conclusion",
      title: "Congratulations!",
      content:
        "You've completed the Turtle Graphics challenges! These exercises demonstrate how programming can be used for creative visual tasks. The turtle module is included in Python's standard library, so you can continue exploring turtle graphics in regular Python as well.\n\nSome ideas for further exploration:\n- Draw more complex shapes like stars or spirals\n- Create animated drawings by changing colors and speeds\n- Implement simple geometric patterns or even fractals like the Koch snowflake\n\nTurtle graphics is a great way to visualize algorithms and practice your programming skills while creating something visually appealing.",
    },
  ],
};

export default lessonData;
