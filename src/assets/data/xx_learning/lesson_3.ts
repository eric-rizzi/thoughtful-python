import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  MultipleChoiceSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "The Science Behind Our Method",
  guid: "dbd45993-6473-4df3-959a-04b7289a229e" as LessonId, // Kept original GUID
  description:
    "Now that you've used PRIMM and Reflection, let's explore the learning science that makes them effective.",
  sections: [
    {
      kind: "Information",
      id: "thoughtful-intro",
      title: "Why This Works",
      content:
        "You've just experienced the core learning loops of this website: PRIMM and Reflection. These aren't random activities; they are based on well-researched best practices for learning complex skills. Understanding these practices will not only help you get the most out of this site, but will help you learn anything more effectively.",
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "primm-best-practice-quiz",
      title: "PRIMM and Best Practices",
      content:
        "The **Predict** step in PRIMM is a powerful form of which learning best-practice? It asks you to bring information to mind *before* you see the answer.",
      options: ["Interleaving", "Retrieval Practice", "Dual Coding"],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! The act of predicting forces you to retrieve what you already know (or think you know) from memory, which is a powerful way to strengthen it.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "reflection-best-practice-quiz",
      title: "Reflection and Best Practices",
      content:
        "The **Reflection** section, where you write an explanation of a code snippet in your own words, is a prime example of which learning best-practice?",
      options: ["Elaboration", "Spaced Practice", "Interleaving"],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct! Elaboration is the process of explaining and describing ideas with many details. It involves connecting new ideas to what you already know, which is exactly what you do in a good reflection.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "learning-best-practices" as SectionId,
      title: "Other Best Practices Used Here",
      content:
        "This website also relies heavily on other best practices you'll see throughout the lessons:",
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "interleaving-quiz" as SectionId,
      title: "Learning Through Interleaving",
      content:
        "_Interleaving_ is the process of mixing up the types of problems you're working on. Instead of doing 10 addition problems and then 10 multiplication problems, you mix them up. This teaches you how to identify which strategy to use. How might this website use interleaving?",
      options: [
        "By having review sections that mix up important topics from different lessons.",
        "By having quizzes only on the most important topic at the the end of lesson.",
        "By asking questions about the material in the order it's presented.",
      ],
      correctAnswer: 0,
      feedback: {
        correct:
          "Correct! Mixing up different concepts in review helps you build more flexible and durable knowledge.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "spaced-practice-quiz",
      title: "Learning Through Spaced Practice",
      content:
        "_Spaced practice_ is the opposite of cramming. It's about practicing over a longer period of time. It's like going to the gym: it's better to go for an hour three times a week than for three hours straight once a week. Based on this, what's the best way to approach the lessons on this site?",
      options: [
        "Do them all in one sitting to get them done.",
        "Do one lesson every day or every few days.",
        "Wait until the day before a test to review everything.",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Spacing out your learning over time is a proven way to build long-term retention.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "best-practice-wrap-up" as SectionId,
      title: "Wrapping Up",
      content:
        "Now you know the 'secret sauce' behind this website's design. By engaging honestly with the PRIMM and Reflection activities, you are automatically using scientifically-backed methods to learn more effectively. Good luck!",
    } as InformationSectionData,
  ],
};

export default lessonData;
