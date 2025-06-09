import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
  TestingSectionData,
  LessonId,
  SectionId,
  PRIMMSectionData,
  MultipleChoiceSectionData,
  MatchingSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Strings vs. Integers",
  guid: "65ddff46-b4af-4443-ac0a-5b6a714e405e" as LessonId,
  description: "",
  sections: [
    {
      kind: "Information",
      id: "introduction",
      title: "New Data Types",
      content:
        "In the previous lesson, you learned about strings and how to print them. In this lesson, we'll introduce a new **data type** and explain why it's so important to distinguish between different data types.",
    } as InformationSectionData,

    {
      kind: "Observation",
      id: "print-numbers" as SectionId,
      title: "Integers",
      content:
        "Computers do more than just print words. In fact, computers are most powerful when operating on numbers. Therefore, we need to learn how to use numbers in our programs. We'll start with whole numbers, called **integers** in Python.\n\nIn the example below, there's an example of integers being operated on. Notice in particular, the lack of quotation marks. Run the code and be amazed by how fast computers can do math!",
      example: {
        id: "function-basic",
        title: "Integer Operations",
        code: "print(5)\nprint(5 + 3)\nprint(5 + 3 - 1)\nprint(10000 * 173671)",
      },
    } as ObservationSectionData,
    {
      kind: "PRIMM",
      id: "primm-strings-and-integers" as SectionId,
      title: "Operating on Integers and Strings",
      content:
        'Ok, now for the tricky part! It\'s important to understand the difference between strings and integers because the computer operates on them differently. In particular the string `"5"` is not the same as the integer `5`.\n\nBelow is a simple Python program that will highlight this difference. First, predict what you think the code will do when run and then see if your prediction is correct. Finally, get some help from AI with your answer if need be.',
      examples: [
        {
          id: "primm-quote-issue",
          code: 'print(5 + 5)\nprint("5" + "5")',
          predictPrompt:
            "The two print statements above will print out different things. This is because in one case the `+` is operating on integers and in the other case it's operating on strings. What do you think the will happen when you run the code?",
        },
      ],
      conclusion:
        "When you use `+` with two integers, the result is addition. When you use `+` with two strings, the result is combining (technically called concatenation )",
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "integers-added" as SectionId,
      title: "Operating Integers",
      content:
        "Ok, now it's time to test your intuition: Which of the following is the result of running `print(3 + 4)`. Notice that **both are integers**!",
      options: ["7", "34", "333", "An error"],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct. When you use `+` with two integers, the result is addition.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "strings-added" as SectionId,
      title: "Operating on Strings",
      content:
        'Which of the following is the result of running `print("3" + "4")`. Notice that **both are strings**!',
      options: ["7", "34", "333", "An error"],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct. When you use `+` with two strings, the result is combination.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Observation",
      id: "operations-test" as SectionId,
      title: "Various Operations",
      content:
        "There are a bunch of other operations that you can use on integers and strings. In the space below, experiment with the `-`, `*`, and `**` operations to see what they do to different data types.",
      example: {
        id: "temp-conversion",
        title: "Testing Operations",
        code: 'print(5 + 3)\nprint("5" * 3)',
      },
    } as ObservationSectionData,
    {
      kind: "Matching",
      id: "python-ops-match" as SectionId,
      title: "Matching Operations",
      content:
        "Having undoubtedly done exhaustive experiments in the previous section, match each of the following Python operations with their output:",
      prompts: [
        { id: "p1", text: "5 * 3" },
        { id: "p2", text: '"5" * 3' },
        { id: "p3", text: "5 + 3" },
        { id: "p4", text: '"5" + "3"' },
        { id: "p5", text: '5 + "3"' },
      ],
      options: [
        { id: "C", text: "8" },
        { id: "A", text: "15" },
        { id: "D", text: '"53"' },
        { id: "B", text: '"555"' },
        { id: "E", text: "Error" },
      ],
      solution: {
        p1: "A",
        p2: "B",
        p3: "C",
        p4: "D",
        p5: "E",
      },
    } as MatchingSectionData,
    {
      kind: "Reflection",
      id: "data-type-reflection" as SectionId,
      title: "Data Type Reflection",
      content:
        "Identifying the **data type** that is being operated on is crucial in understanding how Python works. It's the single greatest source of frustration for new people who are learning to code.\n\nCreate a simple 2-3 line code example that demonstrates the different between strings and integers, and write 3-4 sentences explaining how the example works.",
      topic: "Strings vs. Integers",
      isTopicPredefined: true,
      code: "Create a simple example that demonstrates this topic",
      isCodePredefined: false,
      explanation: "Explain how your example works (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "reflection-conclusion",
      title: "Conclusion",
      content:
        "Congratulations on completing the strings vs. integers lesson. As stated above, it is a major source of confusion and frustration. If you ever seen a `TypeError`, take you time and think about what _type_ of things the program is operating on.",
    } as InformationSectionData,
  ],
};

export default lessonData;
