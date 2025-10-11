import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  TestingSectionData,
  ReflectionSectionData,
  MatchingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Variable Errors",
  guid: "5d47da97-ba3d-4ef4-8dab-4f725190a69b" as LessonId,
  description:
    "Learn how to interpret errors that come up when using variables.",
  sections: [
    {
      kind: "Information",
      id: "name-errors-intro",
      title: "Introduction",
      content: [
        {
          kind: "text",
          value:
            "Using variables is necessary for pretty much all programs. Therefore, it's necessary to know how to handle errors that are \"raised\" while you're using them. As stated in the previous lesson on `TypeErrors`, errors are one of the most common reasons new programmers feel overwhelmed. Learning to understand variable errors will make you a more confident, able programmer.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Information",
      id: "name-errors" as SectionId,
      title: "Variable Name Errors",
      content: [
        {
          kind: "text",
          value:
            "When you misspell a word in a string, you get a typo. When you misspell a variable name, you get a `NameError`. The error message follows the same format as the previous errors that we've encountered where the key information is in the last two lines. For example, assume you tried to run the code below.",
        },
        { kind: "code", value: "number = 10\nprint(numbr)\n" },
        {
          kind: "text",
          value:
            'This would result in the following error:\n```\nError:\n\nExecution Error: Traceback (most recent call last):\n  File "/lib/python311.zip/_pyodide/_base.py", line 573, in eval_code_async\n    await CodeRunner(\n  File "/lib/python311.zip/_pyodide/_base.py", line 393, in run_async\n    coroutine = eval(self.code, globals, locals)\n                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File "<exec>", line 2, in <module>\nNameError: name \'numbr\' is not defined\n```\nWhat the error is saying is that there is no variable named `numbr`. This makes sense because the program misspelled the variable `number` that was created on the previous line.',
        },
      ],
    } as InformationSectionData,
    {
      kind: "Testing",
      id: "misspelling-errors" as SectionId,
      title: "Misspelled Variables",
      content: [
        {
          kind: "text",
          value:
            "There is a misspelling in the simple program below. Use the `NameError` that is raised when you run the program so that you can quickly find and fix the bug.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "var_a = 10\nvar_b = 11\nvar_c = var_b + van_a\nvar_z = var_a + var_b + var_c\nprint(var_z)",
      },
      testCases: [
        {
          input: [null],
          expected: "42",
          description: "Test don't get NameError",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Matching",
      id: "partial-program" as SectionId,
      title: "Different Error Types",
      content: [
        {
          kind: "text",
          value:
            'Computes will execute Python programs up until they hit an error. This means that you can end up with a program that partially works, and then breaks in the middle.\n\nOrder the following lines of a program so that the program would print out `8`, `15` and then "raise" a `NameError`',
        },
      ],
      prompts: [
        { "Line 1": "x = 6" },
        { "Line 2": "x = x + 2" },
        { "Line 3": "print(x)" },
        { "Line 4": "x = x + 6" },
        { "Line 5": "print(x + 1)" },
        { "Line 6": "x = x + y" },
      ],
      feedback: {
        correct:
          "Correct! The computer runs lines 1 - 5 and then raises an error on line 6 because the variable `y` hasn't been created yet.",
      },
    } as MatchingSectionData,
    {
      kind: "Information",
      id: "all-variable-pieces",
      title: "All the Pieces",
      content: [
        {
          kind: "text",
          value:
            'Hopefully, now you can appreciate how a computer executes a program. A computer goes line by line through the program. Every time it sees a line with a `=`, it calculates the value of the stuff on the right and stores it into the variable on the left. Every time a variable is read, the computer accesses its memory for the value stored inside it. If a variable by that name hasn\'t been created before, then the computer "raises" a `NameError`. If the operation between the data isn\'t possible, then it "raises" a `TypeError`. Finally, if there\'s something like a missing parentheses or quotation mark, it "raises" a `SyntaxError`.\n\nThis is basically how your computer is working right now. It\'s executing billions of lines of code a second, reading values in memory and using those values to calculate new things. The overall effect is a machine that seamlessly responds to your clicks and keystrokes.',
        },
      ],
    } as InformationSectionData,
    {
      kind: "Testing",
      id: "variable-practice" as SectionId,
      title: "Challenge: Personal Information",
      content: [
        {
          kind: "text",
          value:
            'Now it\'s your turn to pull all the pieces together! Write a program that:\n1. Creates a variable called `favorite_color` and stores the color `"green"` in it\n2. Creates a variable called `lucky_number` that stores the number `7` in it\n3. Prints out the color\n4. Prints out the lucky number\n5. Prints out the lucky number plus 10',
        },
      ],
      example: {
        visualization: "console",
        initialCode: "favorite_color = \nlucky_number =\n",
      },
      testCases: [
        {
          input: [null],
          expected: "green\n7\n17",
          description: "Test with favorite_color='green' and lucky_number=7",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "variables-reflection" as SectionId,
      title: "Variables Reflection",
      content: [
        {
          kind: "text",
          value:
            'Variables are fundamental to programming because they allow programs to store, update, and reuse data. Without variables, every bit of data would have to be written directly into the code, making programs inflexible and hard to maintain.\n\nNow it\'s time to reflect in order to formalize your knowledge. Create a simple 3-4 line code example that demonstrates how variables can make a program more useful, and write 3-4 sentences explaining how your program works. Remember to use the phrase "as seen in the example above".',
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
            "Congratulations on learning about variables! You now understand how to store data, update it, and reuse it throughout your programs. Variables are the foundation for creating programs that can respond to complex problems.\n\nYou should feel proud. Over the previous three lessons, you've learned some of the most important concepts in programming. They will come up over and over again. In the next lesson, we'll pause and test ourselves on everything we've learned so far.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
