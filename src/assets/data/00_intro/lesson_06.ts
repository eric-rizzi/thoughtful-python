import type {
  DebuggerSectionData,
  InformationSectionData,
  Lesson,
  LessonId,
  MatchingSectionData,
  MultipleChoiceSectionData,
  SectionId,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Functions and Computers",
  guid: "bfa974e1-7042-48a4-a568-19a1816ea474" as LessonId,
  description: "Dive deeper into functions and see how computers execute them",
  sections: [
    {
      kind: "Information",
      id: "function-refresher",
      title: "Function Refresher",
      content: [
        {
          kind: "text",
          value:
            "Functions are very useful for making a program easier to understand. You create the function once and then use it over and over again. In this lesson, we'll investigate how a computer executes functions and how to know when functions are needed.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Matching",
      id: "ordering-function-pieces" as SectionId,
      title: "Function Pieces",
      content: [
        {
          kind: "text",
          value:
            "Let's revisit the parts of a function from the previous lesson. Match up each part of the function with the order they come in when you're defining and calling a function.",
        },
      ],
      prompts: [
        { First: "`def`" },
        { Second: "Function name" },
        { Third: "`()`" },
        { Fourth: "`:`" },
        { Fifth: "Indentation" },
        { Sixth: "Function Code" },
        { Seventh: "Function Call" },
      ],
    } as MatchingSectionData,
    {
      kind: "Information",
      id: "function-summary",
      title: "Function Execution and Folding",
      content: [
        {
          kind: "text",
          value:
            "The video below is another explanation of how functions work. It does a very nice job of showing how you can shrink the size of your program if you can identify patterns within your code. Pay particular attention to how 12 lines of code becomes just seven lines via functions.",
        },
        {
          kind: "video",
          src: "https://youtu.be/89cGQjB5R4M?si=ZNeKHOLUFGsv762R",
          caption: "Video reinforcing functions",
          end: 110,
        },
        {
          kind: "text",
          value:
            "Now that you've finished watching, just pause and reflect for a moment. The video did a nice job showing how you could \"fold\" your program to reduce it's length. This is where the art of programming comes in. It's about identifying patterns that allow you to make your programs smaller and easier to understand.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Debugger",
      id: "function-debugging" as SectionId,
      title: "Watching Functions Be Called",
      content: [
        {
          kind: "text",
          value:
            'When a computer runs a program, it goes line by line. When it encounters a function, it goes inside the function and runs every line inside the function. Once the computer finishes the function, it returns back to the line that called the function and continues.\n\nThe program below allows you to slowly "step" through the program from the video and see how it is equivalent to the original, 12 line program. Use the debugger to step through each line of the program. The most important part to notice is every time a function is called:\n1. The computer remembers where the function call is\n2. The computer runs all the code inside the function\n3. The computer returns to right after the remembered function call\nThis process of calling, running, and returning to the call location is how seven lines of code can become the equivalent of 12.',
        },
      ],
      code: 'def happy_birthday():\n    print("Happy birthday to you!")\n    print("You are old!")\n    print("Happy birthday to you!")\n\nhappy_birthday()\nhappy_birthday()\nhappy_birthday()',
      advancedControls: false,
    } as DebuggerSectionData,
    {
      kind: "MultipleChoice",
      id: "num-lines-function-question",
      title: "How Many Lines?",
      content: [
        {
          kind: "text",
          value:
            "If you were to recreate the program below _without_ functions, how many lines of code would it have to be?",
        },
        {
          kind: "code",
          value:
            'def joke():\n    print("Why do you never want to argue with a 90-degree angle?")\n    print("Because they\'re always right")\n\njoke()\njoke()\njoke()',
        },
      ],
      options: ["2", "4", "6", "8"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! Calling a two line function three times is equivalent to 6 lines of code.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "problem-function-question",
      title: "What's the Problem?",
      content: [
        {
          kind: "text",
          value: "There's a subtle bug in the code below. What is the problem?",
        },
        {
          kind: "code",
          value:
            'def joke:\n    print("What do you call a pony with a cough?")\n    print("A little horse.")\n\njoke()',
        },
      ],
      options: [
        "Def should be capitalized",
        "Missing parentheses after the function name",
        "Improper indentation in the code in the function",
        "The function calls shouldn't have parentheses",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Calling a two line function three times is equivalent to 6 lines of code.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "banana-practice" as SectionId,
      title: "Challenge: Minimal Function Calls",
      content: [
        {
          kind: "text",
          value:
            'Now it\'s your turn to work with functions! Create a program that uses the minimal number of function calls to print the word "banana". Hint: you can do it with just four function calls.',
        },
      ],
      example: {
        id: "banana-challenge",
        title: "Implement Your Solution",
        code: 'def fn_1():\n    print("b")\n\ndef fn_2():\n    print("a")\n\ndef fn_3():\n    print("n")\n\ndef fn_4():\n    fn_2()\n    fn_3()\n\n# Your code here\n',
        testCases: [
          {
            input: null,
            expected: "b\na\nn\na\nn\na",
            description: "Test can print banana",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Information",
      id: "variables-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value: `Congratulations on learning how computers execute functions! In the next lesson, we'll see how to make them a bit more general by using "inputs" to the function.`,
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
