import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Functions and Temperature Conversion",
  guid: "65ddff46-b4af-4443-ac0a-5b6a714e405e",
  description:
    "Learn how to create and use functions in Python, with a focus on converting temperatures between Celsius and Fahrenheit.",
  sections: [
    {
      kind: "Information",
      id: "introduction",
      title: "Introduction",
      content:
        "In this lesson, you'll learn how to create and use functions in Python. Functions allow us to organize code into reusable blocks that perform specific tasks.",
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "functions",
      title: "Python Functions",
      content:
        "Functions are defined using the def keyword, followed by the function name and parentheses. Any parameters the function takes are placed inside the parentheses.",
      example: {
        id: "function-basic",
        title: "Basic Function",
        description: "Here's a simple function that greets a person by name.",
        code: 'def greet(name):\n    """This function greets the person passed in as a parameter"""\n    return f"Hello, {name}!"\n\n# Call the function\nmessage = greet("Alice")\nprint(message)\n\n# Call it again with a different name\nprint(greet("Bob"))',
      },
    } as ObservationSectionData,
    {
      kind: "Observation",
      id: "temperature",
      title: "Temperature Conversion",
      content:
        "One common application of functions is to convert between different units of measurement. Let's look at how to convert between Celsius and Fahrenheit temperatures.\n\nTo convert from Celsius to Fahrenheit, use the formula: F = (C × 9/5) + 32\n\nWhere F is the temperature in Fahrenheit and C is the temperature in Celsius.",
      example: {
        id: "temp-conversion",
        title: "Converting Celsius to Fahrenheit",
        description:
          "This function converts a temperature from Celsius to Fahrenheit using the formula F = (C × 9/5) + 32.",
        code: 'def celsius_to_fahrenheit(celsius):\n    """Convert Celsius temperature to Fahrenheit"""\n    fahrenheit = (celsius * 9/5) + 32\n    return fahrenheit\n\n# Test the function with some values\nfreezing_c = 0\nfreezing_f = celsius_to_fahrenheit(freezing_c)\nprint(f"{freezing_c}°C is {freezing_f}°F")\n\nbody_temp_c = 37\nbody_temp_f = celsius_to_fahrenheit(body_temp_c)\nprint(f"{body_temp_c}°C is {body_temp_f}°F")\n\nboiling_c = 100\nboiling_f = celsius_to_fahrenheit(boiling_c)\nprint(f"{boiling_c}°C is {boiling_f}°F")',
      },
    } as ObservationSectionData,
    {
      kind: "Testing",
      id: "challenge",
      title: "Coding Challenge: Temperature Converter",
      content:
        "Now it's your turn! Create a function called celsius_to_fahrenheit that:\n- Takes a temperature in Celsius as input\n- Converts it to Fahrenheit using the formula: F = (C × 9/5) + 32\n- Returns the Fahrenheit temperature as a number",
      example: {
        id: "challenge",
        title: "Your Task",
        description: "Implement the celsius_to_fahrenheit function below:",
        code: "def celsius_to_fahrenheit(celsius):\n    # Write your function here\n    pass  # Delete this line and add your code\n\n# You can test your function with different values here\nprint(celsius_to_fahrenheit(0))  # Should print 32.0\nprint(celsius_to_fahrenheit(100))  # Should print 212.0",
        testCases: [
          {
            input: 0,
            expected: 32,
            description: "Freezing point of water (0°C)",
          },
          {
            input: 100,
            expected: 212,
            description: "Boiling point of water (100°C)",
          },
          {
            input: 37,
            expected: 98.6,
            description: "Human body temperature (37°C)",
          },
          {
            input: -40,
            expected: -40,
            description: "Equal point (-40°C)",
          },
          {
            input: 25,
            expected: 77,
            description: "Room temperature (25°C)",
          },
          {
            input: -10,
            expected: 14,
            description: "Cold winter day (-10°C)",
          },
          { input: 42, expected: 107.6, description: "Hot day (42°C)" },
        ],
        functionToTest: "celsius_to_fahrenheit",
      },
    } as TestingSectionData,
    {
      kind: "Information",
      id: "testing",
      title: "Understanding Testing",
      content:
        'Testing is a crucial part of software development. When you click the "Test Solution" button, our system will run your function with various inputs and check if the outputs match the expected results.\n\nThe test cases include:\n- Standard temperatures (freezing point, boiling point)\n- Body temperature\n- Negative temperatures\n- Edge cases\n\nYour function should handle all these cases correctly to pass the tests.',
    } as InformationSectionData,
  ],
};

export default lessonData;
