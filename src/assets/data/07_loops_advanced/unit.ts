import { UnitId, UnitManifest } from "../../../types/data";

const unitManifest: UnitManifest = {
  id: "advanced_loops" as UnitId,
  title: "Advanced Loops",
  image: "images/unit_icon_loops_advanced.svg",
  description:
    "Learn how to iterate through data using loops in order to analyze large datasets.",
  lessons: ["lessons/00_iteration_loops", "lessons/01_accumulation_intro"],
};

export default unitManifest;
