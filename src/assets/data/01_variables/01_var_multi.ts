import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
  LessonId,
  SectionId,
  DebuggerSectionData,
  MultipleChoiceSectionData,
  TestingSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Variables: Storing Data",
  guid: "aa145d0e-68cb-44b2-a484-8d7ab19e2810" as LessonId,
  description:
    "Learn how to handle and utilize multiple variables to create complex interactions.",
  sections: [
    {
      kind: "Information",
      id: "variables-conclusion",
      title: "A Different Perspective on Variables",
      content: [
        {
          kind: "text",
          value:
            "Using only one way to ingest information (e.g., reading) limits your potential. For optimal results, it's best to use a technique called dual encoding, which means mixing up the ways you learn. The more ways you can see, hear, touch, or smell what you're learning, the more likely it is to stick.\n\nFor this reason, where applicable, we've included images and videos to augment the lessons. In this case, the video below talks about variables and explains how they hold different data types in \"slots\" of memory in the computer. You can almost view variables as labels for the memory holding the data you want to store.",
        },
        {
          kind: "video",
          src: "https://www.youtube.com/watch?v=cQT33yu9pY8",
          start: 4,
          end: 57,
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "variable-reassignment",
      title: "Variable Values",
      content: [
        {
          kind: "text",
          value:
            "If you were to insert the line `students_count = students_count + 16` between the first and second line of the example from the video, what would be printed out?",
        },
      ],
      options: ["16", "1000", "1016", "Error"],
      correctAnswer: 2,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Debugger",
      id: "multiple-variables-debugging" as SectionId,
      title: "Watching Multiple Variables Change",
      content: [
        {
          kind: "text",
          value:
            'It\'s time to increase the degree of difficulty by using _multiple_ variables. This is very common when a program needs to store and operate on different pieces of data. When this happens, each variable has its own name and stores its own, independent value.\n\nStep line-by-line through the code below and observe how each variable maintains its own, separate value. As before, pay attention to the `Variables` and `Program Output` side-panels. If you go slow, you can see how different values pop in and out of the memory slots designated by the variable "labels".',
        },
      ],
      code: 'first_name = "Eric"\nlast_name = "Smith"\nage = 25\nfirst_name = first_name + "a"\nage = age + 10\nprint(first_name + " " + last_name)\nage = age + 3\nprint(age)',
    } as DebuggerSectionData,
    {
      kind: "Information",
      id: "name-errors" as SectionId,
      title: "Variable Name Errors",
      content: [
        {
          kind: "text",
          value:
            "When you misspell a word in a string, nothing bad happens other than a typo. When you misspell a variable name, however, you get an error. The error message follows the same format as the previous errors that we've encountered where the key information is in the last two lines. For example, assume you tried to run the code below.",
        },
        { kind: "code", value: "number = 10\nprint(numbr)\n" },
        {
          kind: "text",
          value:
            'This would result in the following error:\n```\nError:\n\nExecution Error: Traceback (most recent call last):\n  File "/lib/python311.zip/_pyodide/_base.py", line 573, in eval_code_async\n    await CodeRunner(\n  File "/lib/python311.zip/_pyodide/_base.py", line 393, in run_async\n    coroutine = eval(self.code, globals, locals)\n                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File "<exec>", line 2, in <module>\nNameError: name \'numbr\' is not defined\n```\nWhat the error is basically saying is that there is no variable named `numbr`. This makes sense because the program misspelled the variable `number`.',
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "name-errors" as SectionId,
      title: "Variable Name Errors",
      content: [
        {
          kind: "text",
          value:
            "There is a misspelling in the simple program below. Use the `NameError` that is output when you run the program so that you can quickly find and fix the bug.",
        },
      ],
      example: {
        id: "misspelled-var-name-error",
        title: "Something's Wrong",
        code: "var_a = 10\nvar_b = 11\nvar_c = var_b + van_c\nvar_z = var_a + var_b + var_c",
      },
    } as ObservationSectionData,
    {
      kind: "Testing",
      id: "variable-practice" as SectionId,
      title: "Challenge: Personal Information",
      content: [
        {
          kind: "text",
          value:
            'Now it\'s your turn! Write a program that:\n1. Creates a variable called `favorite_color` and stores the color `"green"` in it\n2. Creates a variable called `lucky_number` that stores the number `7` in it\n3. Prints out the color\n4. Prints out the lucky number\n5. Prints out the lucky number plus 10',
        },
      ],
      example: {
        id: "variable-challenge",
        title: "Implement Your Solution",
        code: "favorite_color = \nlucky_number =\n",
        testCases: [
          {
            input: null,
            expected: "green\n7\n17",
            description: "Test with favorite_color='green' and lucky_number=7",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "variables-reflection" as SectionId,
      title: "Variables Reflection",
      content: [
        {
          kind: "text",
          value:
            'Variables are fundamental to programming because they allow programs to store, change, and reuse data. Without variables, every value would have to be written directly into the code, making programs inflexible and hard to maintain.\n\nNow it\'s time to reflect to formalize your knowledge. Create a simple 3-4 line code example that demonstrates how variables can make a program more useful, and write 3-4 sentences explaining how your program works. Remember to use the phrase "as seen in the example above".',
        },
      ],
      topic: "Why Variables Matter",
      isTopicPredefined: true,
      code: "Create an example showing why variables are useful",
      isCodePredefined: false,
      explanation: "Explain how the code in example works (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "variables-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Great job learning about some of the complexities of variables! The more practice you have, the easier to will be to understand when and how to use variables and how to debug any issues that pop up while you're using them.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
