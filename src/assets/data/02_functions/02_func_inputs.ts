import type {
  DebuggerSectionData,
  InformationSectionData,
  Lesson,
  LessonId,
  MatchingSectionData,
  MultipleChoiceSectionData,
  PRIMMSectionData,
  ReflectionSectionData,
  SectionId,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Inputs to Functions",
  guid: "ab5bed79-7662-423e-90ef-952539f59099" as LessonId,
  description: "Learn how to make functions more flexible with inputs",
  sections: [
    {
      kind: "PRIMM",
      id: "primm-greet-person-function" as SectionId,
      title: "Functions with Inputs",
      content: [
        {
          kind: "text",
          value:
            'Ok, now it\'s time to learn how to make functions a little more "general". Below is some Python code that **defines** and **calls** the `greet_person()` function. Notice that there is now a variable *between the parentheses*. Predict what the code below will output, then run it to check your prediction.',
        },
      ],
      example: {
        id: "primm-greet-person-function",
        code: 'def greet_person(name):\n  print("Hello there " + name + "!")\n\ngreet_person("Ben")\ngreet_person("Meg")',
        predictPrompt: "What do you think will happen when you run the code?",
      },
      conclusion: `Calling a function with different "inputs" allows them to mold to the situation.`,
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "variable-reassignment",
      title: "Input Values",
      content: [
        {
          kind: "text",
          value: `As you saw above, you can pass different values (inputs) to functions and have the functions act differently. What happens is the following:\n1. You define the function with \`def\` and the name\n2. Inside the parentheses, you state the inputs/variables the function should take\n3. You call the function, passing the inputs in via the call\n\nBased on what you observed in the previous section, what will be printed out if you call the function with the code \`greet_person("Bill")\`?`,
        },
      ],
      options: [
        "`Hello there + name + !`",
        "`Hello there Bill!`",
        "`greet_person(name)`",
        "`Hello there name!`",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          'Correct! The value `"Bill"` gets stored in the functions `name` input variable',
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Matching",
      id: "matching-function-pieces" as SectionId,
      title: "Function Parts",
      content: [
        {
          kind: "text",
          value:
            'Let\'s revisit the parts of a function from the previous lesson...mostly because we lied to you a bit. There\'s really **five** pieces:\n1. `def` starts "defining" the function\n2. `greet_person` is name of the function\n3. **The variables inside the parentheses are inputs, waiting to be set by the function call**\n4. The indented code below the `def greet_person(name):` is the code the function will run\n5. The unindented `greet_person()` "calls" the function with a particular value\n\nKnowing this, match up each piece of the function with its value in the code below.',
        },
      ],
      prompts: [
        { "Function name": "favorite" },
        { 'Function input"': "animal" },
        { "Function call": '"cat"' },
      ],
    } as MatchingSectionData,
    {
      kind: "Debugger",
      id: "variable-debugging" as SectionId,
      title: "Watching Variables Change",
      content: [
        {
          kind: "text",
          value:
            "Let's dive into how a function call **with inputs** work. Below is a small program where we greet Bill with three different phrases. Step through each line of the program. The most important thing to notice is every time a function is called, the value of the call gets stored into the function's `phrase` input variable. In total, you go in and out of the function three times, each time with a different input value.",
        },
      ],
      code: 'def greet_bill(phrase):\n  print(phrase + " Bill!")\n\ngreet_bill("Yo")\ngreet_bill("What up")\ngreet_bill("Hi")\nprint("All done")',
      advancedControls: false,
    } as DebuggerSectionData,
    {
      kind: "MultipleChoice",
      id: "problem-function-input-1-question",
      title: "What's the Output?",
      content: [
        {
          kind: "text",
          value: "What would the following program print out?",
        },
        {
          kind: "code",
          value:
            "def math_stuff(x):\n    y = x + x\n    print(y + 1)\n\nmath_stuff(7)",
        },
      ],
      options: ["9", "10", "13", "15"],
      correctAnswer: 3,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "problem-function-input-2-question",
      title: "What's the Output?",
      content: [
        {
          kind: "text",
          value: "What would the following program print out?",
        },
        {
          kind: "code",
          value:
            "def math_stuff(x, y):\n    z = x * y\n    print(z + x)\n\nmath_stuff(5, 2)",
        },
      ],
      options: ["9", "10", "13", "15"],
      correctAnswer: 3,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Reflection",
      id: "function-with-inputs-reflection" as SectionId,
      title: "Functions With Inputs Reflection",
      content: [
        {
          kind: "text",
          value:
            'Providing inputs to functions allows them to become much more useful. This, in turn, means that they provide you with many more opportunities to "fold" your program: assuming you can find the patterns. \n\nNow it\'s time to reflect to formalize your knowledge. Create a simple 3-4 line code example that demonstrates how a function that takes one (or multiple) inputs works and then write 3-4 sentences explaining how your program works. Remember to use the phrase "as seen in the example above".',
        },
      ],
      topic: "Functions With Inputs",
      isTopicPredefined: true,
      code: "Create an example showing the definition and calling of a function that takes input(s)",
      isCodePredefined: false,
      explanation: "Explain how the code in example works (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "functions-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Congratulations on learning about functions! You now understand how to define and call your own functions. Identifying places where you can create and use functions is one of the core parts of being a programmer.\n\nYou should feel proud. Over the previous three lessons, you've learned some of the most important concepts in programming. They will come up over and over again. In the next lesson, we'll pause and test ourselves on everything we've learned so far.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
