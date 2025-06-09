import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  MultipleSelectionSectionData,
  ReflectionSectionData,
  MultipleChoiceSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "PRIMM + Reflection",
  guid: "3c201468-453b-42f3-a4f6-51a0ad3c93f8" as LessonId,
  description:
    "Without reflection there is no learning. See how this website leverages AI to help you reflect, correct, and internalize new information.",
  sections: [
    {
      kind: "Information",
      id: "reflection-intro",
      title: "The Importance of Reflection",
      content:
        'There is a quote by a quote by a famous educational philosopher named John Dewey that sums up the philosophy of this website: "We do not learn from experience. We learn from reflecting on experience." AI provides a new and unique opportunity to engage in optimal learning. This final section of the introduction discusses the most powerful tool that this website has in it\'s belt: iterative reflection.',
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "reflection-quiz",
      title: "Why Reflection?",
      content: "Why is reflection such a powerful tool in learning?",
      options: [
        "It captures what your understanding",
        "It does a thing",
        "It does another thing",
      ],
      correctAnswer: 1,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "reflection-analysis",
      title: "The Importance of Reflection",
      content:
        'As with PRIMM, ChatBots have a the potential to super-charge reflection for learning. This is because they can provide quick feedback on any mistakes your have. In addition, they can provide a "bar" to make sure you are taking the reflection seriously. Below there is an example Reflection Section similar to ones that will pop up in other units. It works by:\n1. Having you choose a topic\n2. Having you create a small snippet of code\n3. Have you explain how the code works\n4. Asking the ChatBot if there is any room for improvement\n\nThe section enforces a bar of "mostly" understanding by having you iterate with the ChatBot to improve your code/text. It will force you to keep improving your explanation until your get it right. Annoying? Yes! Effective? Also yes! Try it out below.',
    } as InformationSectionData,
    {
      kind: "Reflection",
      id: "reflection-reflection",
      title: "Using Reflection for Learning",
      content:
        "Explain in your own words what the following snippet of code will print out",
      topic: "Print Statements",
      isTopicPredefined: true,
      code: 'print("Hello, World!")\nprint("Can I call myself a programmer now?")',
      isCodePredefined: true,
      explanation: "Explain how your example works (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "MultipleSelection",
      id: "learning-through-reflection-quiz",
      title: "Getting the Most Out of Reflection",
      content:
        "Which of the following which allow you to get the most of an AI/Reflection combo:",
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
      id: "reflection-wrap-up" as SectionId,
      title: "Wrapping Up Reflection",
      content:
        "That's it! Hopefully you now understand what the website is trying to do and why. If you predict specifically, interpret critically, and reflect honestly, you'll be well on your way to becoming a great programmer.",
    } as InformationSectionData,
  ],
};

export default lessonData;
