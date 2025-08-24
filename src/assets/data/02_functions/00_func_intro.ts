import type {
  InformationSectionData,
  Lesson,
  LessonId,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  ObservationSectionData,
  PRIMMSectionData,
  ReflectionSectionData,
  SectionId,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Introduction to Functions",
  guid: "3ad2a551-618e-4398-918a-02342f824ab1" as LessonId,
  description:
    "Learn how to create reusable blocks of code with functions to simplify your programs",
  sections: [
    {
      kind: "Information",
      id: "functions-intro",
      title: "Welcome to Functions!",
      content: [
        {
          kind: "text",
          value: `So far, you've been writing programs that run line-by-line from top to bottom. That's great, but as your programs get bigger, you'll need to break them up into understandable chunks. That's where **functions** come in! Think of functions like teaching someone a new skill. Once they learn it, you can just say "do that thing we practiced" instead of explaining it all over again.\n\nFunctions let you:\n - **Reuse code** without copying and pasting\n- **Organize** your programs into logical chunks\n- **Avoid mistakes** by writing tricky code just once`,
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "observe-first-function1" as SectionId,
      title: "Your First Function",
      content: [
        {
          kind: "text",
          value: `Again, think of functions as teaching someone a new skill. From this view, the program below has two parts:
- **Defining** the function (teaching the skill)
- **Calling** the function (using the skill)

Run the code and see what happens!`,
        },
      ],
      example: {
        visualization: "console",
        initialCode: `def greet():\n  print("Hello there!")\n  print("Welcome to Python!")\n\ngreet()`,
      },
    } as ObservationSectionData,
    {
      kind: "MultipleChoice",
      id: "function-parts",
      title: "Function Parts",
      content: [
        {
          kind: "text",
          value:
            'As you can see, a function is a small chunk of code sitting there, waiting to be used. The function is "defined" with the line `def greet():` and then all the code that\'s **indented under the function** will be run once the function is "called". Once a function has been defined, it can be called over and over again.\n\nBased on this explanation, which of the following lines of code "calls" the function?',
        },
      ],
      options: [
        "`def greet():`",
        '`print("Hello there!")`',
        '`print("Welcome to Python!")`',
        "`greet()`",
      ],
      correctAnswer: 3,
      feedback: {
        correct:
          'Correct! The code indented under the function is "called" by `greet()`.',
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "primm-greet-function" as SectionId,
      title: "Multiple Function Calls",
      content: [
        {
          kind: "text",
          value:
            "Below is some Python code that **defines** and **calls** the `greet()` function. Predict what the code below will output, then run it to check your prediction.",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def greet():\n  print("Hello there!")\n  print("Welcome to Python!")\n\ngreet()\ngreet()\ngreet()',
      },
      predictPrompt: "What do you think will happen when you run the code?",
      conclusion:
        "Correct! The ability to call a function multiple times is part of what makes them so useful.",
    } as PRIMMSectionData,
    {
      kind: "Information",
      id: "function-summary",
      title: "Function Summary",
      content: [
        {
          kind: "text",
          value:
            'There are seemingly a lot of parts to creating/using a function, but it\'s really just four main pieces:\n- `def` starts "defining" the function\n- `greet` is the name of the function\n- The indented code below the `def greet():` is the code the function will run\n- The unindented `greet()` "calls" the function\n\nFor another perspective about functions, watch the video below (ignore the talk about pep-8, we\'ll talk about that later).',
        },
        {
          kind: "video",
          src: "https://youtu.be/u-OmVr_fT4s?si=ZLunXpE8Bhk23lsD",
          caption: "Video about functions",
          start: 12,
          end: 144,
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleSelection",
      id: "functions-intro-quiz",
      title: "Understanding Parts of Functions",
      content: [
        {
          kind: "text",
          value:
            "Which of the following statements about functions are true? Select all that apply.",
        },
      ],
      options: [
        "You start **defining** a function with the word `def`",
        "Indented code **above** `def` will be run when the function is called",
        "Indented code **below** `def` will be run when the function is called",
        "A function **call** must be indented",
        "Functions can only have two lines of code inside them",
        "You can **call** a function as many times as you'd like",
      ],
      correctAnswers: [0, 2, 5],
      feedback: {
        correct:
          "Correct! Functions follow a specific pattern, but are incredibly useful.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "MultipleChoice",
      id: "def-function-question",
      title: "How to Define a Function",
      content: [
        {
          kind: "text",
          value:
            'What is the proper way to start "defining" a function that will say goodbye?',
        },
      ],
      options: [
        "`goodbye:`",
        "`def goodbye:`",
        "`def goodbye()`",
        "`goodbye():`",
        "`def goodbye():`",
      ],
      correctAnswer: 4,
      feedback: {
        correct:
          'Correct! Defining a function requires `def`, the name of the function, parentheses, and a colon (plus code "inside" the function)',
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "function-call-quiz",
      title: "How to Call a Function",
      content: [
        {
          kind: "text",
          value:
            'What is the proper way to "call" a function that will say goodbye?',
        },
      ],
      options: ["`goodbye`", "`   goodbye`", "`goodbye()`", "`goodbye():`"],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! Calling a function requires a line that is the function name followed by parentheses",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "birthday-practice" as SectionId,
      title: "Challenge: Happy Birthday Song",
      content: [
        {
          kind: "text",
          value:
            'Now it\'s your turn to work with functions! Create a program that:\n\n1. Calls the existing `verse()` and `chorus()` functions to "sing" happy birthday to Alex.',
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          'def verse():\n  print("Happy birthday to you")\n\ndef chorus():\n  print("Happy birthday dear Alex")\n\n# Your code here\n',
      },
      testCases: [
        {
          input: [null],
          expected:
            "Happy birthday to you\nHappy birthday to you\nHappy birthday dear Alex\nHappy birthday to you",
          description: "Test happy birthday song to a Alex",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Reflection",
      id: "function-reflection" as SectionId,
      title: "Functions Reflection",
      content: [
        {
          kind: "text",
          value:
            'Functions are fundamental to programming because they allow you to break your program up into understandable chunks. Without functions, every program would be one large blob of code. Functions allow you to "fold" your code to make it smaller and easier to understand.\n\nNow it\'s time to reflect to formalize your knowledge. Create a simple 3-4 line code example that demonstrates how functions work. Then, write 3-4 sentences explaining how your program works, pointing out key parts such as the function definition and function call. Remember to use the phrase "as seen in the example above".',
        },
      ],
      topic: "How Functions Work",
      isTopicPredefined: true,
      code: "Create an example showing how functions work.",
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
          value: `Congratulations on making your way through the first lesson on functions! In the next lesson, we'll examine how computers execute functions and see how to use functions to reduce the amount of code you have to write.`,
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
