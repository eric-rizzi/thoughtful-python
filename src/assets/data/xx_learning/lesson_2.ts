import type {
  InformationSectionData,
  Lesson,
  LessonId,
  ReflectionSectionData,
  MultipleChoiceSectionData,
  MultipleSelectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Deepen Your Learning: Reflection",
  guid: "3c201468-453b-42f3-a4f6-51a0ad3c93f8" as LessonId,
  description:
    "Without reflection there is no learning. See how this website leverages AI to help you reflect, correct, and internalize new information.",
  sections: [
    {
      kind: "Information",
      id: "reflection-intro",
      title: "The Importance of Reflection",
      content:
        'There is a quote by a famous educational philosopher named John Dewey that sums up the philosophy of this website: "We do not learn from experience. We learn from reflecting on experience." AI provides a new and unique opportunity to engage in optimal learning. This section highlights another powerful tool that this website has in its belt: iterative reflection.',
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "reflection-quiz",
      title: "Why Reflection?",
      content: "Why do you think reflection such a powerful tool in learning?",
      options: [
        "It proves to the teacher that you did the work.",
        "It forces you to retrieve information and organize it in your own words.",
        "It's the fastest way to get through a lesson.",
        "It allows you to skip the parts of the code you don't understand.",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Re-organizing and explaining concepts is a proven way to build stronger, more durable knowledge.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "reflection-analysis",
      title: "The Importance of Reflection",
      content:
        'As with PRIMM, AI has the potential to super-charge reflection for learning. This is because it can provide quick feedback on any mistakes you have. In addition, they can provide a "speed bump" to make you slow down and take the reflection seriously. Below is an example Reflection Section similar to ones that you will encounter in other units. It works by:\n1. Having you choose a topic (it\'s been set to `Print Statements`)\n2. Having you create a small snippet of code (also set)\n3. Have you explain how the code works\n4. Asking the ChatBot if there is any room for improvement\n\nThe section forces you to iterate with a ChatBot to improve your code/text until you demonstrate sufficient understanding. Annoying? Yes! Effective? Also yes! Try it out below.',
    } as InformationSectionData,
    {
      kind: "Reflection",
      id: "reflection-reflection",
      title: "Using Reflection for Learning",
      content:
        "Explain in your own words what the following snippet of code will print out.",
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
        "Which of the following will allow you to get the most out of a Reflection + AI combo:",
      options: [
        "Being hasty so you can get to the next lesson quickly",
        "Being honest in identifying things you don't understand",
        "Being careful in constructing the simplest example possible",
        "Being specific as you discuss important parts of the example",
        "Being open to feedback from the AI",
      ],
      correctAnswers: [1, 2, 3, 4],
      feedback: {
        correct:
          "Correct! Reflection is work, but it's work that will solidify your understanding of difficult topics.",
      },
    } as MultipleSelectionSectionData,
    {
      kind: "Information",
      id: "reflection-wrap-up",
      title: "Wrapping Up Reflection",
      content:
        "That's it! Hopefully you now understand what the website is trying to do and why. If you predict specifically, interpret critically, and reflect honestly, you'll be well on your way to becoming a great programmer.",
    } as InformationSectionData,
  ],
};

export default lessonData;
