import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  PRIMMSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  TestingSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Making Decisions",
  guid: "b4e7c932-5a81-4d29-9c73-8f2e4b7a1d36" as LessonId,
  description:
    "Learn how to make your functions choose different actions based on their inputs using if statements.",
  sections: [
    {
      kind: "Information",
      id: "decisions-intro",
      title: "Functions That Think",
      content: [
        {
          kind: "text",
          value:
            "So far, every function you've written does the exact same thing every time. Give it the same input, get the same output. But real programs need to make decisions! What if you want a function that says 'Good morning!' before noon but 'Good afternoon!' after noon? Or a function that only lets you in if you know the password?\n\nThat's where **if statements** come in. An if statement lets your code ask a question and then choose whether to run certain lines based on the answer. It's like teaching your functions to think!",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "first-if" as SectionId,
      title: "Your First If Statement",
      content: [
        {
          kind: "text",
          value:
            "Let's see how an if statement works. Watch carefully - the indented line only runs sometimes! Run this code and pay attention to when 'It's hot outside!' appears:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_temperature(temp):\n    print(f"The temperature is {temp} degrees")\n    if temp > 30:\n        print("It\'s hot outside!")\n    print("Temperature check complete")\n\ncheck_temperature(35)\nprint("---")\ncheck_temperature(20)\nprint("---")\ncheck_temperature(31)',
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "when-prints",
      title: "When Does It Print?",
      content: [
        {
          kind: "text",
          value:
            "In the code above, when will the message 'It's hot outside!' get printed?",
        },
      ],
      options: [
        "Every time the function is called",
        "Never - it's just there for show",
        "Only when temp is greater than 30",
        "Only when temp equals exactly 30",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! The if statement checks if temp > 30. When this condition is True, the indented code runs. When it's False, Python skips it!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "string-comparison-primm" as SectionId,
      title: "Comparing Strings",
      content: [
        {
          kind: "text",
          value:
            "If statements can compare strings too! Look at this password checker and predict what will happen:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_password(attempt):\n    print(f"You entered: {attempt}")\n    if attempt == "cheese":\n        print("Welcome, it\'s lovely to see you")\n    print("Done checking")\n\ncheck_password("cheese")\nprint("---")\ncheck_password("CHEESE")\nprint("---")\ncheck_password("pizza")',
      },
      predictPrompt:
        "Which function calls will print 'Welcome, it's lovely to see you'? Remember that Python cares about uppercase vs lowercase!",
      conclusion:
        "Only check_password('cheese') prints the welcome message! Python sees 'cheese', 'CHEESE', and 'Cheese' as completely different. The == checks if two things are EXACTLY the same.",
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "equals-comparison",
      title: "One Equals or Two?",
      content: [
        {
          kind: "text",
          value: "What's the difference between = and == in Python?",
        },
      ],
      options: [
        "They do the same thing",
        "= assigns a value to a variable, == checks if two things are equal",
        "== assigns a value to a variable, = checks if two things are equal",
        "= is for numbers, == is for strings",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Use = to store values in variables (like x = 5). Use == to check if things are equal in an if statement (like if x == 5).",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "age-checker" as SectionId,
      title: "Challenge: Age Checker",
      content: [
        {
          kind: "text",
          value:
            "Create a function `check_voting_age(age)` that:\n1. Prints the person's age\n2. If the age is 18 or greater, prints 'You can vote!'\n3. Always prints 'Thank you for checking'\n\nMake sure to test with ages 17, 18, and 19 to verify it works correctly at the boundary!",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_voting_age(age):\n    # Print the age\n    \n    # Check if they can vote (>= 18)\n    \n    # Thank them\n    pass\n\n# Test your function\ncheck_voting_age(17)\nprint("---")\ncheck_voting_age(18)\nprint("---")\ncheck_voting_age(19)',
      },
      testCases: [
        {
          input: [17],
          expected: "17\nThank you for checking",
          description: "Test with age 17 (cannot vote)",
        },
        {
          input: [18],
          expected: "18\nYou can vote!\nThank you for checking",
          description: "Test with age 18 (can vote)",
        },
        {
          input: [19],
          expected: "19\nYou can vote!\nThank you for checking",
          description: "Test with age 19 (can vote)",
        },
      ],
      functionToTest: "check_voting_age",
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "case-insensitive-primm" as SectionId,
      title: "Case-Insensitive Checking",
      content: [
        {
          kind: "text",
          value:
            "The `.lower()` function is incredibly useful! It converts all letters in a string to lowercase. This lets us check for a word regardless of how the user typed it:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def greet_friend(name):\n    if name.lower() == "alice":\n        print("Hey Alice! Great to see my best friend!")\n    print(f"Thanks for visiting, {name}")\n\ngreet_friend("alice")\nprint("---")\ngreet_friend("ALICE")\nprint("---")\ngreet_friend("Alice")\nprint("---")\ngreet_friend("Bob")',
      },
      predictPrompt:
        "The function checks if name.lower() == 'alice'. Which function calls will trigger the special greeting? Think about what .lower() does to each input!",
      conclusion:
        "All three versions of Alice get the special greeting! The .lower() function converts 'alice', 'ALICE', and 'Alice' all to 'alice', making the comparison work regardless of capitalization.",
    } as PRIMMSectionData,
    {
      kind: "MultipleSelection",
      id: "greater-equal-check",
      title: "Greater or Equal",
      content: [
        {
          kind: "text",
          value:
            "If a function has the line `if score >= 90:`, which of these function calls will trigger the if statement? Select all that apply.",
        },
      ],
      options: [
        "check_score(89)",
        "check_score(90)",
        "check_score(91)",
        "check_score(100)",
        "check_score(0)",
        "check_score(90.5)",
      ],
      correctAnswers: [1, 2, 3, 5],
      feedback: {
        correct:
          "Correct! The >= operator means 'greater than or equal to', so 90 and anything above 90 will trigger the if statement. 89 is not included!",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Testing",
      id: "grade-messages" as SectionId,
      title: "Challenge: Grade Messages",
      content: [
        {
          kind: "text",
          value:
            "Create a function `check_grade(score)` that:\n1. Always prints 'Your score: [score]'\n2. If the score is greater than 90, also prints 'Outstanding work!'\n3. If the score is greater than 80 (but not greater than 90), prints 'Great job!'\n4. Always prints 'Keep studying!'\n\nHint: You'll need TWO separate if statements (not if/else, just two ifs).",
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
          expected: "Your score: 95\nOutstanding work!\nKeep studying!",
          description: "Test with score 95",
        },
        {
          input: [85],
          expected: "Your score: 85\nGreat job!\nKeep studying!",
          description: "Test with score 85",
        },
        {
          input: [75],
          expected: "Your score: 75\nKeep studying!",
          description: "Test with score 75",
        },
      ],
      functionToTest: "check_grade",
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "multiple-conditions-primm" as SectionId,
      title: "Multiple If Statements",
      content: [
        {
          kind: "text",
          value:
            "You can have multiple if statements in a function! Each one is checked independently:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def analyze_word(word):\n    print(f"Analyzing: {word}")\n    \n    if len(word) > 5:\n        print("That\'s a long word!")\n    \n    if word.upper() == word:\n        print("WHY ARE YOU SHOUTING?")\n    \n    if "e" in word.lower():\n        print("Contains the letter e")\n    \n    print("Analysis complete")\n\nanalyze_word("HELLO")\nprint("---")\nanalyze_word("Python")\nprint("---")\nanalyze_word("WOW")',
      },
      predictPrompt:
        "Each if statement is checked separately. For each word, predict which messages will appear. Remember: len() gives the length, .upper() converts to uppercase, and 'in' checks if something is contained in a string.",
      conclusion:
        "Each if statement runs independently! A word can trigger none, one, some, or all of the if statements depending on its properties.",
    } as PRIMMSectionData,
    {
      kind: "Testing",
      id: "password-validator" as SectionId,
      title: "Challenge: Password Strength Checker",
      content: [
        {
          kind: "text",
          value:
            "Create a function `check_password_simple(password)` that:\n1. Always prints 'Checking password...'\n2. If the password is exactly 'cheese', prints 'Welcome, it's lovely to see you'\n3. If the password contains the letter 'a', prints 'Your password contains an a'\n4. If the length is less than 5, prints 'That's a short password!'\n5. Always prints 'Check complete'\n\nUse .lower() for checking if it contains 'a' so it works for both 'a' and 'A'.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_password_simple(password):\n    # Start message\n    \n    # Check for exact match with "cheese"\n    \n    # Check if contains "a" (use .lower())\n    \n    # Check if length < 5\n    \n    # End message\n    pass\n\n# Test your function\ncheck_password_simple("cheese")\nprint("---")\ncheck_password_simple("Apple")\nprint("---")\ncheck_password_simple("xyz")',
      },
      testCases: [
        {
          input: ["cheese"],
          expected:
            "Checking password...\nWelcome, it's lovely to see you\nCheck complete",
          description: "Test with 'cheese'",
        },
        {
          input: ["Apple"],
          expected:
            "Checking password...\nYour password contains an a\nCheck complete",
          description: "Test with 'Apple'",
        },
        {
          input: ["xyz"],
          expected:
            "Checking password...\nThat's a short password!\nCheck complete",
          description: "Test with 'xyz'",
        },
      ],
      functionToTest: "check_password_simple",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "if-statement-reflection" as SectionId,
      title: "If Statements Reflection",
      content: [
        {
          kind: "text",
          value:
            "If statements let your functions make decisions. The code inside an if statement only runs when the condition is True. You can have multiple if statements, and each is checked independently.\n\nCreate a simple example with at least two if statements in one function, and explain how they control which code runs. Remember to use the phrase 'as seen in the example above'.",
        },
      ],
      topic: "How If Statements Control Code",
      isTopicPredefined: true,
      code: "Create a function with at least two if statements",
      isCodePredefined: false,
      explanation:
        "Explain how your if statements decide what code runs (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "if-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Great work! You've learned how to make your functions think and decide. You discovered:\n- If statements check a condition and run code only when it's True\n- The == operator checks if two things are exactly equal\n- The >= and > operators compare numbers\n- The .lower() function helps make string comparisons case-insensitive\n- You can have multiple if statements that each check different things\n- Indentation shows what code belongs inside the if statement\n\nSo far, your functions can make decisions about what TO do. But what if you want to choose between doing one thing OR another? That's what we'll explore in the next lesson with if/else statements!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
