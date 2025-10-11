import { Unit, UnitId } from "../../types/data";

const unitData: Unit[] = [
  {
    id: "learning_to_learn" as UnitId,
    title: "Learning to Learn",
    image: "xx_learning/images/unit_xx_learning.svg",
    description:
      'Understand how this website differs from other "Learn Python" websites and learn a little bit about learning.',
    lessons: [
      {
        path: "xx_learning/lessons/00_learning_primm",
        guid: "f950d6b1-7c06-485c-8a23-9cd17f72a7ba",
      },
      {
        path: "xx_learning/lessons/01_learning_reflection",
        guid: "3c201468-453b-42f3-a4f6-51a0ad3c93f8",
      },
      {
        path: "xx_learning/lessons/02_learning_wrap_up",
        guid: "dbd45993-6473-4df3-959a-04b7289a229e",
      },
    ],
  } as Unit,
  {
    id: "intro_python" as UnitId,
    title: "Introduction to Python",
    image: "00_intro/images/unit_00_intro.svg",
    description:
      "Learn the fundamentals of Python programming through interactive lessons that run directly in your browser.",
    lessons: [
      {
        path: "00_intro/lessons/00_intro_strings",
        guid: "3c1e0332-e7ec-4e6a-b0c6-f9c9890999c5",
      },
      {
        path: "00_intro/lessons/01_intro_integers",
        guid: "65ddff46-b4af-4443-ac0a-5b6a714e405e",
      },
      {
        path: "00_intro/lessons/02_type_errors",
        guid: "933ff0c7-8c35-4786-86eb-649c02be6a3c",
      },
      {
        path: "00_intro/lessons/03_intro_wrap_up",
        guid: "a2f4b8c3-9d1e-4f3a-b7c9-2e8f5a6d9c4e",
      },
    ],
  } as Unit,
  {
    id: "variables_debugging" as UnitId,
    title: "Variables and Debugging",
    image: "01_variables/images/unit_01_variables.svg",
    description:
      "Learn how to store data and reuse it to make you programs more versatile.",
    lessons: [
      {
        path: "01_variables/lessons/00_var_intro",
        guid: "5c3c6f3b-722f-4b19-b3ed-d532b7961f92",
      },
      {
        path: "01_variables/lessons/01_var_multi",
        guid: "aa145d0e-68cb-44b2-a484-8d7ab19e2810",
      },
      {
        path: "01_variables/lessons/02_var_errors",
        guid: "5d47da97-ba3d-4ef4-8dab-4f725190a69b",
      },
      {
        path: "01_variables/lessons/03_var_wrap_up",
        guid: "14f3ba03-2020-44e6-b68d-ae8dde46da7e",
      },
    ],
  } as Unit,
  {
    id: "intro_functions" as UnitId,
    title: "Functions",
    image: "02_functions/images/unit_02_functions.svg",
    description:
      "Learn how to use functions to help reduce the size of your code and make it more readable.",
    lessons: [
      {
        path: "02_functions/lessons/00_func_intro",
        guid: "3ad2a551-618e-4398-918a-02342f824ab1",
      },
      {
        path: "02_functions/lessons/01_func_exec",
        guid: "bfa974e1-7042-48a4-a568-19a1816ea474",
      },
      {
        path: "02_functions/lessons/02_func_inputs",
        guid: "ab5bed79-7662-423e-90ef-952539f59099",
      },
      {
        path: "02_functions/lessons/03_func_wrap_up",
        guid: "d6b6048d-ebb0-4ac8-9b06-60ad1134ef98",
      },
    ],
  } as Unit,
  {
    id: "advanced_functions" as UnitId,
    title: "Advanced Functions",
    image: "03_functions_advanced/images/unit_03_functions_advanced.svg",
    description:
      "Learn how you can use functions other people wrote to create more complex and visually interesting outputs.",
    lessons: [
      {
        path: "03_functions_advanced/lessons/00_func_libraries",
        guid: "ab95ab6a-a2ff-46af-b63c-1066b16fce49",
      },
      {
        path: "03_functions_advanced/lessons/01_func_turtles",
        guid: "973a0fb8-67fa-463d-a12d-0df9f55eb547",
      },
      {
        path: "03_functions_advanced/lessons/02_func_turtle_inputs",
        guid: "a707da7a-de11-4470-8d08-d537748c0982",
      },
      {
        path: "03_functions_advanced/lessons/03_func_neighbors",
        guid: "e32ef864-111e-4647-b877-fb321a196c80",
      },
    ],
  } as Unit,
  {
    id: "python_conditionals",
    title: "Python Conditionals (If/Else)",
    image: "04_conditionals/images/unit_04_conditionals.svg",
    description:
      "Learn how to control the flow of your programs using `if`, `else`, and `elif` statements.",
    lessons: [
      {
        path: "04_conditionals/lessons/00_cond_intro",
        guid: "b4e7c932-5a81-4d29-9c73-8f2e4b7a1d36",
      },
      {
        path: "04_conditionals/lessons/01_cond_if_else",
        guid: "c9f3d821-7b42-4e89-a634-1d8e5f9c2b47",
      },
      {
        path: "04_conditionals/lessons/02_cond_if_elif",
        guid: "d8a4e732-9f51-4c83-b821-6e7d3f8c9a42",
      },
      {
        path: "04_conditionals/lessons/03_cond_bool",
        guid: "e5b6f823-4d71-4a92-bc58-9f2e6d8a7c31",
      },
      {
        path: "04_conditionals/lessons/lesson_5",
        guid: "a001f2f7-66ad-4799-af46-a4acbf8f1098",
      },
    ],
  } as Unit,
  {
    id: "loops" as UnitId,
    title: "Loops",
    image: "05_loops/images/unit_05_loops.svg",
    description:
      "Learn how to use loops in your code to further exploit patterns and create even more interesting shapes.",
    lessons: [
      {
        path: "05_loops/lessons/00_loops_intro",
        guid: "d8f3c921-4a56-4b72-9e15-2c8f7d4a3b91",
      },
      {
        path: "05_loops/lessons/01_loops_nesting",
        guid: "e9f2d834-6b71-4a89-b523-1e7c9f8d2a56",
      },
      {
        path: "05_loops/lessons/02_loops_and_vars",
        guid: "c7d5e921-8f34-4b89-a821-3f9c7d2e5a14",
      },
      {
        path: "05_loops/lessons/03_loops_and_funcs",
        guid: "f8a2c754-9d63-4e87-b912-7c5a8f9e3d21",
      },
      {
        path: "05_loops/lessons/04_loops_wrap_up",
        guid: "a8c3f729-5e42-4d91-b8a7-2f9e6c8d7b31",
      },
    ],
  } as Unit,
  {
    id: "python_strings",
    title: "Python Strings Deep Dive",
    image: "06_strings/images/unit_06_strings.svg",
    description:
      "Explore string manipulation, f-strings, type casting, and create fun projects like Mad Libs.",
    lessons: [
      {
        path: "06_strings/lessons/lesson_1",
        guid: "03cff8d8-33a0-49ed-98c4-d51613995340",
      },
      {
        path: "06_strings/lessons/lesson_2",
        guid: "a9e039a5-d551-4068-b797-553ef721bac9",
      },
      {
        path: "06_strings/lessons/lesson_3",
        guid: "1af50da8-e219-4845-b9e1-52db34b1437e",
      },
      {
        path: "06_strings/lessons/lesson_4",
        guid: "3ed77482-b004-49dd-bc5d-e588f42883aa",
      },
    ],
  } as Unit,
  {
    id: "python_lists_intro",
    title: "Python Lists (Intro)",
    image: "07_lists_intro/images/unit_07_lists_intro.svg",
    description:
      "This worksheet is intended to show you how lists work in Python and how they compare with strings.",
    lessons: [
      {
        path: "07_lists_intro/lessons/lesson_1",
        guid: "c3aa36b7-5c56-476f-a38f-2a9fd39e08eb",
      },
      {
        path: "07_lists_intro/lessons/lesson_2",
        guid: "cde4e0a6-c51e-495f-83fd-21ed00cf06c1",
      },
      {
        path: "07_lists_intro/lessons/lesson_3",
        guid: "84868dd9-81cb-4eb9-82d8-09f7efb6a2f8",
      },
      {
        path: "07_lists_intro/lessons/lesson_4",
        guid: "88591a12-9ec3-463b-a3cc-68a9e91ca4ff",
      },
    ],
  } as Unit,
  {
    id: "python_lists_advanced",
    title: "Python Lists (Advanced)",
    image: "08_lists_advanced/images/unit_08_lists_advanced.svg",
    description: "Stretch your understand of lists with an ethical puzzle.",
    lessons: [
      {
        path: "08_lists_advanced/lessons/lesson_1",
        guid: "fb0724da-2741-41bf-a737-5ad0eaf0291f",
      },
      {
        path: "08_lists_advanced/lessons/lesson_2",
        guid: "fe7493be-7ed6-439d-bc1b-2dd5fc08382a",
      },
    ],
  } as Unit,
];

export default unitData;
