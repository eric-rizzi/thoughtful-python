import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  MultipleSelectionSectionData,
  PRIMMSectionData,
  MatchingSectionData,
  ObservationSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "A Guided Tour: PRIMM",
  guid: "f950d6b1-7c06-485c-8a23-9cd17f72a7ba" as LessonId,
  description:
    "PRIMM is a paradigm for learning programming. It allows you to take small steps from basic understanding all the way up to code creation.",
  sections: [
    {
      kind: "Information",
      id: "thoughtful-intro",
      title: "Thoughtful Intro",
      content:
        "Welcome to _Thoughtful Python_! This website was created by a CS teacher with an interest in how to best teach Programming.\n\nProgramming is difficult! It's probably a bit easier than learning a new language, but it's definitely not easy. It requires a whole new way of thinking and of limiting your vocabulary so one of the dumbest things in the world (a computer) can understand you.",
    } as InformationSectionData,
    {
      kind: "Observation",
      id: "running-code" as SectionId,
      title: "Running Code",
      content:
        "Writing programs is great. Running them is where the power is, though. This website allows you to quickly write, run, and observe programs. It helps you avoid a lot of the annoying set up that you might otherwise have to do. Below is your first program. Don't worry about fully understanding it... just make sure that you can see the output of the program after you click `Run Code`.",
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
        'PRIMM is a particular method for teaching programming developed by various British teachers in the 2000s. They realized that many people struggle to pick up programming because traditionally there\'s very little "scaffolding". It\'s basically just "write this program from scratch". PRIMM (which stands for Predict, Run, Investigate, Modify, Make) is a way of programming that mimics how real engineers work. Very rarely do they create something from scratch. Instead, they start with something that\'s close and then slowly mold it to be what they want.',
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
      solution: { p1: "A", p2: "B", p3: "C", p4: "D", p5: "E" },
    } as MatchingSectionData,
    {
      kind: "Information",
      id: "ai-feedback",
      title: "AI ChatBots",
      content:
        "AI has gotten incredibly good at programming. It is so good that we're of the opinion that **writing code** is no longer that important: the AI will do it for you. **Reading code,** however, has never been more important. Code is something that _controls_ your life; being passive in understanding it puts you at a disadvantage.\n\nThe question is how to use the power of ChatBots. They are very powerful, but they also can make it very difficult to learn because they can just the do the thing for you. The solution seems to be AI with guard-rails.",
    } as InformationSectionData,
    {
      kind: "PRIMM",
      id: "print-primm" as SectionId,
      title: "Using PRIMM on Code",
      content:
        "AI is incredibly powerful and can augment your learning process when used effectively. This website attempts to do that by pairing PRIMM with AI. The result is one of iterative growth where the AI provides feedback and hints when your mental model is off. This type of quick, iterative feedback can help you grow more quickly.\n\nBelow is a PRIMM problem of the code you ran above. To complete the problem, you have to:\n1. Predict what will happen\n2. Run the program\n3. Investigate the output and explain what (if anything) was wrong with your prediction\n4. Correct any mistakes by reading the feedback from the AI\n\nThe key is to be as **specific as possible** in your prediction and interpretation. Only then will the ChatBot be able to help you.",
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
      id: "learning-through-reflection-quiz",
      title: "Getting the Most Out of Reflection",
      content:
        "Which of the following will allow you to get the most out of a PRIMM + AI combo:",
      options: [
        "Be as specific as possible in your prediction",
        "Be as verbose as possible to let the ChatBot know you're smart",
        "Be as honest as possible in your assessment of your certainty",
        "Be as critical as possible in your interpretation",
        "Be as careful as possible when reading the AI's feedback",
      ],
      correctAnswers: [0, 2, 3, 4],
      feedback: {
        correct: "Correct!",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Information",
      id: "primm-wrapup" as SectionId,
      title: "Wrapping Up PRIMM",
      content:
        "Hopefully you can see the power of combining written interpretation of a program with expert-level feedback. By being willing to read the feedback carefully, you will have a 1:1 tutor guiding you towards a better understanding. Being careful with the feedback and thinking about it is probably the best place to spend your time.",
    } as InformationSectionData,
  ],
};

export default lessonData;
