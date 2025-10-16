import { UnitId, UnitManifest } from "../../../types/data";

const unitManifest: UnitManifest = {
  id: "intro_python" as UnitId,
  title: "Introduction to Python",
  image: "images/unit_icon_intro.svg",
  description:
    "Learn the fundamentals of Python programming through interactive lessons that run directly in your browser.",
  lessons: [
    "lessons/00_intro_strings",
    "lessons/01_intro_integers",
    "lessons/02_type_errors",
    "lessons/03_intro_wrap_up",
  ],
};

export default unitManifest;
