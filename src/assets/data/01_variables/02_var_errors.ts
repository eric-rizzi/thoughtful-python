import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
  LessonId,
  SectionId,
  MultipleSelectionSectionData,
  PRIMMSectionData,
  DebuggerSectionData,
  MultipleChoiceSectionData,
  TestingSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Variable Errors",
  guid: "5d47da97-ba3d-4ef4-8dab-4f725190a69b" as LessonId,
  description:
    "Learn how to handle and utilize multiple variables to create complex interactions.",
  sections: [
    {
      kind: "Information",
      id: "name-errors" as SectionId,
      title: "Variable Name Errors",
      content: [
        {
          kind: "text",
          value:
            "When you misspell a word in a string, you get a typo. When you misspell a variable name, however, you get an error. The error message follows the same format as the previous errors that we've encountered where the key information is in the last two lines. For example, assume you tried to run the code below.",
        },
        { kind: "code", value: "number = 10\nprint(numbr)\n" },
        {
          kind: "text",
          value:
            'This would result in the following error:\n```\nError:\n\nExecution Error: Traceback (most recent call last):\n  File "/lib/python311.zip/_pyodide/_base.py", line 573, in eval_code_async\n    await CodeRunner(\n  File "/lib/python311.zip/_pyodide/_base.py", line 393, in run_async\n    coroutine = eval(self.code, globals, locals)\n                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File "<exec>", line 2, in <module>\nNameError: name \'numbr\' is not defined\n```\nWhat the error is basically saying is that there is no variable named `numbr`. This makes sense because the program misspelled the variable `number` that was created on the previous line.',
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
            "Congratulations on learning about variables! You now understand how to store data, change it, and reuse it throughout your programs. Variables are the foundation for creating programs that can respond to complex problems.\n\nYou should feel proud. Over the previous three lessons, you've learned some of the most important concepts in programming. They will come up over and over again. In the next lesson, we'll pause and test ourselves on everything we've learned so far.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
