import type {
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
  MultipleChoiceSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Best Practice",
  guid: "dbd45993-6473-4df3-959a-04b7289a229e" as LessonId,
  description:
    "Learning is a well researched process. Understand what best practices are and how this website aligns with them.",
  sections: [
    {
      kind: "Information",
      id: "python-history",
      title: "The History of Python",
      content:
        "Welcome to _Thoughtful Python_! This website was created by a teacher with an interest in how to best teach Programming.\n\nProgramming is difficult! It's a new kind of thinking. It's probably a bit easier than learning a new language, but it's definitely not easy. It requires a whole new way of thinking and of limiting your vocabulary so one of the dumbest things in the world (a computer) can understand you.",
    } as InformationSectionData,
    {
      kind: "Information",
      id: "print-function" as SectionId,
      title: "Learning Best Practices",
      content:
        "Learning itself is a complex process. Luckily, there are some known best-practices that will help you learn and retain knowledge more effectively. My hope is not only that you learn about programming, but you also learn what if feels like to learn. This will allow you to push yourself into a good mental state when you really care about something. The core techniques for learning are: _spaced-practice_, _interleaving_, _retrieval-practice_, _elaboration_, _concrete examples_, and _dual coding_.",
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "what-is-a-string" as SectionId,
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
      id: "reading-for-understanding" as SectionId,
      title: "Active Reading is Hard",
      content:
        "I'm going to bet that a significant number of you only read the `Learning Best Practices` section once you realized that there was a quiz on it. In fact, I'm betting only a small number of you are reading this section now. This is because _just_ reading information and learning from it is hard. Therefore, this course will minimize the passive text and maximize the active processes.",
    } as InformationSectionData,
    {
      kind: "MultipleChoice",
      id: "what-is-a-string" as SectionId,
      title: "Anyone There?",
      content: "Did you read the above section carefully?",
      options: ["Yes", "No"],
      correctAnswer: 0,
      feedback: {
        correct: "Correct (and hopefully honest) answer!",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "what-is-a-string" as SectionId,
      title: "Learning Through Interleaving",
      content:
        "This course relies heavily on _interleaving_ throughout all of the lessons to ingrain important concepts in your head. _Interleaving_ is the process of mixing up the types of problems you're working on. An example would be in math where, instead of doing all your addition problems, then all of your multiplication problems, then all of your division problems, you mix them up. This has the dual benefit of teaching you the operation (`+`, `/`, `*`) AND teaching you how to identify when to use the operation.\n\nBased on this explanation, how do you think this website will utilize _interleaving_?",
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
      id: "what-is-a-string-again",
      title: "Learning Through Retrieval Practice",
      content:
        '_Retrieval practice_ is the process of "bringing learned information to mind from long-term memory". It basically is improving your ability to recall and use information that you learned before. Retrieval practice is **very** important for programming. This is because you need to remember/utilize a lot of different pieces of information to write a useful program.\n\nSince this topic is about retrieval practice, which of the following topics would require you to retrieve knowledge you already learned?',
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
      id: "learning-through-spaced-practice",
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
      kind: "Information",
      id: "reading-for-understanding" as SectionId,
      title: "Wrapping Up Best Practices",
      content:
        "We're not going to go into all of the best practices in teaching. The hope is that you realize that this website takes your learning seriously and scientifically. The techniques above can help you approach pretty much anything you want to learn. In the next lesson we will talk about how this website approaches CS problems in particular.",
    } as InformationSectionData,
  ],
};

export default lessonData;
