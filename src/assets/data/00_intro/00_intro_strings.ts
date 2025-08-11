import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
  LessonId,
  SectionId,
  MultipleSelectionSectionData,
  PRIMMSectionData,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Python Basics",
  guid: "3c1e0332-e7ec-4e6a-b0c6-f9c9890999c5" as LessonId,
  description:
    "Welcome to your first Python lesson! In this lesson, you'll learn how to write your first simple program.",
  sections: [
    {
      kind: "Information",
      id: "python-history",
      title: "The History of Python",
      content: [
        {
          kind: "text",
          value:
            "Python was first released in 1991. Since then, it has become a very popular language because of its clean syntax and the way that well-written Python programs almost read like English prose.",
        },
        {
          kind: "image",
          src: "00_intro/simple_program.png",
          alt: "Screenshot of a simple Python program in VSCode",
          maxWidthPercentage: 70,
        },
        {
          kind: "text",
          value:
            'Learning Python is great for formalizing your understanding of difficult topics and sharing your ideas with others. In this lesson, you\'ll learn how to print out "strings of characters" to the screen: a necessary part of building useful programs.',
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "print-function" as SectionId,
      title: "Printing Stuff",
      content: [
        {
          kind: "text",
          value:
            "Computers wouldn't be of any use if they couldn't communicate with their users. The `print()` statement is used to display output to the user. It's one of the most basic and frequently used bits of code in Python.\n\nLet's start with the [classic](https://en.wikipedia.org/wiki/%22Hello,_World!%22_program) \"Hello, World!\" example. Run the code below by clicking the `Run Code` button. You will see how the program produces two outputs: one line for each value inside a print statement.",
        },
      ],
      example: {
        id: "hello-world1",
        title: "Hello, World",
        code: 'print("Hello, World!")\nprint("Can I call myself a programmer now?")',
      },
    } as ObservationSectionData,
    {
      kind: "MultipleSelection",
      id: "what-is-a-string",
      title: "What's a String?",
      content: [
        {
          kind: "text",
          value:
            'The first thing to appreciate about all programming languages is that they\'re primarily used to operate on data. Therefore, understanding the _type of data_ you\'re operating on is very important. The first **data type** we\'re going to cover are **strings**. Strings are lists of characters that can form words, sentences, and paragraphs. They are composed of letters, spaces, punctuation, and even numerical characters. Strings are most often denoted with a start `"` and an end `"`.\n\nIn the "Hello, World" example below, there are two strings. What are they?',
        },
      ],
      options: [
        "print",
        "Hello, World!",
        '"Hello, World!"',
        "Can I call myself a programmer now?",
        '"Can I call myself a programmer now?"',
        "It is a trap!",
      ],
      correctAnswers: [2, 4],
      feedback: {
        correct: "Correct! A string is surrounded with quotation marks.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "PRIMM",
      id: "double-quote-strings" as SectionId,
      title: "Quoting Someone",
      content: [
        {
          kind: "text",
          value:
            "Below is a Python program that attempts to print a famous quote. Unfortunately, there's a problem.\n\nFirst, predict what you think the code will do when you run it and then see if your prediction is correct. Finally, use the feedback from AI to correct/refine your mental model.",
        },
      ],
      example: {
        id: "primm-quote-issue",
        code: 'print("John Dewey said: "We learn from reflecting on experience.")',
        predictPrompt:
          "There's something wrong with the code above. What is the problem and what do you think will happen when you run the code?",
      },
      conclusion:
        "When you use double quotes to denote a string, you can't use double quotes **inside the string**",
    } as PRIMMSectionData,
    {
      kind: "Observation",
      id: "single-quote-strings" as SectionId,
      title: "Single Quote Strings",
      content: [
        {
          kind: "text",
          value:
            "Luckily, there's a way around this problem: single quotes! Single quotes (`'`) can be used whenever you have a string that has a double quote (`\"`) inside it.\n\nThe code below is almost exactly like the code in the example above, except it uses single quotes at the start and end of the string. This simple change prevents the computer from getting confused about where the string ends. Run the program to verify it works as expected.",
        },
      ],
      example: {
        id: "double-quote-strings",
        title: "Someone Once Said",
        code: "print('John Dewey said: \"We learn from reflecting on experience.\"')",
      },
    } as ObservationSectionData,
    {
      kind: "MultipleSelection",
      id: "what-is-a-string-again",
      title: "What's a String Again?",
      content: [
        {
          kind: "text",
          value:
            "Being able to identify valid strings is crucial. Select the **three** options below that are valid strings.",
        },
      ],
      options: [
        "print",
        '"print"',
        "\"Hello, World!'",
        "Hello, World",
        '"John Dewey said "hi"',
        "'bye!'",
        '"It\'s a trap"',
      ],
      correctAnswers: [1, 5, 6],
      feedback: {
        correct:
          "Correct! Strings start and stop with the same quotation character and don't have any other instance of that character between them.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Testing",
      id: "problem1-task-grammatical-greeting" as SectionId,
      title: "Challenge: Who Goes There?",
      content: [
        {
          kind: "text",
          value:
            "Now it's your turn to write some code of your own! Write a program that outputs the following two sentences, one after the other:\n\n1. `Who's out there?`\n2. `I heard Eric say \"me\".`",
        },
      ],
      example: {
        id: "strings-challenge-code",
        title: "Implement Your Solution",
        code: "print()\nprint()",
        testCases: [
          {
            input: null,
            expected: 'Who\'s out there?\nI heard Eric say "me".',
            description: "Test that program produces expected output",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Information",
      id: "strings-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Congratulations on completing your first lesson. In the process you should have learned how to create and use strings to output information to the user. In the next section we will learn about a new type of data and how to distinguish between them.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
