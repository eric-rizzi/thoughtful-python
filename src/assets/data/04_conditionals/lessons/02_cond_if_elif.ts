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
  MultipleSelectionSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Multiple Paths: Elif",
  guid: "d8a4e732-9f51-4c83-b821-6e7d3f8c9a42" as LessonId,
  description:
    "Learn how to create functions with three or more different paths using elif statements.",
  sections: [
    {
      kind: "Information",
      id: "elif-intro",
      title: "More Than Two Choices",
      content: [
        {
          kind: "text",
          value:
            "Life isn't always yes or no. Think about traffic lights - they're not just red or green, there's yellow too! Or grades - you don't just pass or fail, you get A, B, C, D, or F.\n\nThat's where `elif` comes in (short for 'else if'). It lets you check multiple conditions in order, creating as many paths through your code as you need.\n\nHere's the key: Python checks each condition from top to bottom and runs the FIRST one that's True. Once it finds a match, it skips all the rest.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "traffic-light" as SectionId,
      title: "Three Options: Traffic Light",
      content: [
        {
          kind: "text",
          value:
            "Here's the traffic light example from your worksheet. Notice how there are three possible messages:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_light(color):\n    if color == "red":\n        print("STOP!")\n    elif color == "yellow":\n        print("Slow down!")\n    else:\n        print("Go!")\n\ncheck_light("red")\ncheck_light("yellow")\ncheck_light("green")\ncheck_light("purple")\ncheck_light("GREEN")',
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "elif-understanding",
      title: "Understanding Elif",
      content: [
        {
          kind: "text",
          value:
            "In the traffic light function, what happens when color is 'purple'?",
        },
      ],
      options: [
        "Python raises an error",
        "Nothing happens",
        "It prints 'Go!' (the else handles it)",
        "It prints all three messages",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! The else catches everything that isn't red or yellow. So purple, blue, or any other color (including 'GREEN' with capitals) prints 'Go!'",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "grade-system-primm" as SectionId,
      title: "Grade System",
      content: [
        {
          kind: "text",
          value:
            "Here's a grading system with five different paths. Notice the order of conditions:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def get_grade(score):\n    if score >= 90:\n        print("A - Excellent!")\n    elif score >= 80:\n        print("B - Good job!")\n    elif score >= 70:\n        print("C - Satisfactory")\n    elif score >= 60:\n        print("D - Needs improvement")\n    else:\n        print("F - See me after class")\n\nget_grade(95)\nget_grade(85)\nget_grade(75)\nget_grade(65)\nget_grade(55)',
      },
      predictPrompt:
        "Why do we check >= 90 before >= 80? What would happen if we checked >= 60 first? Think about a score of 85.",
      conclusion:
        "Order matters! If we checked >= 60 first, a score of 85 would match that condition and print 'D' instead of 'B'. Python stops at the FIRST condition that's True.",
    } as PRIMMSectionData,
    {
      kind: "Prediction",
      id: "grade-prediction" as SectionId,
      title: "Predict the Grades",
      content: [
        {
          kind: "text",
          value:
            "For each score, predict which grade will be assigned. Remember: Python checks conditions from top to bottom and stops at the first True condition.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def assign_grade(score):\n    if score >= 90:\n        print("A")\n    elif score >= 80:\n        print("B")\n    elif score >= 70:\n        print("C")\n    elif score >= 60:\n        print("D")\n    else:\n        print("F")',
      },
      predictionTable: {
        functionToTest: "assign_grade",
        columns: [{ variableName: "score", variableType: "number" }],
        rows: [
          { inputs: [100] },
          { inputs: [90] },
          { inputs: [89] },
          { inputs: [70] },
          { inputs: [69] },
          { inputs: [0] },
        ],
      },
    } as PredictionSectionData,
    {
      kind: "Coverage",
      id: "size-coverage" as SectionId,
      title: "Size Categories",
      content: [
        {
          kind: "text",
          value: "Provide measurements that will produce each size category:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def get_size(measurement):\n    if measurement < 10:\n        print("Small")\n    elif measurement < 20:\n        print("Medium")\n    elif measurement < 30:\n        print("Large")\n    else:\n        print("Extra Large")',
      },
      coverageTable: {
        functionToTest: "get_size",
        columns: [
          {
            variableName: "measurement",
            variableType: "number",
          },
        ],
        rows: [
          {
            expectedOutput: "Small",
            hint: "Less than 10",
          },
          {
            expectedOutput: "Medium",
            hint: "Between 10 and 19",
          },
          {
            expectedOutput: "Large",
            hint: "Between 20 and 29",
          },
          {
            expectedOutput: "Extra Large",
            hint: "30 or more",
          },
          {
            expectedOutput: "Medium",
            hint: "What about exactly 10?",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "Testing",
      id: "day-categorizer" as SectionId,
      title: "Challenge: Day Categorizer",
      content: [
        {
          kind: "text",
          value:
            "Create a function `categorize_day(day)` that:\n1. If the day is 'saturday' or 'sunday' (case-insensitive), prints 'Weekend!'\n2. Elif the day is 'monday' through 'friday' (case-insensitive), prints 'Weekday'\n3. Else prints 'Not a valid day'\n\nHint: Use .lower() to handle any capitalization\nHint: You'll need multiple elif statements",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def categorize_day(day):\n    # Convert to lowercase for checking\n    # Check for weekend days\n    # Check for each weekday\n    # Handle invalid input\n    pass\n\n# Test your function\ncategorize_day("Saturday")\ncategorize_day("MONDAY")\ncategorize_day("wednesday")\ncategorize_day("Funday")',
      },
      testCases: [
        {
          input: ["Saturday"],
          expected: "Weekend!",
          description: "Test with 'Saturday'",
        },
        {
          input: ["monday"],
          expected: "Weekday",
          description: "Test with 'monday'",
        },
        {
          input: ["FRIDAY"],
          expected: "Weekday",
          description: "Test with 'FRIDAY'",
        },
        {
          input: ["Funday"],
          expected: "Not a valid day",
          description: "Test with invalid day",
        },
      ],
      functionToTest: "categorize_day",
    } as TestingSectionData,
    {
      kind: "PRIMM",
      id: "nested-decisions-primm" as SectionId,
      title: "Nested Choices",
      content: [
        {
          kind: "text",
          value:
            "Sometimes you need to make a decision, then make another decision based on that. This is called nesting:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def analyze_temperature(temp):\n    if temp < 0:\n        print("Freezing!")\n    else:\n        if temp < 20:\n            print("Cold")\n        else:\n            print("Warm")\n\nanalyze_temperature(-5)\nanalyze_temperature(10)\nanalyze_temperature(25)',
      },
      predictPrompt:
        "This has an if/else at the outer level, then another if/else inside the else block. Trace through each temperature to predict the output.",
      conclusion:
        "Nested conditionals let you group related decisions. Here we first check if it's freezing, and only if it's not do we distinguish between cold and warm.",
    } as PRIMMSectionData,
    {
      kind: "Debugger",
      id: "fix-everything" as SectionId,
      title: "Debug Challenge: Fix Everything",
      content: [
        {
          kind: "text",
          value:
            "From the worksheet - this code has an error on every line! Step through, identify all errors, then fix them:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def check_answer(answer):\n    if antler == "a":  # Error: wrong variable\n        print(Option a")  # Error: missing quote\n    else  # Error: missing colon\n        if answer = "b":  # Error: = instead of ==\n            print("Option b"  # Error: missing paren\n            else:  # Error: wrong indentation\n            write("Other")  # Error: write not print\n    print("All done")',
      },
    } as DebuggerSectionData,
    {
      kind: "MultipleSelection",
      id: "first-match" as SectionId,
      title: "Which Conditions Are Checked?",
      content: [
        {
          kind: "text",
          value:
            "If score = 85 in this grade function, which conditions are actually evaluated (checked) by Python? Select all that apply.",
        },
        {
          kind: "code",
          value:
            'def get_grade(score):\n    if score >= 90:\n        print("A")\n    elif score >= 80:\n        print("B")\n    elif score >= 70:\n        print("C")\n    else:\n        print("F")',
        },
      ],
      options: [
        "score >= 90 (checked, result: False)",
        "score >= 80 (checked, result: True)",
        "score >= 70 (never checked)",
        "The else (never reached)",
        "All conditions are always checked",
      ],
      correctAnswers: [0, 1, 2, 3],
      feedback: {
        correct:
          "Correct! Python checks >= 90 (False), then >= 80 (True), prints 'B', and stops. The >= 70 and else are never even looked at!",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Testing",
      id: "temperature-advisor" as SectionId,
      title: "Challenge: Temperature Advisor",
      content: [
        {
          kind: "text",
          value:
            "Create a function `temperature_advice(temp)` with four categories:\n1. If temp < 0: prints 'Freezing! Stay inside!'\n2. Elif temp < 15: prints 'Cold - wear a coat'\n3. Elif temp < 25: prints 'Nice weather!'\n4. Else: prints 'Hot - stay hydrated'\n\nMake sure to test the boundaries!",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "def temperature_advice(temp):\n    # Four different temperature ranges\n    # Remember: order matters!\n    pass\n\n# Test all categories and boundaries\ntemperature_advice(-5)\ntemperature_advice(0)\ntemperature_advice(10)\ntemperature_advice(20)\ntemperature_advice(25)\ntemperature_advice(30)",
      },
      testCases: [
        {
          input: [-5],
          expected: "Freezing! Stay inside!",
          description: "Test freezing temperature",
        },
        {
          input: [10],
          expected: "Cold - wear a coat",
          description: "Test cold temperature",
        },
        {
          input: [20],
          expected: "Nice weather!",
          description: "Test nice temperature",
        },
        {
          input: [30],
          expected: "Hot - stay hydrated",
          description: "Test hot temperature",
        },
      ],
      functionToTest: "temperature_advice",
    } as TestingSectionData,
    {
      kind: "Prediction",
      id: "pet-classifier-prediction" as SectionId,
      title: "Pet Classifier",
      content: [
        {
          kind: "text",
          value:
            "This function classifies pets by number of legs. Predict the output for each input:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def classify_pet(legs):\n    if legs == 0:\n        print("Fish or snake")\n    elif legs == 2:\n        print("Bird")\n    elif legs == 4:\n        print("Dog or cat")\n    elif legs == 8:\n        print("Spider")\n    else:\n        print("Unknown creature")',
      },
      predictionTable: {
        functionToTest: "classify_pet",
        columns: [{ variableName: "legs", variableType: "number" }],
        rows: [
          { inputs: [4] },
          { inputs: [2] },
          { inputs: [0] },
          { inputs: [6] },
          { inputs: [8] },
          { inputs: [100] },
        ],
      },
    } as PredictionSectionData,
    {
      kind: "Coverage",
      id: "ticket-price-coverage" as SectionId,
      title: "Movie Ticket Prices",
      content: [
        {
          kind: "text",
          value:
            "A movie theater has different prices by age. Provide ages that result in each ticket price:",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def ticket_price(age):\n    if age < 5:\n        print("Free admission")\n    elif age < 13:\n        print("Child: $8")\n    elif age < 65:\n        print("Adult: $15")\n    else:\n        print("Senior: $10")',
      },
      coverageTable: {
        functionToTest: "ticket_price",
        columns: [
          {
            variableName: "age",
            variableType: "number",
          },
        ],
        rows: [
          {
            expectedOutput: "Free admission",
            hint: "Under 5 years old",
          },
          {
            expectedOutput: "Child: $8",
            hint: "Between 5 and 12",
          },
          {
            expectedOutput: "Adult: $15",
            hint: "Between 13 and 64",
          },
          {
            expectedOutput: "Senior: $10",
            hint: "65 or older",
          },
          {
            expectedOutput: "Child: $8",
            hint: "What about exactly 5?",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "Matching",
      id: "elif-order" as SectionId,
      title: "Order These Conditions",
      content: [
        {
          kind: "text",
          value:
            "These conditions need to be in the right order to work correctly. Match them to their correct position (1st, 2nd, 3rd, 4th) for a grade function:",
        },
      ],
      prompts: [
        { "First condition": "if score >= 90:" },
        { "Second condition": "elif score >= 80:" },
        { "Third condition": "elif score >= 70:" },
        { "Fourth condition": "else:" },
      ],
      feedback: {
        correct:
          "Correct! You must check from highest to lowest, with else catching everything below 70.",
      },
    } as MatchingSectionData,
    {
      kind: "Testing",
      id: "game-difficulty" as SectionId,
      title: "Challenge: Game Difficulty Selector",
      content: [
        {
          kind: "text",
          value:
            "Create a function `select_difficulty(choice)` that:\n1. If choice is 'easy' (case-insensitive): prints 'You have 10 lives'\n2. Elif choice is 'medium': prints 'You have 5 lives'\n3. Elif choice is 'hard': prints 'You have 3 lives'\n4. Elif choice is 'extreme': prints 'You have 1 life - good luck!'\n5. Else: prints 'Please choose: easy, medium, hard, or extreme'\n\nUse .lower() to handle any capitalization!",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "def select_difficulty(choice):\n    # Handle 4 difficulty levels\n    # Don't forget case-insensitive checking\n    # Have a helpful else message\n    pass\n\n# Test your function\nselect_difficulty('EASY')\nselect_difficulty('Medium')\nselect_difficulty('hard')\nselect_difficulty('EXTREME')\nselect_difficulty('nightmare')",
      },
      testCases: [
        {
          input: ["EASY"],
          expected: "You have 10 lives",
          description: "Test easy mode",
        },
        {
          input: ["medium"],
          expected: "You have 5 lives",
          description: "Test medium mode",
        },
        {
          input: ["Hard"],
          expected: "You have 3 lives",
          description: "Test hard mode",
        },
        {
          input: ["nightmare"],
          expected: "Please choose: easy, medium, hard, or extreme",
          description: "Test invalid input",
        },
      ],
      functionToTest: "select_difficulty",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "elif-reflection" as SectionId,
      title: "Multiple Paths Reflection",
      content: [
        {
          kind: "text",
          value:
            "Elif statements let you create multiple paths through your code. Python checks each condition in order and runs the FIRST one that's True, then skips the rest.\n\nCreate a function with at least 3 different paths (if, elif, else) and explain how the order of conditions matters. Remember to use the phrase 'as seen in the example above'.",
        },
      ],
      topic: "How Elif Creates Multiple Branches",
      isTopicPredefined: true,
      code: "Create a function with if, at least one elif, and else",
      isCodePredefined: false,
      explanation:
        "Explain how elif checks conditions in order and why order matters (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "elif-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Excellent work mastering elif statements! You've learned:\n- `elif` creates additional paths between if and else\n- Python checks conditions from top to bottom\n- The FIRST True condition wins - all others are skipped\n- Order matters! Check more specific conditions first\n- You can have as many elif statements as needed\n- Nested conditionals let you make decisions within decisions\n\nYou can now handle any number of choices: two paths (if/else), three paths (if/elif/else), or many paths (if/elif/elif/elif.../else).\n\nBut what if you need to check multiple things at once? What if entry requires being 18+ AND having a ticket? Or getting a discount for being a student OR a senior? That's what we'll learn next with boolean operators!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
