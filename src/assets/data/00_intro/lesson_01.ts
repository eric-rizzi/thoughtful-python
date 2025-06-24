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
      content:
        'Python was first released in 1991. It has become a very popular language because of its clean syntax and the way that well-written Python programs almost read like English prose. Learning Python is great for formalizing your understanding of difficult topics and sharing your ideas with others. In this section, you\'ll learn about how to print out "strings of characters" to the screen: a necessary part of building useful programs.',
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "print-function" as SectionId,
      title: "The Print Function",
      content:
        "Computers wouldn't be of any use if they couldn't communicate with their users. The `print()` function displays output to the console. It's one of the most basic and frequently used functions in Python.\n\nLet's start with the classic \"Hello, World!\" example. Run the code by clicking the `Run Code` button. You will see how the code produces two outputs: the two values inside the print statements.",
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
      content:
        'The first thing to appreciate about all programming languages is that they\'re primarily used to operate on data. Therefore, understanding the _type of data_ you\'re operating on is very important. The first **data type** to know is **strings**. Strings are lists of characters that can form words, sentences, and paragraphs. They are composed of letters, spaces, and even numerical characters. Strings are most often denoted with a start `"` and an end `"`.\n\nIn the "Hello, World" example above, there are two strings. Which are they?',
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
        correct:
          "Correct! To denote a string you have to surround it with some sort of quotation mark.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "PRIMM",
      id: "double-quote-strings" as SectionId,
      title: "Quoting Someone",
      content:
        "Below is Python code that attempts to print a quotation. Unfortunately, there's a problem.\n\nFirst, predict what you think the code will do when run and then see if your prediction is correct. Finally, use the feedback from AI to refine/correct your mental model.",
      examples: [
        {
          id: "primm-quote-issue",
          code: 'print("John Dewey said: "We learn from reflecting on experience.")',
          predictPrompt:
            "There's something wrong with the code above. What is the problem and what do you think will happen when you run the code?",
        },
      ],
      conclusion:
        "When you use double quotes to define a string, you can't use double quotes **inside the string**",
    } as PRIMMSectionData,
    {
      kind: "Observation",
      id: "single-quote-strings" as SectionId,
      title: "Single Quote Strings",
      content:
        "Luckily, there's a way around this problem: single quotes! Single quotes (`'`) can be used whenever you have a string that has a double quote (`\"`) inside it.\n\nThe code below is almost exactly like the code in the example above, except it uses single quotes at the start and end of the string. This simple change prevents the computer from getting confused about where the string ends. Run the program to verify it works as expected.",
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
      content: "Select the **three** options below that are valid strings.",
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
      title: "Challenge: Perfecting the Greeting",
      content:
        "Now it's your turn to write some code of your own! Write a program that outputs the following two sentences, one after the other:\n\n1. `Who's candy is that?`\n2. `I heard Eric call \"dibs\".`",
      example: {
        id: "strings-challenge-code",
        title: "Implement Your Solution",
        code: "print()\nprint()",
        testCases: [
          {
            input: null,
            expected: 'Who\'s candy is that?\nI heard Eric call "dibs".',
            description: "Test that program produces expected output",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
  ],
};

export default lessonData;
