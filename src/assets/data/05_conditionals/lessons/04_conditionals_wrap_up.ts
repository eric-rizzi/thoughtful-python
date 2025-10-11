import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  MultipleChoiceSectionData,
  TestingSectionData,
} from "../../../../types/data";

const lessonData: Lesson = {
  title: "Conditionals Unit Challenge",
  guid: "14f3ba03-2020-44e6-b68d-ae8dde46da7e" as LessonId,
  description:
    "Test your understanding of conditionals (plus other topics) with a variety of practice problems and challenges.",
  sections: [
    {
      kind: "Information",
      id: "review-intro",
      title: "Conditionals Practice",
      content: [
        {
          kind: "text",
          value: "",
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "string-operations",
      title: "String Concatenation",
      content: [
        {
          kind: "text",
          value: "What will be the output of the following code?",
        },
        { kind: "code", value: 'print("cat" + "dog")' },
      ],
      options: ["catdog", "cat dog", "cat + dog", "An error"],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct! When you use `+` with strings, it concatenates (joins) them together with no space in between.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "string-practice" as SectionId,
      title: "Challenge: Quote Master",
      content: [
        {
          kind: "text",
          value:
            'Write a program that prints out the following three lines exactly as shown:\n1. `The teacher said, "Good job!"`\n2. `It\'s going to be a great day.`\n3. `"Why?" she asked.`\n\nRemember to think carefully about which type of quotes to use for each line!',
        },
      ],
      example: {
        id: "quote-challenge",
        title: "Print the Quotes",
        code: "# Write your three print statements here",
        testCases: [
          {
            input: null,
            expected:
              'The teacher said, "Good job!"\nIt\'s going to be a great day.\n"Why?" she asked.',
            description: "Test that all three quotes are printed correctly",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Information",
      id: "review-conclusion",
      title: "The Power of Interleaving",
      content: [
        {
          kind: "text",
          value:
            "Excellent job working through these interleaved practice problems! By mixing questions about strings, integers, and variables together, your brain had to actively recall and apply different concepts rather than just following a single pattern. This type of practice - where you switch between related topics - has been proven to create stronger, more durable learning.\n\nYou've demonstrated your understanding of all the foundational concepts and you're ready to move on to more advanced topics!",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
