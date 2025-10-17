import { UnitId, UnitManifest } from "../../../types/data";

const unitManifest: UnitManifest = {
  id: "advanced_loops" as UnitId,
  title: "Advanced Loops",
  image: "images/unit_icon_loops_advanced.svg",
  description:
    "Learn how to use loops in your code to further exploit patterns and create even more interesting shapes.",
  lessons: [
    "lessons/00_loops_and_vars",
    "lessons/01_loops_and_funcs",
    "lessons/02_loops_wrap_up",
    "lessons/99_test_visual_turtle",
  ],
};

export default unitManifest;
