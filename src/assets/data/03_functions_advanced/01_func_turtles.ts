import type {
  CoverageSectionData,
  InformationSectionData,
  Lesson,
  LessonId,
  MatchingSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  ObservationSectionData,
  SectionId,
  TestingSectionData,
  TurtleSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "The Power of Functions",
  guid: "973a0fb8-67fa-463d-a12d-0df9f55eb547" as LessonId,
  description:
    "Experience how functions help encapsulate complex ideas to make building programs easier.",
  sections: [
    {
      kind: "Turtle",
      id: "previous-functions" as SectionId,
      title: "Functions Everywhere",
      content: [
        {
          kind: "text",
          value: "",
        },
      ],
      initialCode:
        "import turtle\nt = turtle.Turtle()\n\ndef make_square():\n  for i in range(4):\n    t.forward(100)\n    t.right(90)\n\ndef make_triangle():\n  for i in range(3):\n    t.forward(100)\n    t.left(120)",
      validationCriteria: {
        type: "turtle",
        shape: "square",
        width: 100,
        height: 100,
        expectedJsCommands: [
          {
            name: "left",
            args: [90],
          },
        ],
      },
    } as TurtleSectionData,

    {
      kind: "Information",
      id: "review-intro",
      title: "Practicing with Interleaving",
      content: [
        {
          kind: "text",
          value:
            "Programming is really just four major concepts: variables, functions, loops, and conditionals. This means you are half way through learning everything that is necessary to be a programmer. This begs the question: why does it take years to become a great programmer? The answer is complexity. Almost everything past those core four topics are techniques to make your programs easier to understand and adapt to new problems.\n\nComplexity is the reason that programming is hard. Writing a 100 line program is easy: you can keep everything in your head at once. Writing a 100,000 line program, however is much more difficult. The single most powerful tool that programmers have to reduce complexity is functions. In the lesson, you'll see how functions can be used to encapsulate complex ideas and allow you to reason about a system at a higher level.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
