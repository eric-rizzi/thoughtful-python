import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  MultipleChoiceSectionData,
  PRIMMSectionData,
  TestingSectionData,
  ReflectionSectionData,
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
            'One of the oldest ways to teach programming is by having students use drawing libraries. These libraries are called "turtle libraries" because they let you create drawings by controlling a virtual turtle\'s movements around the screen. The "turtle" carries a pen and leaves a trail as it moves. You can tell the "turtle" to move forward, turn, lift its pen up, put its pen down, and even change the pen\'s colors. By combining these simple commands, you can create complex drawings.',
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
            "Turtles are wonderful tool for learning programming because you can see what each line of code does. With this foundation, you can build up to more and more complex shapes.",
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
            "Let's start with the basics. The program below imports the `turtle` library, and then uses functions within the library to move the turtle around the screen. Run the program and watch what the turtle does. Pay attention to how each individual function affects the turtle's movement.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef make_T():\n  turtle.forward(100)\n  turtle.right(90)\n  turtle.forward(100)\n  turtle.left(180)\n  turtle.forward(200)\n\nmake_T()",
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "turtle-angle",
      title: "Turtle Angles",
      content: [
        {
          kind: "text",
          value: "In the code above, what does `t.right(90)` function do?",
        },
      ],
      options: [
        "Moves the turtle 90 pixels to the right",
        "Rotates the turtle 90 degrees to the right",
        "Draws a line 90 pixels long",
        "Makes the turtle face right on the screen",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! The turtle rotates 90 degrees to the right. Think of it like making a right-angle turn.",
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
            "Now let's try something more interesting. The code below has three main parts. First, the `turtle` library is imported, giving us the ability to draw shapes. Second, there's a `make_shape()` function that has the turtle draw some mysterious shape. Finally, there's a `make_shape()` function call that results in the shape being drawn once. Given all this, predict what shape will be drawn, then run the program to check you prediction.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef make_shape():\n  turtle.forward(100)\n  turtle.right(90)\n  turtle.forward(100)\n  turtle.right(90)\n  turtle.forward(100)\n  turtle.right(90)\n  turtle.forward(100)\n\nmake_shape()",
      },
      predictPrompt:
        "Look at the pattern of `forward()` and `right()` function calls. What shape do you think this will draw?",
      conclusion:
        "It draws a square! Each `right(90)` function call makes a 90-degree turn, and four 90-degree turns bring you back to where you started.",
    } as PRIMMSectionData,

    {
      kind: "PRIMM",
      id: "multi-square-primm" as SectionId,
      title: "Drawing Shapes",
      content: [
        {
          kind: "text",
          value:
            "The code below is very similar to the program above. There's only one difference: we call the function four times. Given this change, predict what shape will be drawn, then run the program to check you prediction.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef make_shape():\n  turtle.forward(100)\n  turtle.right(90)\n  turtle.forward(100)\n  turtle.right(90)\n  turtle.forward(100)\n  turtle.right(90)\n  turtle.forward(100)\n  turtle.right(90)\n\nmake_shape()\nmake_shape()\nmake_shape()\nmake_shape()\n",
      },
      predictPrompt:
        "Look at the pattern of `forward()` and `right()` functions. What shape do you think this will draw?",
      conclusion:
        "It draws a square! Each `right(90)` makes a 90-degree turn, and four 90-degree turns bring you back to where you started.",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "draw-triangle" as SectionId,
      title: "Challenge: Draw a Triangle",
      content: [
        {
          kind: "text",
          value:
            "Now it's your turn! Write a program that draws an equilateral triangle (all sides the same length).\n\nHint: The interior angles add up to 180 degrees.",
        },
      ],
      example: {
        visualization: "turtle",
        initialCode:
          "import turtle\n\ndef make_triangle():\n  # Each side should be 100 pixels\n\nmake_triangle()",
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
      kind: "Reflection",
      id: "library-reflection" as SectionId,
      title: "Libraries Reflection",
      content: [
        {
          kind: "text",
          value:
            'Libraries are collections of functions that extend Python\'s capabilities. Without libraries, you\'d have to write every function from scratch. The word "library" was chosen very deliberately: the `import` statement is like checking out a book from a library - it gives you access to all the functions inside.\n\nCreate a simple 3-4 line example that uses the `random`, `math`, or `turtle` library, and explain how libraries make programming more powerful. Remember to use the phrase "as seen in the example above".',
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
      id: "turtle-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "In this lesson, you learned about a new library named `turtle`. In addition, you experimented with using that library within functions of your own to build increasingly complex shapes. In the next lesson, we'll use functions to build even more complex drawings. The goal is for you to appreciate how functions can package up other, smaller pieces to create something very interesting.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
