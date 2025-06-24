import { Unit, UnitId } from "../../types/data";

const unitData: Unit[] = [
  {
    id: "learning_to_learn" as UnitId,
    title: "Learning to Learn",
    description:
      'Understand how this website differs from other "Learn Python" websites and learn a little bit about learning.',
    lessons: [
      {
        path: "xx_learning/lesson_01",
        guid: "f950d6b1-7c06-485c-8a23-9cd17f72a7ba",
      },
      {
        path: "xx_learning/lesson_02",
        guid: "3c201468-453b-42f3-a4f6-51a0ad3c93f8",
      },
      {
        path: "xx_learning/lesson_03",
        guid: "dbd45993-6473-4df3-959a-04b7289a229e",
      },
    ],
    image: "unit_xx_learning.svg",
  } as Unit,
  {
    id: "intro_python" as UnitId,
    title: "Introduction to Python",
    description:
      "Learn the fundamentals of Python programming through interactive lessons that run directly in your browser.",
    lessons: [
      {
        path: "00_intro/lesson_01",
        guid: "3c1e0332-e7ec-4e6a-b0c6-f9c9890999c5",
      },
      {
        path: "00_intro/lesson_02",
        guid: "65ddff46-b4af-4443-ac0a-5b6a714e405e",
      },
      {
        path: "00_intro/lesson_03",
        guid: "5c3c6f3b-722f-4b19-b3ed-d532b7961f92",
      },
      {
        path: "00_intro/lesson_04",
        guid: "14f3ba03-2020-44e6-b68d-ae8dde46da7e",
      },
      {
        path: "00_intro/lesson_05",
        guid: "3ad2a551-618e-4398-918a-02342f824ab1",
      },
      {
        path: "00_intro/lesson_06",
        guid: "bfa974e1-7042-48a4-a568-19a1816ea474",
      },
      {
        path: "00_intro/lesson_07",
        guid: "ab5bed79-7662-423e-90ef-952539f59099",
      },
      {
        path: "00_intro/lesson_08",
        guid: "d6b6048d-ebb0-4ac8-9b06-60ad1134ef98",
      },
      {
        path: "00_intro/lesson_09",
        guid: "09289f01-6463-4420-8b74-2146850a28cf",
      },
      {
        path: "00_intro/lesson_10",
        guid: "5831a4e6-9d52-42bb-9a45-c3cd5ba53a51",
      },
    ],
    image: "unit_00_intro.svg",
  } as Unit,
  {
    id: "python_strings",
    title: "Python Strings Deep Dive",
    description:
      "Explore string manipulation, f-strings, type casting, and create fun projects like Mad Libs.",
    lessons: [
      {
        path: "01_strings/lesson_1",
        guid: "03cff8d8-33a0-49ed-98c4-d51613995340",
      },
      {
        path: "01_strings/lesson_2",
        guid: "a9e039a5-d551-4068-b797-553ef721bac9",
      },
      {
        path: "01_strings/lesson_3",
        guid: "1af50da8-e219-4845-b9e1-52db34b1437e",
      },
      {
        path: "01_strings/lesson_4",
        guid: "3ed77482-b004-49dd-bc5d-e588f42883aa",
      },
    ],
    image: "unit_01_strings.svg",
  } as Unit,
  {
    id: "python_conditionals",
    title: "Python Conditionals (If/Else)",
    description:
      "Learn how to control the flow of your programs using `if`, `else`, and `elif` statements.",
    lessons: [
      {
        path: "02_conditionals/lesson_1",
        guid: "77d6e706-4068-41cc-abf6-f435f6aca538",
      },
      {
        path: "02_conditionals/lesson_2",
        guid: "0f92c4de-ca4d-49f8-af65-7f9843f50341",
      },
      {
        path: "02_conditionals/lesson_3",
        guid: "cbf11a92-aefe-422f-8e71-0245e5c13e43",
      },
      {
        path: "02_conditionals/lesson_4",
        guid: "3bbea3a7-7cc2-4026-9073-304f121ceb1c",
      },
      {
        path: "02_conditionals/lesson_5",
        guid: "a001f2f7-66ad-4799-af46-a4acbf8f1098",
      },
    ],
    image: "unit_02_conditionals.svg",
  } as Unit,
  {
    id: "python_lists_intro",
    title: "Python Lists (Intro)",
    description:
      "This worksheet is intended to show you how lists work in Python and how they compare with strings.",
    lessons: [
      {
        path: "03_lists_intro/lesson_1",
        guid: "c3aa36b7-5c56-476f-a38f-2a9fd39e08eb",
      },
      {
        path: "03_lists_intro/lesson_2",
        guid: "cde4e0a6-c51e-495f-83fd-21ed00cf06c1",
      },
      {
        path: "03_lists_intro/lesson_3",
        guid: "84868dd9-81cb-4eb9-82d8-09f7efb6a2f8",
      },
      {
        path: "03_lists_intro/lesson_4",
        guid: "88591a12-9ec3-463b-a3cc-68a9e91ca4ff",
      },
    ],
    image: "unit_03_lists_intro.svg",
  } as Unit,
  {
    id: "python_lists_advanced",
    title: "Python Lists (Advanced)",
    description: "Stretch your understand of lists with an ethical puzzle.",
    lessons: [
      {
        path: "04_lists_advanced/lesson_1",
        guid: "fb0724da-2741-41bf-a737-5ad0eaf0291f",
      },
      {
        path: "04_lists_advanced/lesson_2",
        guid: "fe7493be-7ed6-439d-bc1b-2dd5fc08382a",
      },
    ],
    image: "unit_04_lists_advanced.svg",
  } as Unit,
];

export default unitData;
