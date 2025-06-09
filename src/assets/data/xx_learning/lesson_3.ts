import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  MultipleChoiceSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "The Science Behind Our Method",
  guid: "dbd45993-6473-4df3-959a-04b7289a229e" as LessonId,
  description:
    "Learning is a well researched process. Understand what best practices are and how this website aligns with them.",
  sections: [
    {
      kind: "Information",
      id: "thoughtful-intro",
      title: "Why This Works",
      content:
        "You've just experienced the core learning strategies of this website: PRIMM and Reflection. These aren't random activities; they are based on well-researched best practices for learning complex skills. Understanding these practices will not only help you get the most out of this site, but will help you learn anything more effectively. The core techniques for learning are: _spaced-practice_, _interleaving_, _retrieval-practice_, _elaboration_, _concrete examples_, and _dual coding_.",
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "best-practice-quiz" as SectionId,
      title: "Not Best Practice?",
      content:
        "Which of the following **is not** one of the learning best-practices?",
      options: [
        "Elaboration",
        "Spaced Practice",
        "Timed Focus",
        "Interleaving",
        "Concrete Examples",
      ],
      correctAnswer: 2,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "active-reading" as SectionId,
      title: "Active Reading is Hard",
      content:
        "I'm going to bet that a fair number had to go back and reread the `Learning Best Practices` section when you realized that there was a quiz on it. This is because _just_ reading information and learning from it is hard. Therefore, this course will minimize the passive text and maximize active learning processes.",
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "interleaving-quiz" as SectionId,
      title: "Learning Through Interleaving",
      content:
        "This site relies heavily on _interleaving_ to ingrain important concepts in your head. _Interleaving_ is a learning technique where you mix up the types of problems you're working on. An example would be in math where, instead of doing all the addition problems, then all the multiplication problems, then all the division problems, you mix them up. This has the dual benefit of teaching you the operation (`+`, `/`, `*`) AND teaching you how to identify when to use the operation.\n\nBased on this explanation, how do you think this website will utilize _interleaving_?",
      options: [
        "By having quizzes only the most important topic at the the end of lesson",
        "By asking questions about the material in the order it's presented",
        "By having review sections that mix up important topics in varying orders",
      ],
      correctAnswer: 2,
      feedback: {
        correct: "Correct!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "retrieval-practice-quiz",
      title: "Learning Through Retrieval Practice",
      content:
        '_Retrieval practice_ is the process of "bringing learned information to mind from long-term memory". It is a technique that improves your ability to recall and use information that you learned before. Retrieval practice is **very** important for programming. This is because you need to remember/utilize a lot of different pieces of information to write a useful program.\n\nSince this topic is about retrieval practice, which of the following topics would require you to retrieve knowledge you already learned?',
      options: [
        "Remembering that retrieval practice is about practicing remembering previously learned information",
        "Remembering that interleaving is about mixing up the order that your review topics in",
        "Predicting that elaboration is about strengthening your mental model by looking for connections",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Short-term memory is different from long-term memory. Continually returning to old lessons increases the chances they will be useful.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "spaced-practice-quiz",
      title: "Learning Through Spaced Practice",
      content:
        "_Spaced practice_ is basically forcing yourself not to cram. It's very similar to _retrieval practice_ but, whereas _retrieval practice_ is about increasing the number of times you access information in your long-term memory, _spaced practice_ is about making sure your practice over a long period of time. It's a bit like the gym: you can go and try and do every exercise in a single day, but you'll get much better results if your make a habit of going.\n\nBased on this explanation what do you think the optimal strategy is if you have seven problems due next week.",
      options: [
        "Do them all now so you can relax",
        "Do them all at the last minute so it will be fresh",
        "Do one a day so you practice recalling the information",
        "Change strategies over time to keep yourself on your toes",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! Practicing retrieval from your long-term memory is both about number of reps AND about spacing over time.",
      },
    } as MultipleChoiceSectionData,

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
      id: "best-practice-wrap-up" as SectionId,
      title: "Wrapping Up",
      content:
        "Real learning isn't easy. It's an active process that requires effort. If you're willing to put forth the effort, however, this website provides you the opportunity to learn more effectively and deeply. Good luck!",
    } as InformationSectionData,
  ],
};

export default lessonData;
