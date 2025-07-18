import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  TestingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Unit Challenge: Social Media Post Generator",
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
            "Alright, you've made it through the first unit. You've learned about strings, integers, and how they behave differently. You've discovered that quotation marks matter, that `+` does different things to different data types, and that computers are very picky about details.\n\nNow comes the real test: can you use what you've learned to solve actual problems?\n\nThis challenge isn't meant to be easy. Programming rarely is. But here's the thing - the struggle is where the learning happens. When you get stuck (and you will), that's not failure. That's your brain building new connections.\n\nYour task is to create various social media posts using only print statements and careful attention to strings and integers. No variables yet - just pure, careful construction of output.",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Testing",
      id: "instagram-likes" as SectionId,
      title: "Challenge Part 1: Instagram Post",
      content: [
        {
          kind: "text",
          value:
            'Create an Instagram post notification. Print these three lines exactly:\n```\nTaylor liked your photo\n"Great shot!" \n42 others also liked this\n```\n\nWatch out for:\n- The quotation marks around "Great shot!" must appear in the output\n- The number 42 should be an integer, not a string\n- Each line needs its own print statement',
        },
      ],
      example: {
        id: "instagram-challenge",
        title: "Create the Instagram Notification",
        code: "# Print the three lines exactly as shown\n",
        testCases: [
          {
            input: null,
            expected:
              'Taylor liked your photo\n"Great shot!"\n42 others also liked this',
            description: "Test Instagram notification format",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Testing",
      id: "twitter-retweets" as SectionId,
      title: "Challenge Part 2: Tweet Stats",
      content: [
        {
          kind: "text",
          value:
            "Create a tweet statistics display. You need to calculate and display retweet math.\n\nPrint exactly:\n```\nYour tweet got 15 retweets\nYour friend's tweet got 45 retweets\nThat's 60 total retweets!\nDifference: 30 retweets\n```\n\nYou must:\n- Use integers for all numbers\n- Calculate 15 + 45 for the total\n- Calculate 45 - 15 for the difference\n- Include the apostrophe in \"friend's\"",
        },
      ],
      example: {
        id: "twitter-challenge",
        title: "Create Tweet Statistics",
        code: "# Create the tweet statistics display\n# Remember to calculate the math!\n",
        testCases: [
          {
            input: null,
            expected:
              "Your tweet got 15 retweets\nYour friend's tweet got 45 retweets\nThat's 60 total retweets!\nDifference: 30 retweets",
            description: "Test tweet statistics with calculations",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Testing",
      id: "youtube-stats" as SectionId,
      title: "Challenge Part 3: YouTube Video Stats",
      content: [
        {
          kind: "text",
          value:
            "Create a YouTube video statistics display that shows:\n```\n\"How to Solve a Rubik's Cube\" by Alex Chen\nViews: 1000000\n1000 x 1000 = 1000000 views!\nLikes: 50000\nThat's 20 x 2500 likes\n```\n\nThis tests:\n- Mixing single and double quotes properly\n- Using multiplication with integers\n- Showing the math that creates the numbers",
        },
      ],
      example: {
        id: "youtube-challenge",
        title: "Create YouTube Statistics",
        code: "# Build the YouTube stats display\n# Show your multiplication work!\n",
        testCases: [
          {
            input: null,
            expected:
              "\"How to Solve a Rubik's Cube\" by Alex Chen\nViews: 1000000\n1000 x 1000 = 1000000 views!\nLikes: 50000\nThat's 20 x 2500 likes",
            description: "Test YouTube statistics format",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Testing",
      id: "tiktok-challenge" as SectionId,
      title: "Challenge Part 4: TikTok Hashtag Analyzer",
      content: [
        {
          kind: "text",
          value:
            'Final challenge - create a TikTok hashtag analysis. Output exactly:\n```\n#ThrowbackThursday trending\n"#TBT" is the short version\n#ThrowbackThursday = 17 characters\n#TBT = 4 characters  \nYou saved 13 characters!\nBonus stat: 17 - 4 = 13\n```\n\nThis is tricky because:\n- Hashtags are just part of the strings\n- You need quotes around "#TBT" in the output\n- All math must be done with actual integers\n- The format must be exact',
        },
      ],
      example: {
        id: "tiktok-challenge",
        title: "Create TikTok Hashtag Analysis",
        code: "# Create the complete hashtag analysis\n# Pay attention to every detail!\n",
        testCases: [
          {
            input: null,
            expected:
              '#ThrowbackThursday trending\n"#TBT" is the short version\n#ThrowbackThursday = 17 characters\n#TBT = 4 characters\nYou saved 13 characters!\nBonus stat: 17 - 4 = 13',
            description: "Test TikTok hashtag analysis",
          },
        ],
        functionToTest: "__main__",
      },
    } as TestingSectionData,
    {
      kind: "Information",
      id: "challenge-conclusion",
      title: "Reflection on Struggle",
      content: [
        {
          kind: "text",
          value:
            "If you made it through all four parts, congratulations. Seriously. You just built something real using only print statements, strings, and integers. No variables to help you store things. No shortcuts. Just careful, precise coding.\n\nIf you struggled with quotation marks, got TypeError messages, or had to count characters on your fingers - that's completely normal. Every programmer has been there. The difference between those who succeed and those who don't isn't talent - it's persistence.\n\nWhat you've learned:\n- How to manage complex quotation mark situations\n- How to perform calculations inline with print statements  \n- How to match exact specifications (every space and character matters!)\n- How to build up from simple to complex without variables to help\n\nIn the next unit, variables will make tasks like these much easier. Instead of typing \"#ThrowbackThursday\" multiple times, you'll be able to store it once and reuse it. But first, take a moment to appreciate what you've accomplished. You're thinking like a programmer now.",
        },
      ],
    } as InformationSectionData,
  ],
};

export default lessonData;
