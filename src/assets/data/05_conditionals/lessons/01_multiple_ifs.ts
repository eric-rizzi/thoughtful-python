import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  PRIMMSectionData,
  MultipleSelectionSectionData,
  MatchingSectionData,
  TestingSectionData,
  DebuggerSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Multiple If Statements",
  guid: "e6f8g0h2-7a9b-4c5d-9e1f-5g6h7i8j9k0l" as LessonId,
  description:
    "Learn how to use multiple if statements in one function to check several conditions independently.",
  sections: [
    {
      kind: "Information",
      id: "multiple-ifs-intro",
      title: "Building on If Statements",
      content: [
        {
          kind: "text",
          value:
            "In the last lesson, you learned how to use a single `if` statement to add different paths through your functions. When a condition was True, the indented code ran. When it was False, Python skipped it.\n\nBut what if you need to check multiple things? For example, what if you're creating a function that checks whether someone is old enough to vote AND old enough to drive? That's where multiple if statements come in. In this lesson, you'll learn how to use several if statements in a single function to produce more complex and interesting programs.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "two-ifs" as SectionId,
      title: "Two If Statements",
      content: [
        {
          kind: "text",
          value:
            "Let's start simple. Below is a function that checks whether someone is old enough for two different activities: driving (requires age 16 or higher) and voting (requires age 18 or higher).\n\nRun the code and pay attention to how different inputs result in different messages appearing.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_age(age):\n    print(f"Checking privileges for age {age}")\n\n    if age >= 16:\n        print("You can drive!")\n\n    if age >= 18:\n        print("You can vote!")\n\n    print("Check complete")\n\ncheck_age(15)\nprint("---")\ncheck_age(17)\nprint("---")\ncheck_age(19)',
      },
    } as ObservationSectionData,
    {
      kind: "PRIMM",
      id: "multiple-conditions-primm" as SectionId,
      title: "Multiple Independent Checks",
      content: [
        {
          kind: "text",
          value:
            "Below is a function that analyzes a word using three different `if` statements. Each `if` statement checks something different about the word. Predict what messages will appear for each word:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def analyze_word(word):\n    print(f"Analyzing: {word}")\n    \n    if len(word) > 5:\n        print("That\'s a long word!")\n    \n    if word.upper() == word:\n        print("WHY ARE YOU SHOUTING?")\n    \n    if word == "Python":\n        print("Great programming language!")\n    \n    print("Analysis complete")\n\nanalyze_word("HELLO")\nprint("---")\nanalyze_word("Python")\nprint("---")\nanalyze_word("WOW")',
      },
      predictPrompt:
        "Each if statement is checked separately. For each word, predict which messages will appear. Remember: len() gives the length, .upper() converts to uppercase.",
      conclusion:
        "Each if statement runs independently! A word can trigger none, one, some, or all of the if statements depending on its properties. Python checks every single if statement, regardless of whether previous ones were True or False.",
    } as PRIMMSectionData,
    {
      kind: "Debugger",
      id: "trace-multiple-paths" as SectionId,
      title: "Tracing Multiple If Statements",
      content: [
        {
          kind: "text",
          value:
            "Let's watch the computer execute a function with multiple if statements. Step through the code slowly and watch which if blocks get executed and which get skipped.\n\nThe most important thing to notice: Python checks EVERY if statement, regardless of whether previous ones were True or False. It doesn't stop after finding one True condition.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_number(num):\n    print(f"Checking {num}")\n    \n    if num > 50:\n        print("Greater than 50")\n    \n    if num > 25:\n        print("Greater than 25")\n    \n    if num > 10:\n        print("Greater than 10")\n    \n    print("All checks complete")\n\ncheck_number(60)\nprint("---")\ncheck_number(30)\nprint("---")\ncheck_number(5)',
      },
    } as DebuggerSectionData,
    {
      kind: "MultipleSelection",
      id: "which-ifs-trigger",
      title: "Which Conditions Trigger?",
      content: [
        {
          kind: "text",
          value:
            "Look at this function. Which `print()` statements will run when you call `check_privileges()` with an input of `17`? Select all that apply.",
        },
        {
          kind: "code",
          value:
            'def check_privileges(age):\n    if age >= 18:\n        print("Can vote")\n    if age >= 16:\n        print("Can drive")\n    if age >= 13:\n        print("Can have social media")\n    if age < 13:\n        print("Too young for social media")\n\ncheck_privileges(17)',
        },
      ],
      options: [
        'print("Can vote")',
        'print("Can drive")',
        'print("Can have social media")',
        'print("Too young for social media")',
      ],
      correctAnswers: [1, 2],
      feedback: {
        correct:
          "Correct! When age is 17, the conditions 'age >= 16' and 'age >= 13' are both True, so those two messages print. The other two conditions are False.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "MultipleSelection",
      id: "true-statements",
      title: "Understanding Multiple Ifs",
      content: [
        {
          kind: "text",
          value:
            "Which of the following statements about multiple if statements are true? Select all that apply.",
        },
      ],
      options: [
        "Each if statement is checked independently",
        "Once one if condition is True, all others are skipped",
        "Multiple if conditions can all be True for the same input",
        "The order of if statements never matters",
        "Python checks every if statement in the function",
        "Only the first True condition runs",
      ],
      correctAnswers: [0, 2, 4],
      feedback: {
        correct:
          "Perfect! Each if is independent, so multiple can be True. Python checks them all. Order CAN matter if the if statements modify variables, but that's more advanced. The key is that all if statements get checked.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Testing",
      id: "password-validator" as SectionId,
      title: "Challenge: Password Validator",
      content: [
        {
          kind: "text",
          value:
            "Create a function `check_password_simple(password)` that validates a password with multiple independent checks:\n\n1. Always print 'Checking password...'\n2. If password equals 'secret', print 'Access granted!'\n3. If the length of password is less than 5, print 'That is a short password!'\n4. Always print 'Check complete'\n\nNote: Use len(password) to get the length of the password string.\n\nYour function should work like this:\n- check_password_simple('secret') prints access granted (length is 6, not less than 5)\n- check_password_simple('hi') prints short password warning (length is 2)\n- check_password_simple('password123') prints neither special message",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_password_simple(password):\n    # Start message\n    \n    # Check for exact match with "secret"\n    \n    # Check if length < 5\n    \n    # End message\n    pass\n\n# Test your function\ncheck_password_simple("secret")\nprint("---")\ncheck_password_simple("hi")\nprint("---")\ncheck_password_simple("password123")',
      },
      testCases: [
        {
          input: ["secret"],
          expected: "Checking password...\nAccess granted!\nCheck complete",
          description: "Test with 'secret'",
        },
        {
          input: ["hi"],
          expected:
            "Checking password...\nThat is a short password!\nCheck complete",
          description: "Test with 'hi'",
        },
        {
          input: ["password123"],
          expected: "Checking password...\nCheck complete",
          description: "Test with 'password123'",
        },
      ],
      functionToTest: "check_password_simple",
    } as TestingSectionData,
    {
      kind: "Matching",
      id: "code-to-output" as SectionId,
      title: "Predicting Outputs",
      content: [
        {
          kind: "text",
          value:
            "Match each function call to its complete output (including all messages that will print):",
        },
        {
          kind: "code",
          value:
            'def evaluate(x):\n    if x > 10:\n        print("Big")\n    if x > 5:\n        print("Medium")\n    if x < 5:\n        print("Small")',
        },
      ],
      prompts: [
        { "evaluate(15)": '"Big" and "Medium"' },
        { "evaluate(7)": '"Medium" only' },
        { "evaluate(3)": '"Small" only' },
        { "evaluate(5)": "No messages" },
      ],
      feedback: {
        correct:
          "Excellent! You successfully traced through each if statement to determine which conditions were True for each input.",
      },
    } as MatchingSectionData,
    {
      kind: "Testing",
      id: "grade-messages" as SectionId,
      title: "Challenge: Grade Messages",
      content: [
        {
          kind: "text",
          value:
            "Create a function `check_grade(score)` that provides encouraging feedback based on a student's score:\n\n1. Always print 'Your score: [score]'\n2. If score is greater than 90, print 'Outstanding work!'\n3. If score is greater than 80, print 'Great job!'\n4. Always print 'Keep studying!'\n\nImportant: For a score of 95, BOTH 'Outstanding work!' and 'Great job!' should print because 95 is greater than both 90 and 80. This is different from letter grades where you'd only want one message - we'll learn how to do that in the next lesson.\n\nTest your function with scores 95, 85, and 75 to see the different combinations of messages.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_grade(score):\n    # Always print the score\n    \n    # Check for outstanding (> 90)\n    \n    # Check for great (> 80)\n    \n    # Always print encouragement\n    pass\n\n# Test your function\ncheck_grade(95)\nprint("---")\ncheck_grade(85)\nprint("---")\ncheck_grade(75)',
      },
      testCases: [
        {
          input: [95],
          expected:
            "Your score: 95\nOutstanding work!\nGreat job!\nKeep studying!",
          description: "Test with score 95 (triggers both conditions)",
        },
        {
          input: [85],
          expected: "Your score: 85\nGreat job!\nKeep studying!",
          description: "Test with score 85 (triggers one condition)",
        },
        {
          input: [75],
          expected: "Your score: 75\nKeep studying!",
          description: "Test with score 75 (triggers no conditions)",
        },
      ],
      functionToTest: "check_grade",
    } as TestingSectionData,
    {
      kind: "Information",
      id: "multiple-ifs-conclusion",
      title: "When to Use Multiple Ifs",
      content: [
        {
          kind: "text",
          value:
            "Great work! You've learned how to use multiple if statements in one function. Each if statement is checked independently, which means:\n- Multiple conditions can be True for the same input\n- Python checks every single if statement, even if previous ones were True\n- This is useful when you want to perform multiple independent checks\n\nBut sometimes, you don't want multiple conditions to be True at the same time. For example, if you're assigning letter grades (A, B, C, D, F), a student should get exactly ONE grade, not multiple. Or if you're checking a password, you want to say either 'Access granted' OR 'Access denied', not both.\n\nThat's what we'll learn in the next lesson: how to make your function choose between alternatives using if/else statements. You'll discover when to use multiple independent if statements (like we learned today) versus when to use if/else for mutually exclusive choices.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
