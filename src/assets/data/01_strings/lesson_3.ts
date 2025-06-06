import type {
  Lesson,
  MultipleChoiceSectionData,
  ObservationSectionData,
  ReflectionSectionData,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Creative Project - Mad Libs",
  guid: "1af50da8-e219-4845-b9e1-52db34b1437e",
  description:
    "Apply your knowledge of strings, input, and type casting to create an interactive Mad Libs game.",
  sections: [
    {
      kind: "Information",
      id: "madlibs-intro",
      title: "Project: Building a Mad Libs Game",
      content:
        "Mad Libs is a fun word game where one player prompts others for a list of words to substitute for blanks in a story. In this lesson, you'll create your own school-appropriate Mad Libs program in Python!\n\n**Your Mad Libs program must have all of the following properties:**\n1. At least **four variables** that you use at least **six times** in total in your story.\n2. Asks the user for at least **one number** and performs an **integer operation** on it (e.g., addition, subtraction) which is then displayed in the story.\n3. The final Mad Libs story is printed out on at least **four separate lines**.\n4. The story prints out **at least one apostrophe** (e.g., `it's`, `player's`).\n5. The story prints out **at least one double quote mark** (e.g., `someone shouted \"Wow!\"`).",
    },
    {
      kind: "MultipleChoice",
      id: "madlibs-q1-difficulty",
      title: "Anticipating Challenges",
      content:
        "Considering the five properties required for the Mad Libs game, which one might require the most careful attention to detail to implement correctly using f-strings or string concatenation?",
      options: [
        "Using four variables at least six times.",
        "Asking for a number and performing an integer operation.",
        "Printing the story on at least four separate lines.",
        "Correctly printing an apostrophe (') and a double quote (\") within the output strings.",
      ],
      correctAnswer: 3,
      feedback: {
        correct:
          "Correct! Ensuring that special characters like apostrophes and double quotes are printed correctly within your strings often requires careful use of quote types (e.g., using double quotes for a string that contains an apostrophe, or using escape characters if necessary).",
        incorrect:
          "While all properties require attention, think about which one directly involves handling characters that also have special meaning in Python string syntax.",
      },
    } as MultipleChoiceSectionData,
    {
      kind: "MultipleChoice",
      id: "madlibs-q2-integer-op",
      title: "Integer Operations with Input",
      content:
        "What is important to remember whenever you want to perform an integer operation on a number obtained from user input via the `input()` function?",
      options: [
        "The `input()` function automatically converts numbers to integers.",
        "You must convert the input string to an integer using `int()` before performing arithmetic.",
        "Integer operations can be directly performed on the string if it contains only digits.",
        "You should use `float()` for all number inputs to be safe.",
      ],
      correctAnswer: 1,
      feedback: {
        correct:
          "Correct! The `input()` function returns a string. To perform mathematical operations, you must explicitly convert this string to a numerical type, such as an integer using `int()`.",
        incorrect:
          'The `input()` function always returns a string. Consider what happens if you try to add `"5" + 1`.',
      },
    } as MultipleChoiceSectionData,
    {
      kind: "Observation",
      id: "madlibs-creation-space",
      title: "Create Your Mad Libs!",
      content:
        "Now it's your turn to code. Use the editor below to create your Mad Libs program that meets all the requirements listed in the introduction. \n\n**Remember the requirements:**\n1. Four+ variables, used six+ times.\n2. One+ number input with an integer operation.\n3. Story on four+ separate lines.\n4. Prints at least one apostrophe (').\n5. Prints at least one double quote (\").\n\nThis is a creative task! Have fun with it. There are no automated tests for this specific creative output, but ensure your code runs and fulfills the criteria. You can 'play' it by running the code and entering inputs.",
      example: {
        id: "madlibs-code",
        title: "My Mad Libs Program",
        description:
          "Develop your Mad Libs code here. Test it by running it yourself!",
        code: '# Mad Libs! Get creative!\n\n# Example: Get some inputs\n# adjective = input("Enter an adjective: ")\n# noun_plural = input("Enter a plural noun: ")\n# number_str = input("Enter a number: ")\n# verb_ing = input("Enter a verb ending in -ing: ")\n\n# Remember to convert the number if you do math!\n# number_int = int(number_str)\n# calculated_number = number_int + 5 \n\n# Start writing your story using these (and more) variables!\n# print(f"Today I went to the zoo and saw many {adjective} {noun_plural}.")\n# print(f"One of them was {verb_ing} near a tree.")\n# print(f"It said, \\"I\'ve been here for {calculated_number} years!\\"") # Example of \' and "\n# print("What a day!")\n\nprint("Start your Mad Libs program here!")\n',
      },
    } as ObservationSectionData,
    {
      kind: "Information",
      id: "madlibs-playtest-self",
      title: "Playtesting and Refining",
      content:
        "After writing your Mad Libs program, run it several times. \n- Does it ask for all the inputs you planned?\n- Is the story grammatically coherent (as much as Mad Libs can be!)?\n- Does it meet all five of the technical requirements?\n- Are there any bugs? What happens if the user types something unexpected for the number?\n\nIf you were working with a partner (as suggested in the original worksheet), this would be a good time to have them play your Mad Libs while you play theirs. Constructive feedback helps improve your code!\n\nSince this is an online, self-paced environment, consider asking a friend or family member to 'play' your Mad Libs by telling you what words to input as you run the program. Then, read them the final story. This can help you spot areas for improvement or parts that are particularly funny.",
    },
    {
      kind: "Reflection",
      id: "madlibs-reflection-on-creation",
      title: "Reflecting on Your Mad Libs",
      content:
        "Think about the Mad Libs you created. This is an opportunity to reflect on your coding process and the application of string concepts. Provide your Mad Libs code and a brief explanation.",
      topic: "Briefly describe the theme or idea behind your Mad Libs.",
      isTopicPredefined: false,
      code: "Paste your final Mad Libs Python code here.",
      isCodePredefined: false,
      explanation:
        "Explain how your Mad Libs code meets AT LEAST THREE of the five requirements (e.g., how you handled number input and operations, how you printed on multiple lines, how you included quotes/apostrophes, or how you used variables).",
      isExplanationPredefined: false,
    } as ReflectionSectionData,
  ],
};

export default lessonData;
