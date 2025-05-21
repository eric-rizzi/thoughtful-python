import type {
  Lesson,
  MultipleChoiceSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Conditionals Review",
  description:
    "Reflect on key concepts related to `if`, `else`, `elif`, and nested conditionals.",
  sections: [
    {
      kind: "Information",
      id: "cond6-intro",
      title: "Reflecting on Conditionals",
      content:
        "You've learned how to control the flow of your programs using `if`, `else`, `elif`, and nesting. Let's review some key ideas.",
    },
    {
      kind: "MultipleChoice",
      id: "cond6-q-when-nested",
      title: "When to Use Nested Conditionals",
      content:
        "Based on the examples (like the '3 Options' or '2 Questions' game), when is a nested `if`/`else` structure typically required?",
      options: [
        "Whenever you have more than one `if` statement.",
        "When a decision needs to be made *only if* a prior condition was met (or not met).",
        "Only when comparing numbers.",
        "To make the code shorter.",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! Nesting is used when the outcome of one condition determines whether you even need to check a subsequent condition.",
        incorrect:
          "Think about the structure. The inner `if`/`else` is indented *inside* an outer `if` or `else` block, meaning it only executes as part of that outer block's path.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "cond6-q-binary-search",
      title: "Conditionals and Binary Search",
      content:
        "The '2 Questions' game narrows down possibilities based on answers. How is using `if`/`else` to eliminate options conceptually similar to the idea behind binary search?",
      options: [
        "Both involve asking exactly two questions.",
        "Both require the data to be sorted numerically first.",
        "Both work by repeatedly dividing the remaining possibilities in half (or into distinct groups) based on the outcome of a comparison/question.",
        "Both can only be used to find numbers.",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! Both techniques work by making a decision (based on a comparison or a question) that allows you to discard a significant portion of the remaining possibilities, thus efficiently homing in on the target.",
        incorrect:
          "Consider the core idea of binary search: comparing with the middle element eliminates half the search space. How does an `if`/`else` statement eliminate possibilities based on its condition?",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Reflection",
      id: "cond6-final-thoughts",
      title: "Final Thoughts on Conditionals",
      content:
        "Reflect on what you've learned about Python conditionals. Create a small code snippet (perhaps using `if`, `elif`, and `else`) that demonstrates a scenario where you might make decisions based on a variable's value, and explain it.",
      topic:
        "What real-world scenario or decision is your code snippet modeling (e.g., checking age, grading, simple choice)?",
      isTopicPredefined: false,
      code: "Write a short Python code snippet (4-7 lines) using `if`/`elif`/`else`.",
      isCodePredefined: false,
      explanation:
        "Briefly explain what your code does and how the conditional statements control the output based on the variable's value.",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
    {
      kind: "Information",
      id: "cond-unit-conclusion",
      title: "Congratulations!",
      content:
        "You've completed the 'Python Conditionals' unit! You've mastered `if`, `else`, `elif`, debugging syntax errors, and building logic with nested conditionals. Controlling program flow is a fundamental skill, and you're well on your way!\n\nContinue practicing by adding conditional logic to your own small projects.",
    },
  ],
};

export default lessonData;
