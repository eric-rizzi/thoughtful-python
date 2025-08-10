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
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Storing Data",
  guid: "5c3c6f3b-722f-4b19-b3ed-d532b7961f92" as LessonId,
  description:
    "Learn how to store and reuse data in your programs using variables to create more flexible, responsive programs.",
  sections: [
    {
      kind: "Information",
      id: "variables-intro",
      title: "Why Variables Matter",
      content: [
        {
          kind: "text",
          value:
            "So far, you've learned how to work with strings and integers directly in your code. But, what if you want to use the same value multiple times? Or, what if you want to easily change a value that's used in many different locations? That's where **variables** come in. Variables allow you to give a name to a piece of data so you can use it later in your program.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "basic-variables" as SectionId,
      title: "Creating Variables",
      content: [
        {
          kind: "text",
          value:
            "You can create a variable in Python in a single line: you write the variable name, then an equals sign (`=`), then the value you want to store. For example `age = 13` creates a variable named `age` and then stores the integer 13 in it.\n\nRun the code below and pay attention to how the variable `name` gets created and then used in the two different `print()` statements.",
        },
      ],
      example: {
        id: "basic-variable-example",
        title: "Your First Variable",
        code: 'name = "Alice"\nprint(name)\nprint("Hello, " + name)\n',
      },
    } as ObservationSectionData,
    {
      kind: "MultipleSelection",
      id: "variable-parts",
      title: "Parts of a Variable",
      content: [
        {
          kind: "text",
          value:
            'Looking at the line `name = "Alice"` from the example above, which of the following statements are true?',
        },
      ],
      options: [
        'The variable name is `"Alice"`',
        "The variable name is `name`",
        'The variable value is `"Alice"`',
        "The variable value is `name`",
        "The `=` sign stores the value in the variable",
        "The `=` sign checks if two things are equal",
      ],
      correctAnswers: [1, 2, 4],
      feedback: {
        correct:
          "Correct! The variable name goes on the left, the value goes on the right, and `=` stores the value in the variable name.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "PRIMM",
      id: "integer-variables" as SectionId,
      title: "Variables with Numbers",
      content: [
        {
          kind: "text",
          value:
            "Variables can store more than just strings; they can also store integers. Below is a program that stores an integer in a variable and then uses the variable in some calculations.\n\nPredict what you think the code will output, then run it to check your prediction.",
        },
      ],
      examples: [
        {
          id: "integer-variable-primm",
          code: "age = 15\nprint(age)\nprint(age + 5)\nprint(age)\n",
          predictPrompt:
            "The variable `age` is set to 15. What do you think each print statement will output?",
        },
      ],
      conclusion:
        "Variables remember their values! The variable `age` stayed 15 throughout the program, even after being used in the calculation `age + 5`",
    } as PRIMMSectionData,
    {
      kind: "Debugger",
      id: "variable-debugging" as SectionId,
      title: "Watching Variables Change",
      content: [
        {
          kind: "text",
          value:
            "One of the most powerful features of variables is that you can change the value they're storing. When you assign a new value to an existing variable, it replaces the old value.\n\nUse the debugging tool to step line-by-line through the code and observe how the value of `score` changes. Pay particular attention to the following:\n- When a variable is created, it shows up in the `Variables` side-panel\n- When the value of a variable changes, the variable is highlighted in the `Variables` side-panel\n- Whenever a `print()` statement is run, the output is shown in the `Program Output` side-panel",
        },
      ],
      code: "score = 10\nprint(score)\nscore = 20\nprint(score)\nscore = score + 5\nprint(score)",
    } as DebuggerSectionData,
    {
      kind: "MultipleChoice",
      id: "variable-reassignment",
      title: "Variable Values",
      content: [
        {
          kind: "text",
          value:
            "Based on what you observed in the previous section, what will be the final value of `points` after running this code?",
        },
        {
          kind: "code",
          value: "points = 100\npoints = 50\npoints = points + 25",
        },
      ],
      options: ["100", "50", "75", "175"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! The variable starts at 100, gets sets to 50, then gets changed to 50 + 25 = 75.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "string-variables-primm" as SectionId,
      title: "Changing String Variables",
      content: [
        {
          kind: "text",
          value:
            "Just like with integers, you can change (e.g., update, overwrite, reassign) the value that a variable is holding. And, just like with integers, you can use the old value when calculating what new value to store in the variable.\n\nPredict what you think this program will output, then run it to check your prediction.",
        },
      ],
      examples: [
        {
          id: "string-variable-change",
          code: 'greeting = "Hello"\nprint(greeting)\ngreeting = "Goodbye"\nprint(greeting)\ngreeting = greeting + "!"\nprint(greeting)',
          predictPrompt:
            'The variable `greeting` starts as "Hello" but gets changed twice. What do you think each print statement will output?',
        },
      ],
      conclusion:
        "Just like with integers, you can reassign string variables and even use the variables in their own (re)assignment!",
    } as PRIMMSectionData,
    {
      kind: "Information",
      id: "variables-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Congratulations on learning about variables! You now understand how to store data, change it, and reuse it throughout your programs. Variables are the foundation for creating programs that can respond to complex problems.\n\nIn the next lesson you'll learn how to create multiple variables and create your own program that uses variables to solve a real-world problem.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
