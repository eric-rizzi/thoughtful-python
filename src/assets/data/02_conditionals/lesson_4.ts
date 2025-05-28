import type {
  Lesson,
  MultipleChoiceSectionData,
  ObservationSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "2 Questions Game",
  description:
    "Build a simple guessing game using nested conditionals to narrow down possibilities.",
  sections: [
    {
      kind: "Information",
      id: "cond4-intro",
      title: "Project: Building a '2 Questions' Game",
      content:
        "Let's build a simple text-based version of the '20 Questions' game, but much shorter! The computer will 'think' of one of four words, and ask the user two yes/no questions to guess which word it is.\n\n**Your game must have all of the following properties:**\n1. A series of **nested** `if`/`else` conditionals based on user input.\n2. Two strategic questions that the user answers (`y`/`n`) to determine the word.\n3. Correct use of indentation for the nested structure.\n4. The final guess must be printed in the format: `It's 'WORD'!` (Note the single quotes around the guessed word).\n5. User input prompts should have proper spacing (e.g., end with a space: `Is it alive? (y/n) `).",
    },
    {
      kind: "MultipleChoice",
      id: "cond4-q-difficulty",
      title: "Anticipating Challenges",
      content:
        "Considering the requirements, which aspect might require careful planning to ensure the nested `if`/`else` logic correctly leads to each of the four possible words?",
      options: [
        "Getting the user input with `input()`.",
        "Printing the final guess with single quotes around the word.",
        "Designing the nested `if`/`else` structure to correctly map the two 'y'/'n' answers to the four words.",
        "Ensuring prompts have correct spacing.",
      ],
      correctAnswer: 2,
      feedback: {
        correct:
          "Correct! Mapping the combinations of two yes/no answers (yy, yn, ny, nn) to the four target words using nested conditionals requires careful logical structuring.",
        incorrect:
          "While printing quotes and getting input require care, the core logic challenge lies in structuring the nested `if`/`else` statements to correctly navigate the decision tree based on the two answers.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Information",
      id: "cond4-planning",
      title: "Planning Your Game",
      content:
        "Before coding, choose four related words. Then, think of two yes/no questions that can distinguish between them. \n\n*Example:*\nWords: `apple`, `banana`, `carrot`, `broccoli`\nQ1: `Is it a fruit? (y/n)`\nQ2 (if Q1=y): `Is it long and yellow? (y/n)` -> 'y' means banana, 'n' means apple.\nQ2 (if Q1=n): `Is it orange and grows underground? (y/n)` -> 'y' means carrot, 'n' means broccoli.\n\nYou need to translate this logic into nested `if`/`else` statements.",
    },
    {
      kind: "Observation",
      id: "cond4-creation-space",
      title: "Create Your '2 Questions' Game!",
      content:
        "Use the editor below to build your game. Remember the requirements:\n1. Nested `if`/`else`.\n2. Two 'y'/'n' questions.\n3. Correct final print format (`It's 'WORD'!`)\n4. Proper indentation and prompt spacing.\n\nChoose your own four words and creative questions!",
      example: {
        id: "cond4-code",
        title: "My '2 Questions' Program",
        description: "Develop and test your game here.",
        code: '# 2 Questions Game\n\nprint("Think of one of these four words: [Word1, Word2, Word3, Word4]") # Tell the user the options\n\n# --- Question 1 --- \nanswer1 = input("Question 1 text here? (y/n) ").lower()\n\nif answer1 == \'y\':\n  # --- Question 2 (Yes Path) ---\n  answer2_yes = input("Question 2 (Yes path) text here? (y/n) ").lower()\n  if answer2_yes == \'y\':\n    guess = "Word1" # Word for YY path\n  else:\n    guess = "Word2" # Word for YN path\nelse: # answer1 was \'n\'\n  # --- Question 2 (No Path) ---\n  answer2_no = input("Question 2 (No path) text here? (y/n) ").lower()\n  if answer2_no == \'y\':\n    guess = "Word3" # Word for NY path\n  else:\n    guess = "Word4" # Word for NN path\n\n# Final guess - ensure format It\'s \'WORD\'!\nprint(f"It\'s \'{guess}\'!") \n',
      },
    } as ObservationSectionData,
    {
      kind: "Reflection",
      id: "cond4-reflection-on-creation",
      title: "Reflecting on Your Game",
      content: "Submit your '2 Questions' game code and explain its structure.",
      topic: "What four words did you choose for your game?",
      isTopicPredefined: false,
      code: "Paste your final '2 Questions' Python code here.",
      isCodePredefined: false,
      explanation:
        "Explain how your nested `if`/`else` structure uses the answers to the two questions to arrive at the correct final guess. How did you ensure the output format `It's 'WORD'!` was correct?",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
  ],
};

export default lessonData;
