import type {
  Lesson,
  MultipleChoiceSectionData,
  PRIMMSectionData,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "String Formatting and f-strings",
  guid: "03cff8d8-33a0-49ed-98c4-d51613995340",
  description:
    "Predict output, run code, and investigate f-strings for variable insertion and handling quotes.",
  sections: [
    {
      kind: "Information",
      id: "lesson9-intro",
      title: "Introduction: Formatting Strings",
      content:
        "Printing messages that include variable values is common. Python's f-strings provide a powerful way to do this. In this section, you'll predict the output of specific lines before running the code to see if you're correct.",
    },
    {
      kind: "PRIMM",
      id: "primm-print-analysis",
      title: "Predict, Run, Investigate: Print Statements",
      content:
        "Below is Python code that attempts to print greetings using different methods. Focus on the code, predict the output for the specified line, then run it to check.",
      examples: [
        {
          id: "primm-greetings-line3",
          code: '# We\'ll use a fixed name for prediction\nname = "Alex"\n\nprint(f"Hello {name}it\'s nice to meet you!") # Line 1\nprint("Hello {name} it\'s nice to meet you!") # Line 2\nprint(f"Hello {name} it\'s nice to meet you!") # Line 3\nprint(f"Hello name it\'s nice to meet you!") # Line 4',
          predictPrompt:
            'Look closely at Line 3 (`print(f"Hello {name} it\'s nice to meet you!")`). What exact text will this line output?',
        },
      ],
      conclusion:
        "Running the code reveals how different print statements behave. Only the f-string with `{name}` correctly substituted the variable. The other lines either missed the `f`, lacked braces, or had spacing issues. Understanding f-strings is key for clean output!",
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "problem1-q1-datatype",
      title: "Data Type Check",
      content:
        'When using `name = input("What is your name? ")`, what data type does the `input()` function *always* return for the `name` variable?',
      options: ["Integer", "Float", "String", "Boolean"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! The `input()` function always returns a string, even if the user types numbers.",
        incorrect:
          "Remember that the `input()` function in Python always captures user input as a string.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "problem1-q3-quotes",
      title: "Why Double Quotes?",
      content:
        'In the code `print(f"Hello {name} it\'s nice to meet you!")`, why is using double quotes (`"`) useful for defining the f-string?',
      options: [
        "Python requires double quotes for f-strings.",
        "It allows the single quote (apostrophe) in `it's` to be included without causing a syntax error.",
        "Double quotes make the f-string process faster.",
        "Variables can only be inserted into double-quoted strings.",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Using double quotes for the string allows single quotes (apostrophes) to be included within the string without prematurely ending it.",
        incorrect:
          "Consider what happens if you try to define a string like `'it's'` using only single quotes. Python allows both, but choosing the outer quote type wisely helps manage quotes inside the string.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "problem1-task-grammatical-greeting",
      title: "Challenge: Perfecting the Greeting",
      content:
        "Grammatically, there should be a comma after saying 'Hello' to the person (e.g., 'Hello Alex, it’s nice to meet you!'). Your task is to write a single `print` statement using an f-string that greets the user (whose name is stored in the `name` variable) in this grammatically correct way.",
      example: {
        id: "p1-challenge-code",
        title: "Implement Your Solution",
        description:
          "Complete the code below. If the variable `name` holds 'Alex', the output should be exactly: `Hello Alex, it's nice to meet you!`",
        code: '# Assume \'name\' variable holds the user\'s input\nname = "Alex" # Example value for testing\n\n# Write the corrected f-string print statement below:\nprint(f"Your solution here...")\n',
        testCases: [
          {
            input: null,
            expected: "Hello Alex, it's nice to meet you!",
            description: "Test with name Alex (assuming name='Alex')",
          },
          {
            input: null,
            expected: "Hello Sam, it's nice to meet you!",
            description: "Test with name Sam (assuming name='Sam')",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
  ],
};

export default lessonData;
