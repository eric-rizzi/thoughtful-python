import type {
  InformationSectionData,
  Lesson,
  ObservationSectionData,
  LessonId,
  SectionId,
  MultipleSelectionSectionData,
  PRIMMSectionData,
  MatchingSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "PRIMM",
  guid: "f950d6b1-7c06-485c-8a23-9cd17f72a7ba" as LessonId,
  description:
    "PRIMM is a paradigm for learning programming. It scaffolds from based understanding all the way up to code creation.",
  sections: [
    {
      kind: "Observation",
      id: "running-code" as SectionId,
      title: "Running Code",
      content:
        "Writing code is great. Running it is where the power is, though. This website allows your to quickly write, run, and observe programs. It helps you avoid a lot of the annoying set up that you might otherwise have to do. Below is your first program. Don't worry about fully understanding it... just make sure that you can see the output of the program after you click `Run Code`.",
      example: {
        id: "hello-world1",
        title: "Hello, World",
        code: 'print("Hello, World!")\nprint("Can I call myself a programmer now?")',
      },
    } as ObservationSectionData,
    {
      kind: "Information",
      id: "primm-history",
      title: "The History of PRIMM",
      content:
        'PRIMM is a particular method for teaching programming developed by various British teachers. They realized that many people struggle to pick up programming because traditionally there\'s very little "scaffolding". It\'s basically just "write this program from scratch". PRIMM (which stands for Predict, Run, Interpret, Modify, Make) is a way of approaching new problems that models the real world. Very rarely in the real world do you create something from scratch. Instead, you start with something that\'s close and then slowly mold it to be what you want.',
    } as InformationSectionData,
    {
      kind: "Matching",
      id: "primm-quiz" as SectionId,
      title: "Matching PRIMM",
      content: "Match each part of PRIMM with its purpose:",
      prompts: [
        { id: "p1", text: "PREDICT" },
        { id: "p2", text: "RUN" },
        { id: "p3", text: "INVESTIGATE" },
        { id: "p4", text: "MODIFY" },
        { id: "p5", text: "MAKE" },
      ],
      options: [
        { id: "B", text: "Compare your understanding with the actual results" },
        { id: "A", text: "Force yourself to try and understand a program" },
        { id: "E", text: "Challenge yourself to implement your own ideas" },
        { id: "D", text: "Challenge yourself to expand on the existing ideas" },
        { id: "C", text: "Correct any mistakes in your mental model" },
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
      kind: "Information",
      id: "ai-feedback",
      title: "AI ChatBots",
      content:
        "AI has gotten incredibly good at programming. It is so good that I've become of the opinion that **writing code** is no longer that important: the AI will do it for you. **Reading code,** however, has never been more important. Code is something that _controls_ your life and being passive in understanding it puts you at a disadvantage.\n\nThe question is how to use the power of the ChatBots. They are very powerful, but they also can make it very difficult to learn because they just the thing for you. The solution seems to be AI with guard-rails.",
    } as InformationSectionData,
    {
      kind: "PRIMM",
      id: "print-primm" as SectionId,
      title: "Using PRIMM on Code",
      content:
        "AI is incredibly powerful and can augment your learning process when used effectively. This website attempts to do that by pairing AI with PRIMM. The result is that AI provides feedback and hints when your mental model is off. This can catch inconsistencies in your thinking and help you grow more quickly.\n\nBelow is a PRIMM problem of the code above. To properly execute it, you have to:\n1. Predict what will happen\n2. Run the program\n3. Investigate the program and explain what (if anything) was wrong\n4. Meld the feedback from the AI with your understanding\nThe key is to be as **specific as possible* in your prediction and interpretation. Only then will the ChatBot be able to help you.",
      examples: [
        {
          id: "primm-quote-issue",
          code: 'print("Hello, World!")\nprint("Can I call myself a programmer now?")',
          predictPrompt: "What do you think the program will print out?",
        },
      ],
      conclusion:
        "PRIMM increases learning by making you read code carefully and then confront anything you got wrong",
    } as PRIMMSectionData,
    {
      kind: "MultipleSelection",
      id: "learning-through-primm",
      title: "Getting the Most Out of PRIMM",
      content:
        "Which of the following which allow you to get the most of an AI/PRIMM combo:",
      options: [
        "Be as specific as possible in your prediction",
        "Be as verbose as possible to let the ChatBot know you're smart",
        "Be as honest as possible in your assessment of your certainty",
        "Be as critical as possible in your interpretation",
        "Be as careful as possible when reading the AI's feedback",
      ],
      correctAnswers: [0, 2, 3],
      feedback: {
        correct:
          "Correct! Practicing retrieval from your long-term memory is both about number of reps AND about spacing over time.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Information",
      id: "primm-wrapup" as SectionId,
      title: "Wrapping Up PRIMM",
      content:
        "Hopefully you can see the power of combining written interpreting of a program with expert-level feedback. By being willing to read the feedback carefully, you will have essentially a 1:1 tutor guiding you towards a better understanding.\n\nAs said in the section above, reading for understanding is hard. Being careful with the feedback and thinking about it is probably the best place to spend your time.",
    } as InformationSectionData,
  ],
};

export default lessonData;
