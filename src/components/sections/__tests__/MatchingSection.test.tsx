import { screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

import { render } from "../../../test-utils";
import MatchingSection from "../MatchingSection";
import { useSectionProgress } from "../../../hooks/useSectionProgress";
import type {
  MatchingSectionData,
  UnitId,
  LessonId,
  SectionId,
} from "../../../types/data";

// Mock the hook that manages state
vi.mock("../../../hooks/useSectionProgress");

const mockSectionData: MatchingSectionData = {
  kind: "Matching",
  id: "match-1" as SectionId,
  title: "Match the Concepts",
  content: [{ kind: "text", value: "Drag the definition to the term." }],
  prompts: [
    { "A variable": "A named storage location for data." },
    { "A function": "A reusable block of code." },
  ],
  feedback: { correct: "All matched correctly!" },
};

describe("MatchingSection", () => {
  const setSavedStateMock = vi.fn();
  const mockSavedState = { userMatches: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up a default mock implementation for the useSectionProgress hook
    vi.mocked(useSectionProgress).mockReturnValue([
      mockSavedState,
      setSavedStateMock,
      false, // isSectionComplete
    ]);
  });

  it("should render the initial state with prompts and draggable options", () => {
    render(
      <MatchingSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // Check for prompts
    expect(screen.getByText("A variable")).toBeInTheDocument();
    expect(screen.getByText("A function")).toBeInTheDocument();

    // Check for options in the pool
    expect(
      screen.getByText("A named storage location for data.")
    ).toBeInTheDocument();
    expect(screen.getByText("A reusable block of code.")).toBeInTheDocument();

    // Check for drop zone placeholders
    expect(screen.getAllByText("Drop here")).toHaveLength(2);
  });

  it("should handle a drag-and-drop interaction and call setSavedState", () => {
    render(
      <MatchingSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    const optionToDrag = screen.getByText("A reusable block of code.");
    // The drop zone is the sibling of the prompt div
    const dropZone = screen.getByText("A function").nextElementSibling;
    expect(dropZone).toBeInTheDocument();

    // Simulate the drag and drop interaction using fireEvent
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => JSON.stringify({ optionId: "option-1" })), // Corresponds to "A reusable block of code."
    };

    fireEvent.dragStart(optionToDrag, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

    // Assert that the state update function was called
    expect(setSavedStateMock).toHaveBeenCalledTimes(1);
    // We expect it to be called with a function that updates the state
    expect(setSavedStateMock).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should display an incorrect message when all items are matched but not correct", () => {
    // ARRANGE: Mock a state where everything is matched, but it's not complete
    const incorrectState = {
      userMatches: {
        "A variable": "option-1", // Incorrect match
        "A function": "option-0", // Incorrect match
      },
    };
    vi.mocked(useSectionProgress).mockReturnValue([
      incorrectState,
      setSavedStateMock,
      false, // isSectionComplete is false
    ]);

    render(
      <MatchingSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // ASSERT
    expect(screen.getByText(/not quite right/i)).toBeInTheDocument();
  });

  it("should display a correct message when the section is complete", () => {
    // ARRANGE: Mock a state where matches are correct and section is complete
    const correctState = {
      userMatches: {
        "A variable": "option-0",
        "A function": "option-1",
      },
    };
    vi.mocked(useSectionProgress).mockReturnValue([
      correctState,
      setSavedStateMock,
      true, // isSectionComplete is true
    ]);

    render(
      <MatchingSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // ASSERT
    expect(screen.getByText("All matched correctly!")).toBeInTheDocument();

    const prompt1 = screen.getByText("A variable");
    const dropZone1 = prompt1.nextElementSibling;
    expect(dropZone1).toHaveClass("correct");

    const prompt2 = screen.getByText("A function");
    const dropZone2 = prompt2.nextElementSibling;
    expect(dropZone2).toHaveClass("correct");
  });
});
