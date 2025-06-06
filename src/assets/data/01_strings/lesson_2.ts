import type {
  Lesson,
  MultipleChoiceSectionData,
  PRIMMSectionData,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Type Casting and Input",
  guid: "a9e039a5-d551-4068-b797-553ef721bac9",
  description:
    "Predict errors, understand type mismatches with input, and learn to fix them using type casting.",
  sections: [
    {
      kind: "Information",
      id: "lesson10-intro",
      title: "Dealing with Input Data Types",
      content:
        "Python's `input()` function always gives us a string. What happens if we try to do math with that string? Let's predict the outcome before running!",
    },
    {
      kind: "PRIMM",
      id: "primm-type-error",
      title: "Predict, Run, Investigate: The `TypeError`",
      content:
        "This code asks for the user's age (as a string) and tries to calculate their age next year. Predict what will happen, then run it.",
      examples: [
        {
          id: "primm-age-calc",
          code: '# Simulate input() returning a string\nage = "25" \n\n# Attempt arithmetic operation\nnext_age_calculation = age + 1 \n\n# This print statement will likely not be reached\nprint(f"Next year\'s age calculation: {next_age_calculation}")',
          predictPrompt:
            "What will be the result of executing this code? Will it print successfully, or will it produce an error?",
        },
      ],
      conclusion:
        "Did you predict an error? Running the code confirms a `TypeError` occurs because you cannot directly add a string ('25') and an integer (1). You must convert the string to a number first using type casting.",
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "problem2-q1-age-datatype",
      title: "Input Data Type",
      content:
        'Just to confirm, what data type does `age = input("What is your age? ")` assign to the `age` variable?',
      options: ["Integer", "String", "Float", "Depends on user input"],
      correctAnswer: 1,
      feedback: {
        correct: "Correct! `input()` always returns a string.",
        incorrect:
          "Remember, the `input()` function *always* returns data as a string, regardless of what the user types.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "problem2-type-casting",
      title: "Solution: Type Casting with `int()`",
      content:
        'To fix the `TypeError`, we need to convert the string obtained from `input()` into an integer *before* performing addition. We can do this using the `int()` function:\n\n```python\nage_string = input("What is your age? ")\nage_number = int(age_string) # Convert the string to an integer\nnext_age = age_number + 1\nprint(f"I think {age_number} is a good age, but so is {next_age}")\n```\nThis process of changing a variable from one type to another is called **type casting**.',
    },
    {
      kind: "Testing",
      id: "problem2-task-fix-error",
      title: "Challenge: Fixing the `TypeError`",
      content:
        "Now, apply the concept of type casting. Modify the original problematic code snippet so that it correctly converts the user's input to an integer and prints the age and the age next year without errors.",
      example: {
        id: "p2-challenge-code",
        title: "Implement Your Solution",
        description:
          "Modify the code below. Get the age using input, convert it to an integer, and then use the integer value in the print statement.",
        code: '# Get age as a string\nage_str = input("What is your age? ")\n\n# Convert age_str to an integer (replace the comment)\n# age_int = ... ?\n\n# Use the integer version in the print statement (replace ???)\nprint(f"I think ??? is a good age, but so is {??? + 1}")',
        testCases: [
          {
            input: "25",
            expected: "I think 25 is a good age, but so is 26",
            description: "Test with age 25",
          },
          {
            input: "10",
            expected: "I think 10 is a good age, but so is 11",
            description: "Test with age 10",
          },
          {
            input: "0",
            expected: "I think 0 is a good age, but so is 1",
            description: "Test with age 0",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
  ],
};

export default lessonData;
