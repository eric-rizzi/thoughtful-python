import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Python Basics",
  guid: "3c1e0332-e7ec-4e6a-b0c6-f9c9890999c5",
  description:
    "Welcome to your first Python lesson! In this lesson, you'll learn the fundamentals of Python programming.",
  sections: [
    {
      kind: "Information",
      id: "python-history",
      title: "The History of Python",
      content:
        '`Python` was created by _Guido van Rossum_ and first released in 1991. Its clean syntax, which uses indentation rather than braces to define code blocks, makes it particularly accessible for beginners who can focus on learning programming concepts without getting distracted by complex syntax. Python has become popular for learning due to its readability. The language\'s philosophy of "there should be one—and preferably only one—obvious way to do it" creates a straightforward learning path that helps beginners develop good programming habits from the start.',
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "print-function",
      title: "The Print Function",
      content:
        "The `print()` function displays output to the console.\n\nIt's one of the most basic and frequently used functions in Python.",
      example: {
        id: "hello-world1",
        title: "Hello World",
        description: "Let's start with the classic 'Hello, World!' example:",
        code: 'print("Hello, World!")\nprint("Welcome to Python in the browser!")',
      },
    } as ObservationSectionData,
    {
      kind: "Observation",
      id: "comments",
      title: "Comments",
      content:
        "Comments help you document your code. Python ignores anything after a # symbol.",
      example: {
        id: "comments",
        title: "Using Comments",
        description:
          "Comments are used to explain code and make your programs more readable:",
        code: '# This is a comment\nprint("This code is executed") # This is an inline comment\n\n# The following line is not executed\n# print("This won\'t be printed")',
      },
    } as ObservationSectionData,
    {
      kind: "Observation",
      id: "basic-math",
      title: "Basic Math Operations",
      content:
        "Python can perform arithmetic operations like addition, subtraction, multiplication, and division.",
      example: {
        id: "math",
        title: "Math Operations",
        description: "Try these basic mathematical operations:",
        code: 'print("Addition:", 5 + 3)\nprint("Subtraction:", 10 - 4)\nprint("Multiplication:", 6 * 7)\nprint("Division:", 20 / 4)\nprint("Integer Division:", 20 // 3)\nprint("Remainder (Modulo):", 20 % 3)\nprint("Exponentiation:", 2 ** 3)',
      },
    } as ObservationSectionData,
    {
      kind: "Observation",
      id: "exercises",
      title: "Exercises",
      content: "Try solving these exercises to practice what you've learned.",
      example: {
        id: "exercise1",
        title: "Print your name",
        description: "Write a program that prints your name and a greeting.",
        code: '# Write your code here\n# Example: print("Hello, my name is Alex!")',
      },
    } as ObservationSectionData,
  ],
};

export default lessonData;
