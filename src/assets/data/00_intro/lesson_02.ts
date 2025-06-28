import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
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
  description:
    "Understand the types of data that computers can operate on and see what can happen if you accidentally mix them up.",
  sections: [
    {
      kind: "Information",
      id: "introduction",
      title: "New Data Types",
      content: [
        {
          kind: "text",
          value:
            "In the previous lesson, you learned about strings and how to print them. In this lesson, we'll introduce a new **data type** and explain why it's so important to distinguish between different data types.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "print-numbers" as SectionId,
      title: "Integers",
      content: [
        {
          kind: "text",
          value:
            "Computers do more than just print words. In fact, computers are most powerful when operating on numbers. Therefore, we need to learn how to use numbers in our programs. We'll start with whole numbers, which Python calls **integers**.\n\nIn the example below, there's a bunch of integers being operated on. Notice in particular, the lack of quotation marks. Run the code code. Pay attention to what happens when you use the `+` and `*` operators on different **integers**.",
        },
      ],
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
      content: [
        {
          kind: "text",
          value:
            'Ok, now for the tricky part! It\'s important to understand the difference between strings and integers because the computer **operates on them differently**. In particular the **string** `"5"` is not the same as the **integer** `5`.\n\nBelow is a simple Python program that will highlight this difference. First, predict what you think the code will do and then investigate whether your prediction is correct. Be sure to read the AI response afterwards very carefully if your prediction was incorrect.',
        },
      ],
      examples: [
        {
          id: "primm-quote-issue",
          code: 'print(5 + 5)\nprint("5" + "5")',
          predictPrompt:
            "The two print statements above will print out different things. This is because in one case the `+` is operating on integers and in the other case it's operating on strings. What do you think the will happen when you run the code?",
        },
      ],
      conclusion:
        "When you use `+` with two integers, the result is addition. When you use `+` with two strings, the result is combining (technically called concatenation)",
    } as PRIMMSectionData,
    {
      kind: "MultipleChoice",
      id: "integers-added" as SectionId,
      title: "Operating Integers",
      content: [
        {
          kind: "text",
          value:
            "Ok, now it's time to test your intuition: Which of the following is the result of running `print(3 + 4)`. Notice that **both are integers**!",
        },
      ],
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
      content: [
        {
          kind: "text",
          value:
            'Which of the following is the result of running `print("3" + "4")`. Notice that **both are strings**!',
        },
      ],
      options: ["7", "34", "333", "An error"],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct. When you use `+` with two strings, the result is concatenation.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "PRIMM",
      id: "primm-type-error" as SectionId,
      title: "Data Type Mixup",
      content: [
        {
          kind: "text",
          value:
            'Now the question is what happens when you accidentally operate on a string and an integer? Below is a simple Python program that has this issue: the `3` is an integer but the `"4"` is a string. First, predict what you think the code will do and then investigate whether your prediction is correct. Be sure to read the AI response afterwards very carefully if your prediction was incorrect.',
        },
      ],
      examples: [
        {
          id: "primm-type-issue",
          code: 'print(3 + "4")',
          predictPrompt:
            "We are trying to do use the `+` operator on a string and an integer. What do you think will happen when you run the code?",
        },
      ],
      conclusion:
        "Error messages can be overwhelming! Read the next section carefully for how to approach them.",
    } as PRIMMSectionData,
    {
      kind: "Information",
      id: "understanding-type-errors" as SectionId,
      title: "Understanding TypeErrors",
      content: [
        {
          kind: "text",
          value:
            "Getting errors while you're writing a program is very common. This is likely the first error you've encountered but it definitely won't be the last. Learning how to interpret them now will save you **a ton of time** later.\n\nLook carefully at the last line of the error. The line is communicating that are trying to do an operation (`+`) that can't handle two different data types. This makes sense since the original, offending like was `print(3 + 4)`",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "operations-test" as SectionId,
      title: "Various Operations",
      content: [
        {
          kind: "text",
          value:
            'There are a bunch of other operations that you can use on integers and strings. In the space below, experiment with the `+`, `-`, and `*` operations to see what they do to different data types. In particular, be sure to experiment with the following bits of code:\n- `5 + 3` vs. `"5" + "3"`\n- `5 * 3` vs. `"5" * 3`\n- `5 - 3` vs. `"5" - "3"`',
        },
      ],
      example: {
        id: "temp-conversion",
        title: "Testing Operations",
        code: "print(5 + 3)",
      },
    } as ObservationSectionData,
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
        { id: "p1", text: "5 + 3" },
        { id: "p2", text: '"5" + "3"' },
        { id: "p3", text: '5 + "3"' },
        { id: "p4", text: "5 - 3" },
        { id: "p5", text: '5 - "3"' },
      ],
      options: [
        { id: "A", text: "2" },
        { id: "B", text: "8" },
        { id: "C", text: '"53"' },
        { id: "D", text: "TypeError: unsupported operand type(s) for +" },
        { id: "E", text: "TypeError: unsupported operand type(s) for -" },
      ],
      solution: {
        p1: "B",
        p2: "C",
        p3: "D",
        p4: "A",
        p5: "E",
      },
    } as MatchingSectionData,
    {
      kind: "Reflection",
      id: "data-type-reflection" as SectionId,
      title: "Data Type Reflection",
      content: [
        {
          kind: "text",
          value:
            "Identifying the **data type** that is being operated on is crucial in understanding how Python works. It's the single greatest source of frustration for new people who are learning to code.\n\nCreate a simple 2-3 line code example that demonstrates the different between strings and integers, and write 3-4 sentences explaining how the example works.",
        },
      ],
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
      content: [
        {
          kind: "text",
          value:
            "Congratulations on completing the strings vs. integers lesson. As stated above, it is a major source of confusion and frustration. If you ever seen a `TypeError`, take you time and think about what _type_ of things the program is operating on.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
