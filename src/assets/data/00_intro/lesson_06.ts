import type {
  DebuggerSectionData,
  InformationSectionData,
  Lesson,
  LessonId,
  MatchingSectionData,
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
            "Functions are very useful for making a program easier to understand. You create the function once and then use it over and over again. In this lesson, we'll investigate how a computer executes functions and how to make functions a bit more general by allowing them to accept and use **inputs**.",
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
      kind: "Debugger",
      id: "function-debugging" as SectionId,
      title: "Watching Functions Be Called",
      content: [
        {
          kind: "text",
          value:
            'When a computer runs a program, it goes line by line. When it encounters a function, it goes inside the function and runs every line inside the function. Once the computer finishes the function, it returns back to the line that called the function and continues.\n\nThe program below illustrates this process by using the same function to greet different people. Use the debugger to step through each line of the program. The most important part to notice is every time a function is called, the "main" part of the program basically pauses as it waits for the code inside the function to run and complete.',
        },
      ],
      code: 'def greet():\n    print("Hello!")\n    print("Great to see you.")\n    print("How are things?")\n\ngreet()\nprint("Turn to other person")\ngreet()\nprint("All done!")',
      advancedControls: false,
    } as DebuggerSectionData,

    {
      kind: "Information",
      id: "function-execution",
      title: "Function Execution",
      content: [
        {
          kind: "text",
          value: "TODO",
        },
        {
          kind: "video",
          src: "TODO",
          caption: "Video about how computers run functions",
        },
      ],
    } as InformationSectionData,
    // TODO: Add a few multiple choice questions
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
          value: `Congratulations on making your way through the introduction about functions! In the next lesson, we'll see how to make them a bit more general by using "inputs" to the function.`,
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
