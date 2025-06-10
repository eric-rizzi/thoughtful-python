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
        'There is a quote by a famous educational philosopher named John Dewey that sums this website\'s approach: "We do not learn from experience. We learn from reflecting on experience." AI provides a new and unique opportunity to engage in reflective learning. This section showcases another powerful learning tool that this website has in its tool belt: reflection.',
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
        "Reflecting on things that you struggled with and then forcing yourself to articulate **why** you struggled is an incredibly powerful learning tool. This form of \"journaling\" can then form a record of everything you've learned in case you forget or get stuck sometime later. These types of journals are considered best practice for anyone who takes their learning seriously: think of a scientist's notebook or writer's journal.\n\nAs with PRIMM, AI has the potential to super-charge reflection. This is because it can provide quick feedback on your mistakes. In addition, it can provide a \"speed bump\" to make you slow down and take the reflection seriously. Below is an example reflection section. It works by:\n1. Having you choose a topic (it's been set to `Print Statements`)\n2. Having you create a small snippet of code (also set)\n3. Having you explain how the code works\n4. Asking the AI if there is any room for improvement\n\nThe section forces you to iterate with AI to improve your code/text until you demonstrate deep understanding. Annoying? A bit! Effective? Definitely! Try it out below.",
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
        "That's it! Hopefully you can appreciate why this website pushes you towards reflection so strongly. Deep learning isn't easy and the website is designed to help you nudge you towards expanding your own understanding. If you predict specifically, interpret critically, and reflect honestly, you'll be well on your way to becoming a great programmer.",
    } as InformationSectionData,
  ],
};

export default lessonData;
