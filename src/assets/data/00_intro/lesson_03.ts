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
  title: "Variables: Storing Data",
  guid: "5c3c6f3b-722f-4b19-b3ed-d532b7961f92" as LessonId,
  description:
    "Learn how to store and reuse data in your programs using variables. Variables are essential for creating programs that can work with different values.",
  sections: [
    {
      kind: "Information",
      id: "variables-intro",
      title: "Why Variables Matter",
      content: [
        {
          kind: "text",
          value:
            "So far, you've learned how to work with strings and integers directly in your code. But what if you want to use the same value multiple times? Or, what if you want to change a value that's used in many different locations? That's where **variables** come in. Variables allow you to store data and give it a name so you can use it later in your program.",
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
            "Creating a variable in Python is simple: you write the variable name, then an equals sign (`=`), then the value you want to store. For example `age = 13` creates a variable named `age` and then stores the integer 13 in it.\n\nRun the code below and pay attention to how the variable `name` gets created and then used in the two different print statements.",
        },
      ],
      example: {
        id: "basic-variable-example",
        title: "Your First Variable",
        code: 'name = "Alice"\nprint(name)\nprint("Hello, " + name + "!")',
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
          code: "age = 15\nprint(age)\nprint(age + 5)\nprint(age)",
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
            "One of the most powerful features of variables is that you can change their values. When you assign a new value to an existing variable, it replaces the old value. Use the debugging tool below to watch how the variable `score` changes as the program runs.\n\nStep through the code line by line and observe how the value of `score` changes. Pay particular attention to the following:\n- When a variable is created, it shows up in the `Variables` side-panel\n- When the value of a variable changes, the variable is highlighted in the `Variables` side-panel\n- Whenever a `print()` statement is run, the output is shown in the `Program Output` side-panel",
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
            "Variables work the same way with strings as they do with integers. You can reassign them and even use them to build new strings.\n\nPredict what you think this program will output, then run it to check your prediction.",
        },
      ],
      examples: [
        {
          id: "string-variable-change",
          code: 'greeting = "Hello"\nprint(greeting)\ngreeting = "Goodbye"\nprint(greeting)\ngreeting = greeting + "!"\nprint(greeting)',
          predictPrompt:
            "The variable `greeting` starts as 'Hello' but gets changed twice. What do you think each print statement will output?",
        },
      ],
      conclusion:
        "Just like with integers, you can reassign string variables and even use the variables in their own (re)assignment!",
    } as PRIMMSectionData,
    {
      kind: "Observation",
      id: "multiple-variables" as SectionId,
      title: "Using Multiple Variables",
      content: [
        {
          kind: "text",
          value:
            "Programs often use many variables at once. Each variable has its own name and stores its own value independently.\n\nRun the code below and observe how each variable maintains its own separate value, even when they're used together.",
        },
      ],
      example: {
        id: "multiple-vars-example",
        title: "Multiple Variables",
        code: 'first_name = "John"\nlast_name = "Smith"\nage = 25\nprint(first_name)\nprint(last_name)\nprint(age)\nprint(first_name + " " + last_name)',
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
