import type {
  Lesson,
  MultipleChoiceSection,
  PRIMMSection,
  TestingSection,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Nested Conditionals",
  description:
    "Learn how to create multiple execution paths using nested `if`/`else` statements.",
  sections: [
    {
      kind: "Information",
      id: "cond3-intro",
      title: "Multiple Paths: Nested Conditionals",
      content:
        "Sometimes, you need more than just two options (`if`/`else`). You can place `if`/`else` statements *inside* other `if` or `else` blocks to create multiple decision points. This is called nesting.",
    },
    {
      kind: "PRIMM",
      id: "primm-nested-paths",
      title: "Predict, Run, Investigate: Nested Logic",
      introduction:
        "This code uses nested `if`/`else` statements. Predict the output if the input is 'c'.",
      examples: [
        {
          id: "primm-nested-example",
          code: '# Simulate input for prediction\nanswer = "c"\n\nif answer == "a":\n  print("Option a")\nelse:\n  # Inner conditional\n  if answer == "b":\n    print("Option b")\n  else:\n    print("Other") # This is inside the outer \'else\'\n\nprint("All done") # This runs regardless',
          predictPrompt:
            'What lines will be printed when this code runs with `answer = "c"`?',
          expectedPrediction: "Other\nAll done",
          predictionTargetDescription:
            "The full output, including the final line",
          explanationPrompt:
            "Your prediction didn't match. Trace the code execution: Since `answer` is not 'a', which block runs? Inside that block, is `answer` equal to 'b'? Which `print` statement is finally reached before 'All done'?",
          minExplanationLength: 50,
        },
      ],
      conclusion:
        "When `answer` is 'c', the outer `if` is false, so the outer `else` block executes. Inside that, the inner `if answer == \"b\"` is also false, so its `else` block runs, printing 'Other'. Finally, the 'All done' print statement outside all conditionals always runs.",
    } as PRIMMSection,
    {
      kind: "MultipleChoice",
      id: "cond3-q-paths",
      title: "Execution Paths",
      content:
        "Excluding the final `print(\"All done\")`, how many distinct paths can lead to a different message being printed (e.g., 'Option a', 'Option b', 'Other') based on the user's input in the nested example?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! There are three distinct outcomes based on the conditions: one for 'a', one for 'b', and one for any other input.",
        incorrect:
          "Consider the possible inputs 'a', 'b', and anything else (like 'c'). Each leads to a different specific message being printed within the conditional structure.",
      },
    } as MultipleChoiceSection,
    {
      kind: "MultipleChoice",
      id: "cond3-q-indent",
      title: "Role of Indentation",
      content:
        'Why is the second `if` statement (`if answer == "b":`) indented in the example code?',
      options: [
        "For visual style only.",
        "To indicate it is part of the *outer* `else` block and only runs if the first `if` condition is false.",
        "All `if` statements after the first one must be indented.",
        'To separate it from the final `print("All done")` statement.',
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          'Correct! Indentation is crucial in Python. Indenting the second `if`/`else` structure signifies that it is executed *only* when the first condition (`answer == "a"`) is false.',
        incorrect:
          "Indentation defines code blocks in Python. Think about which block the second `if` belongs to. Does it always run, or only under certain conditions established by the outer `if`/`else`?",
      },
    } as MultipleChoiceSection,
    {
      kind: "Testing",
      id: "cond3-task-stoplight",
      title: "Challenge: The Stoplight",
      content:
        "Modify the nested conditional structure to simulate a stoplight. Ask the user for the color they see (`green`, `yellow`, or `red`) and print the appropriate action (`Go!`, `Slow down!`, or `STOP!`). Handle other inputs by printing `Invalid color.`.",
      example: {
        id: "cond3-challenge-code",
        title: "Implement Your Solution",
        description:
          "Use nested `if`/`else` (or introduce `elif`) to handle the three colors and an invalid input.",
        code: '# Get color input (assume lowercase for simplicity, or use .lower())\ncolor = input("What color is the light? (green/yellow/red) ").lower()\n\n# Use nested if/else (or elif) to print the correct action\n# Example structure to adapt:\nif color == "green":\n  print("Go!")\nelse:\n  # Add nested check for yellow/red here\n  if color == "yellow":\n     print("Slow down!")\n  else:\n     # Is it red? Or invalid?\n     if color == "red":\n         print("STOP!")\n     else:\n         print("Invalid color.")\n\n',
        testCases: [
          {
            input: "green",
            expected: "Go!",
            description: "Input 'green'",
          },
          {
            input: "GREEN",
            expected: "Go!",
            description: "Input 'GREEN' (should handle case)",
          },
          {
            input: "yellow",
            expected: "Slow down!",
            description: "Input 'yellow'",
          },
          {
            input: "red",
            expected: "STOP!",
            description: "Input 'red'",
          },
          {
            input: "blue",
            expected: "Invalid color.",
            description: "Input 'blue'",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSection,
    {
      kind: "Information",
      id: "cond3-elif-intro",
      title: "Alternative: Using `elif`",
      content:
        'While nested `if`/`else` works, Python provides the `elif` (else if) keyword for cleaner handling of multiple exclusive conditions:\n\n```python\ncolor = input("Color? ").lower()\n\nif color == "green":\n  print("Go!")\nelif color == "yellow":\n  print("Slow down!")\nelif color == "red":\n  print("STOP!")\nelse:\n  print("Invalid color.")\n```\nThis `elif` structure is often more readable than deep nesting for checking a sequence of conditions.',
    },
  ],
};

export default lessonData;
