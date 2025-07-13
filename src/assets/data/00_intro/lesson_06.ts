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
  title: "Further Functions",
  guid: "bfa974e1-7042-48a4-a568-19a1816ea474" as LessonId,
  description:
    "Dive deeper into functions and make them more flexible with inputs",
  sections: [
    {
      kind: "Information",
      id: "function-refresher",
      title: "Function Refresher",
      content: [
        {
          kind: "text",
          value:
            "Functions are very useful for making a program easier to understand. You create the function once and then use it over and over again. In this lesson, we'll investigate how a computer executes functions and how to make functions a bit more general by allowing them to accept and use different **inputs**.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Debugger",
      id: "variable-debugging" as SectionId,
      title: "Watching Variables Change",
      content: [
        {
          kind: "text",
          value:
            "Let's dive into how a function call actually works. Below is a small program where we greet Bill with different phrases. Step through each line of the program. The most important part to notice is every time a function is called, the value of the call gets stored into the functions input. You go in and out of the function three times, each time with a different input value.",
        },
      ],
      code: 'def greet_bill():\n  print(phrase + " Bill!")\n\ngreet_bill("Yo")\ngreet_bill("What up")\ngreet_bill("Hi")\nprint("All done")',
      advancedControls: false,
    } as DebuggerSectionData,
    {
      kind: "PRIMM",
      id: "primm-greet-person-function" as SectionId,
      title: "Functions with Inputs",
      content: [
        {
          kind: "text",
          value:
            "Below is some Python code that **defines** and **calls** the `greet_person()` function. Notice that there is now something *between the parentheses*. Predict what you think the code will output, then run it to check your prediction.",
        },
      ],
      examples: [
        {
          id: "primm-greet-person-function",
          code: 'def greet_person(name):\n  print("Hello there " + name + "!")\n\ngreet_person("Ben")\ngreet_person("Meg")',
          predictPrompt: "What do you think will happen when you run the code?",
        },
      ],
      conclusion: `Calling a function with different "inputs" allows them to mold to the situation.`,
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "variable-reassignment",
      title: "Variable Values",
      content: [
        {
          kind: "text",
          value: `As you saw above, you can pass different values (inputs) to functions and have them react differently. What happens is the following:\n1. You define the function with \`def\` and the name\n2. Inside the parentheses, you state the inputs the function should take\n3. You call the function, passing the inputs in via the call\n\nBased on what you observed in the previous section, what will be printed out if you call the function with the code \`greet_person("Bill")\`?`,
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
          'Correct! The value `"Bill"` gets stored in the input `name` variable',
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
            'Let\'s revisit the parts of a function from the previous lesson...mostly because I lied to you a bit. There\'s really **five** pieces:\n1. `def` starts "defining" the function\n2. `greet_person` is name of the function\n3. The variables inside the parentheses are inputs, waiting to be set by the function call\n4. The indented code below the `def greet_person(name):` is the code the function will run\n5. The unindented `greet_person()` "calls" the function with a particular value\n\nKnowing this, match up each piece of the function with its value in the code below.',
        },
        {
          id: "temp-conversion",
          title: "Testing Operations",
          code: 'def favorite(animal):\n    print(\nMy favorite animal is a " + animal)\n\nfavorite("cat")',
        },
      ],
      prompts: [
        { id: "p1", text: "Function name" },
        { id: "p2", text: 'Function input"' },
        { id: "p3", text: "Function call" },
      ],
      options: [
        { id: "A", text: "favorite" },
        { id: "B", text: "animal" },
        { id: "C", text: '"cat"' },
      ],
      solution: {
        p1: "A",
        p2: "B",
        p3: "C",
      },
    } as MatchingSectionData,

    {
      kind: "Debugger",
      id: "variable-debugging" as SectionId,
      title: "Watching Variables Change",
      content: [
        {
          kind: "text",
          value:
            "Let's dive into how a function call actually works. Below is a small program where we greet Bill with different phrases. Step through each line of the program. The most important part to notice is every time a function is called, the value of the call gets stored into the functions input. You go in and out of the function three times, each time with a different input value.",
        },
      ],
      code: 'def greet_bill(phrase):\n  print(phrase + " Bill!")\n\ngreet_bill("Yo")\ngreet_bill("What up")\ngreet_bill("Hi")\nprint("All done")',
      advancedControls: false,
    } as DebuggerSectionData,
    {
      kind: "Reflection",
      id: "variables-reflection" as SectionId,
      title: "Variables Reflection",
      content: [
        {
          kind: "text",
          value:
            'Variables are fundamental to programming because they allow programs to store, change, and reuse data. Without variables, every value would have to be written directly into the code, making programs inflexible and hard to maintain.\n\nNow it\'s time to reflect to formalize your knowledge. Create a simple 3-4 line code example that demonstrates how variables can make a program more useful, and write 3-4 sentences explaining how your program works. Remember to use the phrase "as seen in the example above".',
        },
      ],
      topic: "Why Functions Matter",
      isTopicPredefined: true,
      code: "Create an example showing a simple function definition and call",
      isCodePredefined: false,
      explanation: "Explain how the code in example works (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "variables-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Congratulations on learning about functions! You now understand how to define and call your own functions. Identifying places where you can create and use functions is one of the core parts of being a programmer.\n\nYou should feel proud. Over the previous two lessons, you've learned some of the most important concepts in programming. They will come up over and over again. In the next lesson, we'll pause and test ourselves on everything we've learned so far.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
