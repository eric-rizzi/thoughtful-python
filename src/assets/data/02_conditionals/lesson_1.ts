import type {
  Lesson,
  MultipleChoiceSection,
  PRIMMSection,
  TestingSection,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Basic Conditionals (`if`/`else`)",
  description:
    "Explore `if`/`else` statements, comparison operators, and string methods like `.lower()` through a password checking example.",
  sections: [
    {
      kind: "Information",
      id: "cond1-intro",
      title: "Making Decisions in Code",
      content:
        "Often, <h1>we</h1> want our programs to do different things based on certain conditions. Python uses `if` and `else` statements to control this flow. Let's look at a simple password checker.",
    },
    {
      kind: "PRIMM",
      id: "primm-password-check",
      title: "Predict, Run, Investigate: Password Logic",
      introduction:
        "This code asks for a password and checks if it matches 'cheese' (case-insensitive). Predict the output for the input 'CHEESE'.",
      examples: [
        {
          id: "primm-pass-example",
          code: '# Simulate input for prediction\npassword = "CHEESE"\n\n# Conditional Check\nif password.lower() == "cheese":\n  print("Welcome, it\'s lovely to see you") # Output A\nelse:\n  print("Get out of here!") # Output B',
          predictPrompt:
            "What will be printed to the screen when this code runs?",
          expectedPrediction: "Welcome, it's lovely to see you",
          predictionTargetDescription: "The final printed message",
          explanationPrompt:
            "Your prediction didn't match. Why did the `if` condition evaluate to `True`? Consider what `password.lower()` does and how `==` works.",
          minExplanationLength: 40,
        },
      ],
      conclusion:
        "The `.lower()` method converts the input to lowercase before comparison. This means 'CHEESE', 'cheese', and 'cHeEsE' all become 'cheese', matching the condition and printing the welcome message. This makes the check case-insensitive.",
    } as PRIMMSection,
    {
      kind: "MultipleChoice",
      id: "cond1-q-datatype",
      title: "Password Variable Type",
      content:
        "In the original code `password = input(...)`, what is the data type of the `password` variable?",
      options: ["String", "Integer", "Boolean", "Depends on input"],
      correctAnswer: 0,
      feedback: {
        correct: "Correct! `input()` always returns a string.",
        incorrect:
          "Remember that `input()` always returns a string, even if the user types numbers or other characters.",
      },
    } as MultipleChoiceSection,
    {
      kind: "MultipleChoice",
      id: "cond1-q-operators",
      title: "Assignment vs. Comparison",
      content:
        "What is the fundamental difference between the single equals sign (`=`) in `password = input(...)` and the double equals sign (`==`) in `if password.lower() == 'cheese':`?",
      options: [
        "`=` compares values, `==` assigns values.",
        "`=` assigns a value to a variable, `==` compares two values for equality.",
        "`==` is used for strings, `=` is used for numbers.",
        "There is no functional difference, only stylistic.",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! `=` is the assignment operator, used to store a value in a variable. `==` is the equality comparison operator, used to check if two values are the same.",
        incorrect:
          "Think about the purpose of each line. The first line stores the input *into* the variable. The second line *checks if* the (modified) input is the same as 'cheese'.",
      },
    } as MultipleChoiceSection,
    {
      kind: "MultipleChoice",
      id: "cond1-q-lower-restrict",
      title: "Impact of `.lower()`",
      content:
        "Does using `.lower()` in the password check make the condition *more* restrictive (allowing fewer inputs to pass) or *less* restrictive (allowing more inputs to pass)?",
      options: [
        "More restrictive (only lowercase 'cheese' works).",
        "Less restrictive (allows 'cheese', 'CHEESE', 'Cheese', etc.).",
        "It has no effect on restrictiveness.",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! By converting the input to lowercase before comparing, it allows various capitalizations of 'cheese' to be accepted, making it less restrictive than an exact match.",
        incorrect:
          "Consider the inputs 'cheese', 'CHEESE', and 'Cheese'. Without `.lower()`, only one would match `'cheese'`. With `.lower()`, all three are converted to 'cheese' before the comparison.",
      },
    } as MultipleChoiceSection,
    {
      kind: "Testing",
      id: "cond1-task-modify",
      title: "Challenge: Modifying the Password Checker",
      content:
        "Modify the password checker program to meet two new requirements:\n1. It should **only** welcome the user if they input the exact, all-uppercase password `CHEESE`.\n2. Instead of printing `Get out of here!`, it should politely print `I’m sorry, [entered_password] is not the password.`, replacing `[entered_password]` with the actual incorrect password the user typed.",
      example: {
        id: "cond1-challenge-code",
        title: "Implement Your Solution",
        description:
          "Modify the code below. \n- Input `CHEESE` should print `Welcome, it's lovely to see you`\n- Input `cheese` should print `I’m sorry, cheese is not the password.`\n- Input `Salami` should print `I’m sorry, Salami is not the password.`",
        code: '# Get password input\npassword = input("What is the password? ")\n\n# Modify the if/else structure below\n# Hint: You might not need .lower() anymore for requirement 1.\n# Hint: You\'ll need the original \'password\' variable for requirement 2.\n\nif password.lower() == "cheese": # FIX THIS CONDITION\n  print("Welcome, it\'s lovely to see you")\nelse:\n  print("Get out of here!") # FIX THIS MESSAGE\n',
        testCases: [
          {
            input: "CHEESE",
            expected: "Welcome, it's lovely to see you",
            description: "Correct uppercase password",
          },
          {
            input: "cheese",
            expected: "I’m sorry, cheese is not the password.",
            description: "Incorrect lowercase password",
          },
          {
            input: "Cheese",
            expected: "I’m sorry, Cheese is not the password.",
            description: "Incorrect mixed-case password",
          },
          {
            input: "Salami",
            expected: "I’m sorry, Salami is not the password.",
            description: "Incorrect different password",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSection,
  ],
};

export default lessonData;
