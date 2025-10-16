import { UnitId, UnitManifest } from "../../../types/data";

const unitManifest: UnitManifest = {
  id: "advanced_functions" as UnitId,
  title: "Advanced Functions",
  image: "images/unit_icon_functions_advanced.svg",
  description:
    "Learn how you can use functions other people wrote to create more complex and visually interesting outputs.",
  lessons: [
    "lessons/00_func_libraries",
    "lessons/01_func_turtles",
    "lessons/02_func_turtle_inputs",
    "lessons/03_func_neighbors",
  ],
};

export default unitManifest;
