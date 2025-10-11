import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  ObservationSectionData,
  PRIMMSectionData,
  MultipleChoiceSectionData,
  TestingSectionData,
  MatchingSectionData,
  ReflectionSectionData,
  PredictionSectionData,
  CoverageSectionData,
  MultipleSelectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Combining Conditions",
  guid: "e5b6f823-4d71-4a92-bc58-9f2e6d8a7c31" as LessonId,
  description:
    "Learn how to combine multiple conditions using and, or, and not to create more sophisticated decision-making.",
  sections: [
    {
      kind: "Information",
      id: "boolean-intro",
      title: "When One Question Isn't Enough",
      content: [
        {
          kind: "text",
          value:
            "Sometimes you need to check multiple things at once. Can you ride this roller coaster? You need to be tall enough AND brave enough. Can you get a discount? You qualify if you're a student OR a senior citizen.\n\nThat's where **boolean operators** come in. They let you combine conditions:\n- `and`: BOTH conditions must be True\n- `or`: AT LEAST ONE condition must be True\n- `not`: Flips True to False and False to True\n\nThese operators let your functions make complex decisions based on multiple factors.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "first-and" as SectionId,
      title: "The AND Operator",
      content: [
        {
          kind: "text",
          value:
            "Let's see how `and` works. For a movie to be appropriate, it needs to be the right rating AND the right length:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_movie(rating, length_minutes):\n    if rating == "PG" and length_minutes <= 120:\n        print("Perfect for family movie night!")\n    else:\n        print("Let\'s find a different movie")\n\nprint("Movie 1:")\ncheck_movie("PG", 90)  # Right rating, right length\n\nprint("\\nMovie 2:")\ncheck_movie("PG", 180)  # Right rating, too long\n\nprint("\\nMovie 3:")\ncheck_movie("R", 90)   # Wrong rating, right length\n\nprint("\\nMovie 4:")\ncheck_movie("R", 180)  # Wrong rating, wrong length',
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "and-truth",
      title: "When Is AND True?",
      content: [
        {
          kind: "text",
          value: "When using `and`, when is the entire condition True?",
        },
      ],
      options: [
        "When BOTH parts are True",
        "When at least one part is True",
        "When the first part is True",
        "When the second part is True",
      ],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct! The `and` operator requires BOTH conditions to be True. If either one is False (or both are False), the entire condition is False.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Matching",
      id: "and-truth-table" as SectionId,
      title: "AND Truth Table",
      content: [
        {
          kind: "text",
          value: "Match each combination with its result when using `and`:",
        },
      ],
      prompts: [
        { "True and True": "True" },
        { "True and False": "False" },
        { "False and True": "False" },
        { "False and False": "False" },
      ],
      feedback: {
        correct:
          "Perfect! With `and`, only True and True gives True. Everything else is False.",
      },
    } as MatchingSectionData,
    {
      kind: "PRIMM",
      id: "or-operator-primm" as SectionId,
      title: "The OR Operator",
      content: [
        {
          kind: "text",
          value:
            "Now let's see how `or` works. You get a discount if you're a student OR a senior:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_discount(age, is_student):\n    if age < 12 or age >= 65:\n        print("You get a discount!")\n    else:\n        print("Regular price")\n\ncheck_discount(10, False)  # Child - gets discount\ncheck_discount(70, False)  # Senior - gets discount\ncheck_discount(30, False)  # Adult - no discount\ncheck_discount(11, False)  # Almost 12 - still gets discount',
      },
      predictPrompt:
        "With `or`, you get a discount if you're under 12 OR 65 and over. Which ages will get the discount?",
      conclusion:
        "The `or` operator gives True if EITHER condition is True (or if both are True). It only gives False when BOTH conditions are False.",
    } as PRIMMSectionData,
    {
      kind: "Prediction",
      id: "or-prediction" as SectionId,
      title: "Predict OR Outcomes",
      content: [
        {
          kind: "text",
          value:
            "This function checks if someone can enter the park for free. Predict who gets in free:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def free_entry(age, has_membership):\n    if age < 5 or has_membership:\n        print("Free entry!")\n    else:\n        print("Please pay admission")',
      },
      predictionTable: {
        functionToTest: "free_entry",
        columns: [
          { variableName: "age", variableType: "number" },
          { variableName: "has_membership", variableType: "boolean" },
        ],
        rows: [
          { inputs: [3, false] },
          { inputs: [3, true] },
          { inputs: [25, true] },
          { inputs: [25, false] },
          { inputs: [5, false] },
        ],
      },
    } as PredictionSectionData,
    {
      kind: "Matching",
      id: "or-truth-table" as SectionId,
      title: "OR Truth Table",
      content: [
        {
          kind: "text",
          value: "Match each combination with its result when using `or`:",
        },
      ],
      prompts: [
        { "True or True": "True" },
        { "True or False": "True" },
        { "False or True": "True" },
        { "False or False": "False" },
      ],
      feedback: {
        correct:
          "Excellent! With `or`, only False or False gives False. Everything else is True.",
      },
    } as MatchingSectionData,
    {
      kind: "Testing",
      id: "ride-requirements" as SectionId,
      title: "Challenge: Theme Park Ride",
      content: [
        {
          kind: "text",
          value:
            "Create a function `can_ride(height, age, has_adult)` that checks if someone can ride:\n\nYou CAN ride if:\n- You are at least 120cm tall AND at least 10 years old\nOR\n- You are at least 100cm tall AND have an adult with you\n\nPrint 'You can ride!' or 'Sorry, you cannot ride this attraction'",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "def can_ride(height, age, has_adult):\n    # Check both conditions using and/or\n    # Remember: tall enough AND old enough\n    # OR: shorter but WITH adult\n    pass\n\n# Test cases\ncan_ride(125, 12, False)  # Tall and old enough\ncan_ride(105, 8, True)    # Short but has adult\ncan_ride(105, 8, False)   # Short and no adult\ncan_ride(95, 15, True)    # Too short even with adult",
      },
      testCases: [
        {
          input: [125, 12, false],
          expected: "You can ride!",
          description: "Tall and old enough",
        },
        {
          input: [105, 8, true],
          expected: "You can ride!",
          description: "Short but has adult",
        },
        {
          input: [105, 8, false],
          expected: "Sorry, you cannot ride this attraction",
          description: "Short and no adult",
        },
        {
          input: [95, 15, true],
          expected: "Sorry, you cannot ride this attraction",
          description: "Too short even with adult",
        },
      ],
      functionToTest: "can_ride",
    } as TestingSectionData,
    {
      kind: "Coverage",
      id: "and-coverage" as SectionId,
      title: "Make Both True",
      content: [
        {
          kind: "text",
          value:
            "Provide inputs that will produce each output. Remember: `and` needs BOTH conditions True!",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_access(age, has_permission):\n    if age >= 18 and has_permission:\n        print("Access granted")\n    else:\n        print("Access denied")',
      },
      coverageTable: {
        functionToTest: "check_access",
        columns: [
          { variableName: "age", variableType: "number" },
          { variableName: "has_permission", variableType: "boolean" },
        ],
        rows: [
          {
            expectedOutput: "Access granted",
            hint: "Need age >= 18 AND permission true",
          },
          {
            expectedOutput: "Access denied",
            hint: "Adult but no permission",
          },
          {
            expectedOutput: "Access denied",
            hint: "Has permission but too young",
          },
          {
            expectedOutput: "Access denied",
            hint: "Neither condition true",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "PRIMM",
      id: "not-operator-primm" as SectionId,
      title: "The NOT Operator",
      content: [
        {
          kind: "text",
          value:
            "The `not` operator flips True to False and False to True. It's useful for checking if something is NOT the case:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_quiet_hours(hour):\n    if not (hour >= 9 and hour <= 17):\n        print("Please be quiet - it\'s outside business hours")\n    else:\n        print("Normal noise level is fine")\n\ncheck_quiet_hours(8)   # Before 9am\ncheck_quiet_hours(12)  # Noon\ncheck_quiet_hours(18)  # After 5pm\ncheck_quiet_hours(22)  # Late night',
      },
      predictPrompt:
        "The condition `not (hour >= 9 and hour <= 17)` is True when it's NOT between 9am and 5pm. Which hours require quiet?",
      conclusion:
        "The `not` operator reverses the condition. Here it's True when outside business hours (before 9 or after 17).",
    } as PRIMMSectionData,
    {
      kind: "MultipleSelection",
      id: "complex-condition" as SectionId,
      title: "Complex Conditions",
      content: [
        {
          kind: "text",
          value:
            "For the condition `(age >= 13 and age <= 19) or is_student`, which inputs make it True? Select all that apply.",
        },
      ],
      options: [
        "age=15, is_student=False (teenager)",
        "age=25, is_student=True (adult student)",
        "age=10, is_student=False (child)",
        "age=17, is_student=True (teen student)",
        "age=30, is_student=False (adult non-student)",
      ],
      correctAnswers: [0, 1, 3],
      feedback: {
        correct:
          "Correct! It's True for teenagers (13-19) OR students of any age. So teen non-students, adult students, and teen students all qualify!",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Testing",
      id: "password-strength" as SectionId,
      title: "Challenge: Password Strength Checker",
      content: [
        {
          kind: "text",
          value:
            "Create a function `check_password_strength(password)` that:\n\n1. If length >= 8 AND contains both uppercase and lowercase: prints 'Strong password!'\n2. Elif length >= 8: prints 'Add some capital letters'\n3. Else: prints 'Too short!'\n\nHints:\n- Use len(password) for length\n- Check for uppercase: password.lower() != password\n- Check for lowercase: password.upper() != password",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_password_strength(password):\n    # Check length\n    # Check for uppercase (password.lower() != password means it has uppercase)\n    # Check for lowercase (password.upper() != password means it has lowercase)\n    # Use and to combine conditions\n    pass\n\n# Test your function\ncheck_password_strength("abc")\ncheck_password_strength("abcdefgh")\ncheck_password_strength("AbCdEfGh")\ncheck_password_strength("ABCDEFGH")',
      },
      testCases: [
        {
          input: ["abc"],
          expected: "Too short!",
          description: "Too short",
        },
        {
          input: ["abcdefgh"],
          expected: "Add some capital letters",
          description: "Long but no capitals",
        },
        {
          input: ["AbCdEfGh"],
          expected: "Strong password!",
          description: "Long with mixed case",
        },
        {
          input: ["ABCDEFGH"],
          expected: "Add some capital letters",
          description: "Long but all capitals",
        },
      ],
      functionToTest: "check_password_strength",
    } as TestingSectionData,
    {
      kind: "Prediction",
      id: "combined-prediction" as SectionId,
      title: "Admission Rules",
      content: [
        {
          kind: "text",
          value:
            "A museum has complex admission rules. Predict who gets in free:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def free_admission(age, is_student, is_member):\n    if age < 5 or is_member:\n        print("Free admission!")\n    elif is_student and age < 18:\n        print("Student discount - half price")\n    else:\n        print("Full price")',
      },
      predictionTable: {
        functionToTest: "free_admission",
        columns: [
          { variableName: "age", variableType: "number" },
          { variableName: "is_student", variableType: "boolean" },
          { variableName: "is_member", variableType: "boolean" },
        ],
        rows: [
          { inputs: [4, false, false] },
          { inputs: [16, true, false] },
          { inputs: [25, false, true] },
          { inputs: [20, true, false] },
          { inputs: [3, false, true] },
        ],
      },
    } as PredictionSectionData,
    {
      kind: "Coverage",
      id: "or-coverage" as SectionId,
      title: "Weekend or Holiday",
      content: [
        {
          kind: "text",
          value:
            "The store is closed on weekends OR holidays. Provide days that result in each status:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def store_status(is_weekend, is_holiday):\n    if is_weekend or is_holiday:\n        print("Store is closed")\n    else:\n        print("Store is open")',
      },
      coverageTable: {
        functionToTest: "store_status",
        columns: [
          { variableName: "is_weekend", variableType: "boolean" },
          { variableName: "is_holiday", variableType: "boolean" },
        ],
        rows: [
          {
            expectedOutput: "Store is closed",
            hint: "Weekend day",
          },
          {
            expectedOutput: "Store is closed",
            hint: "Weekday holiday",
          },
          {
            expectedOutput: "Store is open",
            hint: "Regular weekday",
          },
          {
            expectedOutput: "Store is closed",
            hint: "Weekend holiday",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "Testing",
      id: "game-access" as SectionId,
      title: "Challenge: Game Access",
      content: [
        {
          kind: "text",
          value:
            "Create a function `can_play_game(age, has_permission, is_weekend)` that determines if someone can play:\n\nYou CAN play if:\n- You're 18 or older (no other requirements)\nOR\n- You're 13-17 AND have permission AND it's the weekend\nOR\n- You're under 13 AND have permission (any day)\n\nPrint 'You can play!' or 'Sorry, not right now'",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "def can_play_game(age, has_permission, is_weekend):\n    # Adults can always play\n    # Teens need permission AND weekend\n    # Kids need permission (any day)\n    pass\n\n# Test cases\ncan_play_game(20, False, False)  # Adult\ncan_play_game(15, True, True)    # Teen with permission on weekend\ncan_play_game(15, True, False)   # Teen with permission on weekday\ncan_play_game(10, True, False)   # Kid with permission\ncan_play_game(10, False, True)   # Kid without permission",
      },
      testCases: [
        {
          input: [20, false, false],
          expected: "You can play!",
          description: "Adult can always play",
        },
        {
          input: [15, true, true],
          expected: "You can play!",
          description: "Teen with permission on weekend",
        },
        {
          input: [15, true, false],
          expected: "Sorry, not right now",
          description: "Teen with permission on weekday",
        },
        {
          input: [10, true, false],
          expected: "You can play!",
          description: "Kid with permission any day",
        },
      ],
      functionToTest: "can_play_game",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "boolean-reflection" as SectionId,
      title: "Boolean Operators Reflection",
      content: [
        {
          kind: "text",
          value:
            "Boolean operators (and, or, not) let you combine simple conditions into complex decisions. With `and` both must be True, with `or` at least one must be True, and `not` flips the value.\n\nCreate a function using at least one `and` and one `or` to make a complex decision. Explain how the conditions work together. Remember to use the phrase 'as seen in the example above'.",
        },
      ],
      topic: "How Boolean Operators Combine Conditions",
      isTopicPredefined: true,
      code: "Create a function using both 'and' and 'or'",
      isCodePredefined: false,
      explanation:
        "Explain how your boolean operators create the logic (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "boolean-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Fantastic work! You've mastered boolean operators and can now create sophisticated conditions. You learned:\n- `and` requires ALL conditions to be True\n- `or` requires AT LEAST ONE condition to be True  \n- `not` flips True to False and False to True\n- You can combine these operators for complex logic\n- Parentheses help group conditions clearly\n\nYou can now write functions that make decisions based on multiple factors - age AND permission, student OR senior, NOT during quiet hours. Your functions can handle real-world complexity!\n\nIn the final lesson, we'll bring EVERYTHING together - all the conditionals you've learned plus everything from previous units. Get ready for the ultimate challenge!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
