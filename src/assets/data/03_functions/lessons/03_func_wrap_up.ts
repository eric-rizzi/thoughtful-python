import type {
  CoverageSectionData,
  CoverageTableRow,
  InformationSectionData,
  InputParam,
  Lesson,
  LessonId,
  MatchingSectionData,
  MultipleChoiceSectionData,
  PredictionSectionData,
  SectionId,
  TestingSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Function Unit Challenge",
  guid: "d6b6048d-ebb0-4ac8-9b06-60ad1134ef98" as LessonId,
  description:
    "Practice what you've learned so far in terms of data types, variables, and functions via interleaving.",
  sections: [
    {
      kind: "Information",
      id: "review-intro",
      title: "Practicing with Interleaving",
      content: [
        {
          kind: "text",
          value:
            "You've learned a lot in the previous three lessons: how to create functions, how to call functions, and how to use function input values. As with the previous review section, this lesson uses **interleaving** to help solidify your understanding. By pulling in everything you've learned so far and asking questions about it in a mixed up order, your brain will be able to make stronger connections between the concepts. Be sure to take your time and think carefully about each problem!",
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "type-error-identification",
      title: "Interpreting Type Errors",
      content: [
        {
          kind: "text",
          value: `Which line does the \`TypeError\` below identify as a problem?:\n\`\`\`\nPyodide Execution Error: 
Execution Error: Traceback (most recent call last):
  File "/lib/python311.zip/_pyodide/_base.py", line 573, in eval_code_async
    await CodeRunner(
  File "/lib/python311.zip/_pyodide/_base.py", line 393, in run_async
    coroutine = eval(self.code, globals, locals)
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<exec>", line 31, in <module>
TypeError: unsupported operand type(s) for +: 'int' and 'str'\n\`\`\``,
        },
      ],
      options: ["line 33", "line 393", "line 573", "line 1"],
      correctAnswer: 0,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "string-identification",
      title: "Identifying Strings",
      content: [
        {
          kind: "text",
          value:
            "Which of the following is **not** a valid string and would cause an error?",
        },
      ],
      options: [
        '"It\'s a beautiful day"',
        '"She said "hello" to me"',
        "'Hello, World'",
        '\' " " " " \'',
      ],
      correctAnswer: 1,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Coverage",
      id: "simple-coverage-single1",
      title: "Different Inputs",
      content: [
        {
          kind: "text",
          value: "Provide inputs that will produce the desired output.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "def do_math(x):\n  y = x + x\n  z = y + y\n  print(z)\n\n",
      },
      testMode: "procedure",
      functionToTest: "do_math",
      coverageTable: {
        columns: [
          {
            variableName: "x",
            variableType: "number",
          } as InputParam,
        ],
        rows: [
          {
            fixedInputs: {},
            expectedOutput: "12",
            hint: "12 = ? + ? + ? + ?",
          } as CoverageTableRow,
          {
            fixedInputs: {},
            expectedOutput: "4",
            hint: "4 = ? + ? + ? + ?",
          } as CoverageTableRow,
          {
            fixedInputs: {},
            expectedOutput: "28",
            hint: "28 = ? + ? + ? + ?",
          },
        ],
      },
    } as CoverageSectionData,
    {
      kind: "MultipleChoice",
      id: "function-naming-1",
      title: "Function Naming",
      content: [
        {
          kind: "text",
          value:
            "Naming functions is a really important part of programming because it helps you understand what a functions _does_. What would be a better name for the function in the program above?",
        },
      ],
      options: ["`double()`", "`quadruple()`", "`square()`", "`cube()`"],
      correctAnswer: 1,
      feedback: {
        correct: "Correct! The input is made four times bigger.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "function-naming-2",
      title: "Function Naming Again",
      content: [
        {
          kind: "text",
          value:
            "Now knowing that proper naming of functions is important, what would be a better name for the `do_math()` function below?",
        },
        {
          kind: "code",
          value:
            "def do_math(num):\n    y = num * num\n    z = y * num\n    print(z)",
        },
      ],
      options: ["`double()`", "`quadruple()`", "`square()`", "`cube()`"],
      correctAnswer: 3,
      feedback: {
        correct:
          "Correct! The input is cubed because it is multiple by itself three times.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Matching",
      id: "python-ops-match" as SectionId,
      title: "Matching Operations",
      content: [
        {
          kind: "text",
          value:
            "Having experimented with different data types and different operations in the previous section, match each of the following bits of code with their output:",
        },
      ],
      prompts: [
        { "4 + 7": "11" },
        { '"4" + "7"': '"47"' },
        { '4 + "7"': "TypeError: unsupported operand type(s) for +" },
        { "4 - 7": "-2" },
        { '4 - "7"': "TypeError: unsupported operand type(s) for -" },
      ],
    } as MatchingSectionData,
    {
      kind: "Matching",
      id: "ordering-function-pieces" as SectionId,
      title: "Function Pieces",
      content: [
        {
          kind: "text",
          value:
            "Let's revisit the parts of a function from the previous lesson. Match up each part of the function with the order they come in when you're defining and calling a function.",
        },
        {
          kind: "image",
          src: "",
        },
      ],
      prompts: [
        { A: "Starts defining a function" },
        { B: "Function name" },
        { C: "Inputs to function" },
        { D: 'Code "inside" function' },
        { E: "Function call" },
      ],
    } as MatchingSectionData,
    {
      kind: "Prediction",
      id: "multi-output-testing" as SectionId,
      title: "Predict the Outputs",
      content: [
        {
          kind: "text",
          value: "Guess what the outputs will be",
        },
      ],
      example: {
        visualization: "console",
        initialCode: "def fn(x):\n  print(x)",
      },
      testMode: "procedure",
      functionToTest: "fn",
      predictionTable: {
        columns: [{ variableName: "x", variableType: "number" }],
        rows: [{ inputs: [2] }, { inputs: [4] }, { inputs: [6] }],
      },
    } as PredictionSectionData,
    {
      kind: "Testing",
      id: "multi-input-testing" as SectionId,
      title: "Challenge: Create a Two Input Function",
      content: [
        {
          kind: "text",
          value:
            "Create a function that takes two inputs that matches the following input/output patterns:\n- 2 and 2 outputs 5\n- 4 and 2 outputs 9\n- 4 and 1 outputs 5\n- 6 and 1 outputs 7",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "def do_math(num_1, num_2):\n    # Your code here\n\ndo_math(2, 2)\ndo_math(4, 2)\ndo_math(4, 1)\ndo_math(6, 1)",
      },

      testCases: [
        {
          input: [2, 2],
          expected: "5",
          description: "Test 2, 2 -> 5",
        },
        {
          input: [4, 2],
          expected: "9",
          description: "Test 4, 2 -> 9",
        },
        {
          input: [4, 1],
          expected: "5",
          description: "Test 4, 1 -> 5",
        },
        {
          input: [6, 1],
          expected: "7",
          description: "Test 6, 1 -> 7",
        },
      ],
      testMode: "procedure",
      functionToTest: "do_math",
    } as TestingSectionData,
  ],
};

export default lessonData;
