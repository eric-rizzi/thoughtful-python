import type { Lesson, ReflectionSectionData } from "../../../types/data";

const lessonData: Lesson = {
  title: "Reflection and Self-Assessment",
  guid: "ab5bed79-7662-423e-90ef-952539f59099",
  description:
    "Demonstrate your understanding by creating and explaining a Python code example on a topic of your choice.",
  sections: [
    {
      kind: "Information",
      id: "reflection-intro",
      title: "Introduction to Reflection",
      content:
        "Reflection is a powerful learning tool that helps solidify your understanding. In this lesson, you will choose a topic from the previous lessons, create a code example, and explain how it works.\n\nYou'll receive feedback from an AI assistant that will help you improve your understanding and expression of Python concepts.",
    },
    {
      kind: "Reflection",
      id: "python-reflection",
      title: "Python Concept Reflection",
      content:
        "Choose a topic from the previous lessons that you found interesting or challenging. Create a simple code example that demonstrates this concept, and write 3-4 sentences explaining how the code works.",
      topic: "For Loops",
      isTopicPredefined: true,
      code: "Create a simple example that demonstrates this topic",
      isCodePredefined: false,
      explanation: "Explain how your example works (3-4 sentences)",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "reflection-conclusion",
      title: "Conclusion",
      content:
        "Congratulations on completing the Python in the Browser course! You've learned fundamental Python concepts, practiced coding, and now demonstrated your understanding through reflection.\n\nRemember that learning to code is a journey - continue practicing and building projects to strengthen your skills.",
    },
  ],
};

export default lessonData;
