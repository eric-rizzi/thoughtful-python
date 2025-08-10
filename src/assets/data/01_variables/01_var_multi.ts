import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
  LessonId,
  SectionId,
  DebuggerSectionData,
  MultipleChoiceSectionData,
  TestingSectionData,
  ReflectionSectionData,
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
