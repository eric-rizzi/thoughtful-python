import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  DebuggerSectionData,
  MultipleChoiceSectionData,
  PRIMMSectionData,
  MultipleSelectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Multiple Data Streams",
  guid: "aa145d0e-68cb-44b2-a484-8d7ab19e2810" as LessonId,
  description:
    "Learn how to handle and utilize multiple variables to create complex interactions.",
  sections: [
    {
      kind: "Information",
      id: "variables-conclusion",
      title: "A Different Perspective on Variables",
      content: [
        {
          kind: "text",
          value:
            "Relying on only one type of information (e.g., reading) limits your potential. For optimal results, it's best to use a technique called dual encoding, which means mixing up the ways you learn. The more ways you can see, hear, touch, or smell what you're learning, the more likely you are to remember it.\n\nFor this reason, where applicable, we've included images and videos to augment the lessons. In this case, the video below talks about variables and explains how they hold different data types in \"slots\" of memory in the computer. You can almost view variables as labels for the memory holding the data you want to store.",
        },
        {
          kind: "video",
          src: "https://www.youtube.com/watch?v=cQT33yu9pY8",
          start: 4,
          end: 57,
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "variable-reassignment",
      title: "Variable Values",
      content: [
        {
          kind: "text",
          value:
            "If you were to insert the line `students_count = students_count + 16` between the first and second line of the example from the video, what would be printed out?",
        },
      ],
      options: ["16", "1000", "1016", "Error"],
      correctAnswer: 2,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Debugger",
      id: "multiple-variables-debugging" as SectionId,
      title: "Watching Multiple Variables Change",
      content: [
        {
          kind: "text",
          value:
            'It\'s time to increase the degree of difficulty by using _multiple_ variables. This is very common when a program needs to store and operate on different pieces of data. When this happens, each variable has its own name and stores its own, independent value.\n\nStep line-by-line through the code below and watch how each variable maintains its own, separate value. As before, pay attention to the `Variables` and `Program Output` side-panels. If you go slow, you can see how different values pop in and out of the memory slots designated by the "variable labels".',
        },
      ],
      code: 'first_name = "Eric"\nlast_name = "Smith"\nage = 25\nfirst_name = first_name + "a"\nage = age + 10\nprint(first_name + " " + last_name)\nage = age + 3\nprint(age)',
    } as DebuggerSectionData,
    {
      kind: "Information",
      id: "variables-single",
      title: "Short Term Memory",
      content: [
        {
          kind: "text",
          value:
            'An important thing to understand is that variables can only remember one thing. As soon as their value is set, they have no way to "remember" what their previous value was.\n\nConsider the line of code `x = x + 1`. The computer handles this line in two distinct parts. First, it calculates what the stuff to the **right** of the equal size (the value) should be. Then, it saves this value into the variable on the **left** side of the equal sign.',
        },
      ],
    } as InformationSectionData,
    {
      kind: "PRIMM",
      id: "switch-values-primm" as SectionId,
      title: "Switching Values",
      content: [
        {
          kind: "text",
          value:
            "A common problem in programming is to switch the values stored in variable. For example, if you have the variables `x` and `y`, you might want to put the value in `x` into `y` and the value in `y` into `x`. Unfortunately, the fact that variables can only store one value at a time can make this tricky.\n\nPredict what this program will output, then run it to check your prediction.",
        },
      ],
      example: {
        id: "string-variable-change",
        code: 'x = "Hello"\ny = "Goodbye"\nx = y\ny = x\nprint(x)\nprint(y)',
        predictPrompt:
          "The program is attempting to swap the values stored in `x` and `y`. What do you think the program will output?",
      },
      conclusion:
        'Since variables can only remember a single value, `"Hello"` gets lost when the value of `y` is stored into `x`!',
    } as PRIMMSectionData,
    {
      kind: "MultipleSelection",
      id: "data-types",
      title: "Data Types",
      content: [
        {
          kind: "text",
          value: "Select all of the following that are integers (not strings):",
        },
      ],
      options: ["42", '"forty two"', "0", '"hello"', "999", "'999'", "-5"],
      correctAnswers: [0, 2, 4, 6],
      feedback: {
        correct:
          "Correct! Integers are whole numbers without quotation marks around them.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Information",
      id: "variables-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "Great job learning about some of the complexities of variables! The more practice you have, the easier to will be to understand when and how to use variables and how to debug any issues that pop up while you're using them.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
