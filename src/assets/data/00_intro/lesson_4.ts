import type { Lesson, ObservationSection } from "../../../types/data";

const lessonData: Lesson = {
  title: "Data Structures",
  description:
    "Learn about the main data structures in Python: lists, tuples, dictionaries, and sets.",
  sections: [
    {
      kind: "Observation",
      id: "python-lists",
      title: "Python Lists",
      content:
        "Lists are ordered collections of items that can be of different types. Lists are mutable, which means they can be changed after creation.",
      example: {
        id: "lists-creation",
        title: "Creating Lists",
        description:
          "Lists in Python can be created using square brackets. Items are separated by commas.",
        code: "# Creating a list\nnumbers = [1, 2, 3, 4, 5]\nprint(numbers)\n\n# List with mixed data types\nmixed_list = [1, 'hello', 3.14, True]\nprint(mixed_list)\n\n# Empty list\nempty_list = []\nprint(empty_list)\n\n# Creating a list using the list() constructor\nconverted_list = list('Python')\nprint(converted_list)",
      },
    } as ObservationSection,
    {
      kind: "Observation",
      id: "python-dictionaries",
      title: "Python Dictionaries",
      content:
        "Dictionaries are collections of key-value pairs. They are unordered, mutable, and indexed by keys instead of positions.",
      example: {
        id: "dict-access",
        title: "Accessing Dictionary Elements",
        description: "You can access dictionary values using their keys.",
        code: "person = {\n    'name': 'John',\n    'age': 30,\n    'city': 'New York'\n}\n\n# Access values using keys\nprint(person['name'])\nprint(person['age'])\n\n# Using the get() method (safer if key might not exist)\nprint(person.get('city'))\nprint(person.get('country'))         # Returns None\nprint(person.get('country', 'USA'))  # Returns default value\n\n# Check if a key exists\nif 'name' in person:\n    print('Name exists in the dictionary')",
      },
    },
    {
      kind: "Observation",
      id: "python-sets",
      title: "Python Sets",
      content:
        "Sets are unordered collections of unique elements. They are useful for membership testing and eliminating duplicate entries.",
      example: {
        id: "set-operations",
        title: "Set Operations",
        description:
          "Sets support mathematical operations like union, intersection, and difference.",
        code: "set1 = {1, 2, 3, 4, 5}\nset2 = {4, 5, 6, 7, 8}\n\n# Union (all elements from both sets)\nprint(set1 | set2)  # or set1.union(set2)\n\n# Intersection (elements in both sets)\nprint(set1 & set2)  # or set1.intersection(set2)\n\n# Difference (elements in set1 but not in set2)\nprint(set1 - set2)  # or set1.difference(set2)\n\n# Symmetric difference (elements in either set, but not in both)\nprint(set1 ^ set2)  # or set1.symmetric_difference(set2)",
      },
    },
  ],
};

export default lessonData;
