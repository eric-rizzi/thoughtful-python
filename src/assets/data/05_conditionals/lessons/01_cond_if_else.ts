import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  PRIMMSectionData,
  MultipleChoiceSectionData,
  TestingSectionData,
  DebuggerSectionData,
  MatchingSectionData,
  ReflectionSectionData,
  PredictionSectionData,
  CoverageSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Two Paths: If/Else",
  guid: "c9f3d821-7b42-4e89-a634-1d8e5f9c2b47" as LessonId,
  description:
    "Learn how to create functions that choose between two different actions using if/else statements.",
  sections: [
    {
      kind: "Information",
      id: "else-intro",
      title: "One or the Other",
      content: [
        {
          kind: "text",
          value:
            "In the last lesson, your if statements decided whether to run extra code. But often, you want to do one thing OR another - not just something or nothing.\n\nThink about a password checker. Instead of just saying 'Welcome!' when the password is correct and nothing when it's wrong, you probably want to say 'Welcome!' OR 'Access denied!' That's exactly what `else` does.\n\nWith if/else, your function ALWAYS does exactly one of two things. It creates two paths through your code, and every input must take exactly one path.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "first-else" as SectionId,
      title: "Two Different Messages",
      content: [
        {
          kind: "text",
          value:
            "Here's our password checker from the worksheet. Notice how it ALWAYS prints one of two messages - never both, never neither:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_password(attempt):\n    if attempt.lower() == "cheese":\n        print("Welcome, it\'s lovely to see you")\n    else:\n        print("Get out of here!")\n\ncheck_password("cheese")\ncheck_password("CHEESE")\ncheck_password("crackers")\ncheck_password("pizza")',
      },
    } as ObservationSectionData,
    {
      kind: "Prediction",
      id: "password-prediction" as SectionId,
      title: "Predict the Password Output",
      content: [
        {
          kind: "text",
          value:
            "Look at this password checker function. For each password attempt below, predict what message will be printed:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def secure_check(password):\n    if password.lower() == "secret":\n        print("Access granted!")\n    else:\n        print("Access denied!")',
      },
      predictionTable: {
        functionToTest: "secure_check",
        columns: [{ variableName: "password", variableType: "string" }],
        rows: [
          { inputs: ["secret"] },
          { inputs: ["SECRET"] },
          { inputs: ["Secret"] },
          { inputs: ["password"] },
          { inputs: ["SeCrEt"] },
        ],
      },
    } as PredictionSectionData,
    {
      kind: "MultipleChoice",
      id: "else-behavior",
      title: "Understanding Else",
      content: [
        {
          kind: "text",
          value:
            "In an if/else statement, when does the code in the else block run?",
        },
      ],
      options: [
        "Always, no matter what",
        "Never - it's just for show",
        "Only when the if condition is False",
        "At the same time as the if block",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! The else block runs when (and only when) the if condition is False. You get exactly one or the other - never both!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Coverage",
      id: "age-coverage" as SectionId,
      title: "Make It Print That!",
      content: [
        {
          kind: "text",
          value:
            "This function categorizes ages. Provide ages that will produce each output shown:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def categorize_age(age):\n    if age < 18:\n        print("You\'re a minor")\n    else:\n        print("You\'re an adult")',
      },
      coverageTable: {
        functionToTest: "categorize_age",
        columns: [
          {
            variableName: "age",
            variableType: "number",
          },
        ],
        rows: [
          {
            expectedOutput: "You're a minor",
            hint: "What age is less than 18?",
          },
          {
            expectedOutput: "You're an adult",
            hint: "What age is 18 or more?",
          },
          {
            expectedOutput: "You're an adult",
            hint: "What about exactly 18?",
          },
          {
            expectedOutput: "You're a minor",
            hint: "Try age 0 - does it work?",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "Testing",
      id: "polite-password" as SectionId,
      title: "Challenge: Polite Password Checker",
      content: [
        {
          kind: "text",
          value:
            "From the worksheet: Modify the password checker to give a personalized rejection message.\n\nCreate `polite_password_check(attempt)` that:\n1. If the attempt equals 'cheese' (case-insensitive), prints 'Welcome, it's lovely to see you'\n2. Otherwise, prints 'I'm sorry, [attempt] is not the password'\n\nFor example, if someone enters 'crackers', it should say 'I'm sorry, crackers is not the password'",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def polite_password_check(attempt):\n    # Check if password is correct (use .lower())\n    # If correct: welcome message\n    # If wrong: polite rejection with their attempt\n    pass\n\n# Test your function\npolite_password_check("cheese")\npolite_password_check("CHEESE")\npolite_password_check("crackers")\npolite_password_check("pizza")',
      },
      testCases: [
        {
          input: ["cheese"],
          expected: "Welcome, it's lovely to see you",
          description: "Test with correct password 'cheese'",
        },
        {
          input: ["CHEESE"],
          expected: "Welcome, it's lovely to see you",
          description: "Test with uppercase 'CHEESE'",
        },
        {
          input: ["crackers"],
          expected: "I'm sorry, crackers is not the password",
          description: "Test with wrong password 'crackers'",
        },
      ],
      functionToTest: "polite_password_check",
    } as TestingSectionData,
    {
      kind: "DebuggerSectionData",
      id: "fix-student-errors" as SectionId,
      title: "Fix the Errors",
      content: [
        {
          kind: "text",
          value:
            "This is directly from your worksheet! There are two errors in this student checker. Step through the code to see the errors, then fix them:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_student(answer):\n    if answer.lower() = "yes":  # Error 1: using = instead of ==\n        print("Good luck on your tests!")\n        else:  # Error 2: wrong indentation\n        print("Pay your rent!")\n\n# This will cause an error!\ncheck_student("yes")',
      },
    } as DebuggerSectionData,
    {
      kind: "PRIMM",
      id: "volume-check-primm" as SectionId,
      title: "Checking Volume",
      content: [
        {
          kind: "text",
          value:
            "From the worksheet: This function checks if someone is SHOUTING by seeing if their text is all uppercase:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_volume(word):\n    if word.upper() == word:\n        print("OK ALREADY!")\n    else:\n        print("At least you were polite.")\n\ncheck_volume("HELLO")\ncheck_volume("hello")\ncheck_volume("Hello")\ncheck_volume("STOP")',
      },
      predictPrompt:
        "The condition `word.upper() == word` checks if the word is already all uppercase. Predict what each function call will print.",
      conclusion:
        "The check `word.upper() == word` is True only when the word is already all capitals. 'HELLO' uppercased is still 'HELLO', so they're equal. But 'Hello' uppercased becomes 'HELLO', which is different from 'Hello'!",
    } as PRIMMSectionData,
    {
      kind: "Prediction",
      id: "grade-prediction" as SectionId,
      title: "Pass or Fail Predictions",
      content: [
        {
          kind: "text",
          value:
            "This function determines if a student passes or fails. Predict the output for each score:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_pass(score):\n    if score >= 60:\n        print("You passed!")\n    else:\n        print("You need to retake")',
      },
      predictionTable: {
        functionToTest: "check_pass",
        columns: [{ variableName: "score", variableType: "number" }],
        rows: [
          { inputs: [59] },
          { inputs: [60] },
          { inputs: [61] },
          { inputs: [0] },
          { inputs: [100] },
          { inputs: [59.9] },
        ],
      },
    } as PredictionSectionData,
    {
      kind: "Coverage",
      id: "temperature-coverage" as SectionId,
      title: "Temperature Boundaries",
      content: [
        {
          kind: "text",
          value: "Provide temperatures that will produce each weather message:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def weather_report(temp):\n    if temp > 25:\n        print("It\'s warm outside!")\n    else:\n        print("It\'s cool today")',
      },
      coverageTable: {
        functionToTest: "weather_report",
        columns: [
          {
            variableName: "temp",
            variableType: "number",
          },
        ],
        rows: [
          {
            expectedOutput: "It's warm outside!",
            hint: "Temperature must be greater than 25",
          },
          {
            expectedOutput: "It's cool today",
            hint: "Temperature must be 25 or less",
          },
          {
            expectedOutput: "It's cool today",
            hint: "What about exactly 25?",
          },
          {
            expectedOutput: "It's warm outside!",
            hint: "Try 25.1 - does it work?",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "Matching",
      id: "if-else-pairs" as SectionId,
      title: "If/Else Partnerships",
      content: [
        {
          kind: "text",
          value: "Match each if condition with what its else block handles:",
        },
      ],
      prompts: [
        { "if age >= 18:": "else handles anyone under 18" },
        { "if name == 'Alice':": "else handles any name that isn't Alice" },
        { "if score > 90:": "else handles scores 90 and below" },
        {
          "if password.lower() == 'secret':":
            "else handles any password that isn't 'secret' (case-insensitive)",
        },
        { "if temp < 0:": "else handles temperatures 0 and above" },
      ],
      feedback: {
        correct:
          "Perfect! The else always handles everything the if condition doesn't catch. Together, they cover ALL possibilities.",
      },
    } as MatchingSectionData,
    {
      kind: "Testing",
      id: "vowel-checker" as SectionId,
      title: "Challenge: Vowel Checker",
      content: [
        {
          kind: "text",
          value:
            "Create a function `check_first_letter(word)` that:\n1. Prints 'Checking: [word]'\n2. If the first letter is a vowel (a, e, i, o, u), prints 'Starts with a vowel!'\n3. Otherwise, prints 'Starts with a consonant!'\n4. Always prints 'Check complete'\n\nHint: Use word[0] to get the first letter, and use .lower() to handle uppercase!\nHint: You can check if a letter is in a string with: `letter in 'aeiou'`",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_first_letter(word):\n    # Print what we\'re checking\n    \n    # Get first letter and check if it\'s a vowel\n    # Remember to use .lower() for case-insensitive check!\n    \n    # Always print completion message\n    pass\n\n# Test your function\ncheck_first_letter("apple")\nprint("---")\ncheck_first_letter("Elephant")\nprint("---")\ncheck_first_letter("python")\nprint("---")\ncheck_first_letter("ISLAND")',
      },
      testCases: [
        {
          input: ["apple"],
          expected: "Checking: apple\nStarts with a vowel!\nCheck complete",
          description: "Test with 'apple'",
        },
        {
          input: ["python"],
          expected:
            "Checking: python\nStarts with a consonant!\nCheck complete",
          description: "Test with 'python'",
        },
        {
          input: ["Elephant"],
          expected: "Checking: Elephant\nStarts with a vowel!\nCheck complete",
          description: "Test with 'Elephant' (uppercase E)",
        },
      ],
      functionToTest: "check_first_letter",
    } as TestingSectionData,
    {
      kind: "Prediction",
      id: "time-greeting-prediction" as SectionId,
      title: "Time-Based Greetings",
      content: [
        {
          kind: "text",
          value:
            "This function greets based on the hour (24-hour format). Predict each greeting:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def greet_by_time(hour, name):\n    if hour < 12:\n        print(f"Good morning, {name}!")\n    else:\n        print(f"Good afternoon, {name}!")',
      },
      predictionTable: {
        functionToTest: "greet_by_time",
        columns: [
          { variableName: "hour", variableType: "number" },
          { variableName: "name", variableType: "string" },
        ],
        rows: [
          { inputs: [11, "Alice"] },
          { inputs: [12, "Bob"] },
          { inputs: [0, "Charlie"] },
          { inputs: [23, "Diana"] },
          { inputs: [11.99, "Eve"] },
        ],
      },
    } as PredictionSectionData,
    {
      kind: "Coverage",
      id: "even-odd-coverage" as SectionId,
      title: "Even or Odd Numbers",
      content: [
        {
          kind: "text",
          value:
            "Don't worry about how % works - just provide numbers that give each output. Hint: Even numbers are 0, 2, 4, 6, 8... and odd numbers are 1, 3, 5, 7, 9...",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_even_odd(number):\n    if number % 2 == 0:\n        print(f"{number} is even")\n    else:\n        print(f"{number} is odd")',
      },
      coverageTable: {
        functionToTest: "check_even_odd",
        columns: [
          {
            variableName: "number",
            variableType: "number",
          },
        ],
        rows: [
          {
            expectedOutput: "4 is even",
            hint: "Use the number 4",
          },
          {
            expectedOutput: "7 is odd",
            hint: "Use the number 7",
          },
          {
            expectedOutput: "0 is even",
            hint: "What about zero?",
          },
          {
            expectedOutput: "101 is odd",
            hint: "Use the number 101",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "Reflection",
      id: "if-else-reflection" as SectionId,
      title: "If/Else Reflection",
      content: [
        {
          kind: "text",
          value:
            "If/else statements create exactly two paths through your function. Every input must take exactly one path - never both, never neither. This guarantees complete coverage of all possibilities.\n\nCreate a simple function with an if/else statement and explain how it ensures every input gets exactly one response. Remember to use the phrase 'as seen in the example above'.",
        },
      ],
      topic: "How If/Else Guarantees One Path",
      isTopicPredefined: true,
      code: "Create a function with if/else that handles all inputs",
      isCodePredefined: false,
      explanation:
        "Explain how your if/else ensures exactly one path is taken (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "else-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Excellent work! You've mastered the if/else statement. You learned:\n- `else` creates a second path that runs when the `if` condition is False\n- Every input takes exactly ONE path - never both, never neither\n- The if and else must line up (same indentation level)\n- The code inside each block must be indented\n- How to predict outputs and provide inputs for specific outputs\n\nYou've also debugged indentation errors and learned why Python is so picky about spacing - it's how Python understands which code belongs together!\n\nBut what if you have more than two options? What about grades (A, B, C, D, F) or sizes (small, medium, large, extra-large)? That's what we'll tackle next with elif statements!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
