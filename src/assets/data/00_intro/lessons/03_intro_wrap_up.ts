import type {
  InformationSectionData,
  Lesson,
  LessonId,
  MatchingSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
  SectionId,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Intro Unit Challenge",
  guid: "a2f4b8c3-9d1e-4f3a-b7c9-2e8f5a6d9c4e" as LessonId,
  description:
    "Put together everything you've learned about strings, integers, and print statements to create social media posts.",
  sections: [
    {
      kind: "Information",
      id: "challenge-intro",
      title: "Your First Real Challenge",
      content: [
        {
          kind: "text",
          value:
            "In the previous lessons you learned about strings, integers, and how they behave differently. You've discovered that quotation marks matter, that `+` does different things to different data types, and that computers are very picky about details.\n\nNow comes the real test: can you use what you've learned to solve actual problems? The following challenges aren't meant to be easy. But, the struggle is where the learning happens.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "integer-operations",
      title: "Integer Math",
      content: [
        {
          kind: "text",
          value: "What will be the output of the following code?",
        },
        { kind: "code", value: "print(15 - 3)" },
      ],
      options: ["18", "12", "153", "15 - 3"],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! When you use `-` with integers, it performs subtraction: 15 - 3 = 12.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Testing",
      id: "instagram-likes" as SectionId,
      title: "Instagram Post",
      content: [
        {
          kind: "text",
          value:
            'Create an Instagram post notification program that prints these three lines exactly:\n```\nTaylor liked your photo\n"Great shot!" \n42 others also liked it\n```\n\nWatch out for:\n- The quotation marks around "Great shot!" must appear in the output\n- Each line needs its own print statement\n\nTo check your work, click the `Run Code` button. Once you think your program is ready, click the `Run Tests` button to check that the generated output exactly matches expectations.',
        },
      ],
      example: {
        visualization: "console",
        initialCode: "# Print the three lines exactly as shown\n",
      },
      testCases: [
        {
          input: [null],
          expected:
            'Taylor liked your photo\n"Great shot!"\n42 others also liked it',
          description: "Test Instagram notification format",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "Matching",
      id: "python-ops-match" as SectionId,
      title: "Matching Operations",
      content: [
        {
          kind: "text",
          value:
            "Match each of the following outputs with the bits of code that would result in them:",
        },
      ],
      prompts: [
        { "16": "8 + 8" },
        { '"88"': '"8" + "8"' },
        { "TypeError: unsupported operand type(s) for +": '8 + "8"' },
        { "SyntaxError: unterminated string": '"8" + "8' },
        { "0": "8 - 8" },
        { "TypeError: unsupported operand type(s) for -": '8 - "8"' },
        { "64": "8 * 8" },
        { "1": "8 / 8" },
        { "16777216": "8 ** 8" },
      ],
    } as MatchingSectionData,
    {
      kind: "Testing",
      id: "twitter-retwits" as SectionId,
      title: "Twit Stats",
      content: [
        {
          kind: "text",
          value:
            "Create a twit statistics display. You need to calculate and display retwit math.\n\nPrint exactly:\n```\nYour twit got 15 retwits\nYour friend's twit got 45 retwits\nTotal retwits...\n60\n```\n\nYou must:\n- Use integers for all numbers\n- Calculate 15 + 45 for the total\n- Include the apostrophe in \"friend's\"",
        },
      ],
      example: {
        visualization: "console",
        initialCode:
          "# Create the twit statistics display\n# Remember to calculate the math!\n",
      },
      testCases: [
        {
          input: [null],
          expected:
            "Your twit got 15 retwits\nYour friend's twit got 45 retwits\nTotal retwits...\n60",
          description: "Test twit statistics with calculations",
        },
      ],
      functionToTest: "__main__",
    } as TestingSectionData,
    {
      kind: "MultipleSelection",
      id: "select-the-truth",
      title: "What's the Truth?",
      content: [
        {
          kind: "text",
          value:
            "Which of the following statements are true? Select all that apply.",
        },
      ],
      options: [
        'If you start a string with a `"` you have to end it with a `"`',
        "If you start a string with a `'` you can have a `'` in the middle",
        'There is no difference between "3" and 3',
        '"18" is a string and 77 is an integer',
        "Errors in Python follow a predictable pattern of where and then what",
        "You can use the `+` operator on two strings and also on two integers",
        "You can use the `-` operator on two strings and also on two integers",
      ],
      correctAnswers: [0, 3, 4, 5],
      feedback: {
        correct: "Correct!",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Information",
      id: "challenge-conclusion",
      title: "Conclusion",
      content: [
        {
          kind: "text",
          value:
            "If you made it through all four parts, congratulations. You learned to write programs using print statements, strings, and integers. If you struggled with quotation marks, got `TypeError` messages, or had to count characters on your fingers - that's completely normal. Every programmer has been there. The difference between those who succeed and those who don't isn't talent - it's persistence.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
