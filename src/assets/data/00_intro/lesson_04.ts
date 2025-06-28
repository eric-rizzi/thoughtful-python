import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Review and Practice",
  guid: "14f3ba03-2020-44e6-b68d-ae8dde46da7e" as LessonId,
  description:
    "Test your understanding of strings, integers, and variables with a variety of practice problems and challenges.",
  sections: [
    {
      kind: "Information",
      id: "review-intro",
      title: "Practicing with Interleaving",
      content: [
        {
          kind: "text",
          value:
            "You've learned a lot in the first three lessons: how to work with strings and integers, how they behave differently, and how to store values in variables. This lesson uses a learning technique called **interleaving** to help solidify your understanding.\n\nInstead of practicing just one topic at a time, you'll encounter questions that mix strings, integers, and variables together. This approach mirrors how real programming works and helps your brain make stronger connections between related concepts. Take your time and think carefully about each problem!",
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "string-identification",
      title: "Identifying Strings",
      content: [
        {
          kind: "text",
          value:
            "Which of the following is a valid string that could be printed without causing an error?",
        },
      ],
      options: [
        "'It's a beautiful day'",
        '"She said "hello" to me"',
        '"Hello World"',
        "'The cat's meow'",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! This string uses double quotes consistently without any conflicting quotes inside.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleSelection",
      id: "data-types",
      title: "Data Types",
      content: [
        {
          kind: "text",
          value: "Select all of the following that are integers (not strings):",
        },
      ],
      options: ["42", '"42"', "0", '"hello"', "999", "'999'", "-5", '"-5"'],
      correctAnswers: [0, 2, 4, 6],
      feedback: {
        correct:
          "Correct! Integers are whole numbers without quotation marks around them.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "MultipleChoice",
      id: "string-operations",
      title: "String Concatenation",
      content: [
        {
          kind: "text",
          value: "What will be the output of the following code?",
        },
        { kind: "code", value: 'print("cat" + "dog")' },
      ],
      options: ["catdog", "cat dog", "cat + dog", "An error"],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct! When you use + with strings, it concatenates (joins) them together with no space in between.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "integer-operations",
      title: "Integer Math",
      content: [
        {
          kind: "text",
          value: "What will be the output of the following code?",
        },
        { kind: "code", value: "print(15 - 3)" },
      ],
      options: ["18", "12", "153", "15-3"],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! When you use - with integers, it performs subtraction: 15 - 3 = 12.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleSelection",
      id: "type-errors",
      title: "Type Errors",
      content: [
        {
          kind: "text",
          value:
            "Which of the following lines of code would cause a TypeError?",
        },
      ],
      options: [
        'print("5" + "3")',
        "print(5 + 3)",
        'print("5" + 3)',
        'print(5 + "3")',
        'print("hello" + "world")',
        'print("hello" - "world")',
      ],
      correctAnswers: [2, 3, 5],
      feedback: {
        correct:
          "Correct! You get TypeErrors when you try to mix strings and integers with +, or when you try to use - with strings.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Testing",
      id: "string-practice" as SectionId,
      title: "Challenge: Quote Master",
      content: [
        {
          kind: "text",
          value:
            'Write a program that prints out the following three lines exactly as shown:\n\n1. `The teacher said, "Good job!"`\n2. `It\'s going to be a great day.`\n3. `"Why?" she asked.`\n\nRemember to think carefully about which type of quotes to use for each line!',
        },
      ],
      example: {
        id: "quote-challenge",
        title: "Print the Quotes",
        code: "# Write your three print statements here",
        testCases: [
          {
            input: null,
            expected:
              'The teacher said, "Good job!"\nIt\'s going to be a great day.\n"Why?" she asked.',
            description: "Test that all three quotes are printed correctly",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "MultipleChoice",
      id: "variable-assignment",
      title: "Variable Assignment",
      content: [
        {
          kind: "text",
          value:
            "After running the following code, what will be the value of the variable `x`?",
        },
        { kind: "code", value: "x = 10\nx = 5\nx = x + 3\n" },
      ],
      options: ["10", "5", "8", "18"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! x starts at 10, then gets changed to 5, then gets changed to 5 + 3 = 8.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleSelection",
      id: "variable-behavior",
      title: "How Variables Work",
      content: [
        {
          kind: "text",
          value: "Which of the following statements about variables are true?",
        },
      ],
      options: [
        "Variables can store both strings and integers",
        "Once you assign a value to a variable, it can never be changed",
        "Variable names must always be surrounded by quotes",
        "You can use a variable in its own reassignment (like x = x + 1)",
        "Variables remember their values throughout the program",
        "The = sign checks if two values are equal",
      ],
      correctAnswers: [0, 3, 4],
      feedback: {
        correct:
          "Correct! Variables are flexible containers that can be reassigned and used in calculations.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "MultipleChoice",
      id: "variable-naming",
      title: "Variable Names",
      content: [
        {
          kind: "text",
          value: "Looking at this code, what is the name of the variable?",
        },
        { kind: "code", value: 'favorite_food = "pizza"' },
      ],
      options: ["favorite_food", '"pizza"', "pizza", "="],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct! The variable name is favorite_food - it's the identifier on the left side of the = sign.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "tricky-prediction",
      title: "Tricky Prediction",
      content: [
        {
          kind: "text",
          value: "What will be printed by the last line of this code?",
        },
        {
          kind: "code",
          value:
            'message = "Hello"\nmessage = message + " World"\nprint(message)',
        },
      ],
      options: ["Hello", "World", "Hello World", "message + World"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! The variable message starts as 'Hello', then gets reassigned to 'Hello' + ' World' = 'Hello World'.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "variable-practice" as SectionId,
      title: "Challenge: Dog Years",
      content: [
        {
          kind: "text",
          value:
            "Now it's your turn to work with variables! Create a program that:\n\n1. Creates a variable called `dog_age` and stores the number `3` in it\n2. Prints out the dog's age\n3. Prints out the dog's age in human years (multiply by 7)",
        },
      ],
      example: {
        id: "variable-challenge",
        title: "Implement Your Solution",
        code: "# Create your variable here\n\n# Print the required outputs here",
        testCases: [
          {
            input: null,
            expected: "3\n21",
            description: "Test with dog_age=3, should print 3 then 21",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Information",
      id: "review-conclusion",
      title: "The Power of Interleaving",
      content: [
        {
          kind: "text",
          value:
            "Excellent job working through these interleaved practice problems! By mixing questions about strings, integers, and variables together, your brain had to actively recall and apply different concepts rather than just following a single pattern. This type of practice - where you switch between related topics - has been proven to create stronger, more durable learning.\n\nYou've demonstrated your understanding of all the foundational concepts and you're ready to move on to more advanced topics!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
