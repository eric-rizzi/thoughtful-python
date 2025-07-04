import type {
  DebuggerSectionData,
  InformationSectionData,
  Lesson,
  LessonId,
  SectionId,
} from "../../../types/data";

const lessonData: Lesson = {
  title: "Further Functions",
  guid: "bfa974e1-7042-48a4-a568-19a1816ea474" as LessonId,
  description:
    "Dive deeper into functions and make them more flexible with inputs",
  sections: [
    {
      kind: "Information",
      id: "variable-debugging-info",
      title: "Test Move",
      content: [
        {
          kind: "text",
          value: "This is a test",
        },
        {
          kind: "video",
          src: "https://www.youtube.com/watch?v=u-OmVr_fT4s&t=145s",
          caption: "Video about functions",
        },
      ],
    } as InformationSectionData,
    {
      kind: "Debugger",
      id: "variable-debugging" as SectionId,
      title: "Watching Variables Change",
      content: [
        {
          kind: "text",
          value:
            "One of the most powerful features of variables is that you can change their values. When you assign a new value to an existing variable, it replaces the old value. Use the debugging tool below to watch how the variable `score` changes as the program runs.\n\nStep through the code line by line and observe how the value of `score` changes in the variables panel.",
        },
      ],
      code: 'def print_hi():\n  print("hi")\n  print("yo")\n\nprint_hi()\nx = 3\ny = 10\nprint_hi()\ny += 1\nprint(y)',
      advancedControls: true,
    } as DebuggerSectionData,
  ],
};

export default lessonData;
