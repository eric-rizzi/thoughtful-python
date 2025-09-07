import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { render } from "../../../test-utils";
import CoverageSection from "../CoverageSection";
import { useInteractiveTableLogic } from "../../../hooks/useInteractiveTableLogic";
import type {
  CoverageSectionData,
  UnitId,
  LessonId,
  SectionId,
  SavedCoverageState,
} from "../../../types/data";

// Mock the custom hook that provides all the logic
vi.mock("../../../hooks/useInteractiveTableLogic");

// Create mock data for the section
const mockSectionData: CoverageSectionData = {
  kind: "Coverage",
  id: "cov-1" as SectionId,
  title: "Code Coverage Challenge",
  content: [{ kind: "text", value: "Find inputs to produce the outputs." }],
  example: {
    initialCode:
      "def check_temp(t):\n  if t > 25:\n    return 'Hot'\n  return 'Normal'",
  },
  coverageTable: {
    functionToTest: "check_temp",
    columns: [{ variableName: "t", variableType: "number" }],
    rows: [{ expectedOutput: "Hot" }, { expectedOutput: "Normal" }],
  },
};

// Default state for the mocked hook
const mockSavedState: SavedCoverageState = {
  challengeStates: {},
};

describe("CoverageSection", () => {
  const handleUserInputChangeMock = vi.fn();
  const runRowMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up a default mock return value for the hook
    vi.mocked(useInteractiveTableLogic).mockReturnValue({
      savedState: mockSavedState,
      isSectionComplete: false,
      runningStates: {},
      isLoading: false,
      pyodideError: null,
      handleUserInputChange: handleUserInputChangeMock,
      runRow: runRowMock,
    });
  });

  it("should render the initial state correctly", () => {
    render(
      <CoverageSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // Assert that the title, code, and table headers are rendered
    expect(
      screen.getByRole("heading", { name: /code coverage challenge/i })
    ).toBeInTheDocument();
    // FIX 1: Find the code editor container and check its content
    const codeEditor = screen.getByRole("heading", {
      name: /code to analyze/i,
    }).nextElementSibling;
    expect(codeEditor).toHaveTextContent(/def check_temp\(t\):/);
    expect(codeEditor).toHaveTextContent(/return 'Hot'/);

    expect(
      screen.getByRole("columnheader", { name: "Input: t" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Expected Output" })
    ).toBeInTheDocument();

    // Assert that the progress text is correct for the initial state
    expect(screen.getByText("0 / 2 challenges completed")).toBeInTheDocument();
  });

  it("should call handleUserInputChange when a user types in an input", async () => {
    render(
      <CoverageSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    const inputs = screen.getAllByRole("spinbutton");
    // FIX: Use fireEvent.change for controlled components with static mocked state
    fireEvent.change(inputs[0], { target: { value: "30" } });

    // The first input corresponds to rowIndex 0 and variableName 't'
    expect(handleUserInputChangeMock).toHaveBeenCalledTimes(1);
    expect(handleUserInputChangeMock).toHaveBeenCalledWith(0, "30", "t");
  });

  it("should call runRow when a user clicks the 'Run' button", async () => {
    const user = userEvent.setup();
    render(
      <CoverageSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    const runButtons = screen.getAllByRole("button", { name: "Run" });
    await user.click(runButtons[1]); // Click the button for the second row

    // The second button corresponds to rowIndex 1
    expect(runRowMock).toHaveBeenCalledWith(1);
  });

  it("should display correct and incorrect row states based on hook data", () => {
    // ARRANGE: Mock a state where one row is correct and one is incorrect
    const newState: SavedCoverageState = {
      challengeStates: {
        0: { inputs: { t: "30" }, actualOutput: "Hot", isCorrect: true },
        1: { inputs: { t: "20" }, actualOutput: "Hot", isCorrect: false },
      },
    };
    vi.mocked(useInteractiveTableLogic).mockReturnValue({
      savedState: newState,
      isSectionComplete: false,
      runningStates: {},
      isLoading: false,
      pyodideError: null,
      handleUserInputChange: handleUserInputChangeMock,
      runRow: runRowMock,
    });

    render(
      <CoverageSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    const rows = screen.getAllByRole("row"); // Includes header row

    // ASSERT
    expect(rows[1]).toHaveClass("correctRow");
    expect(rows[2]).toHaveClass("incorrectRow");
    expect(screen.getByText("1 / 2 challenges completed")).toBeInTheDocument();
  });

  it("should apply the 'complete' style to the progress bar when the section is complete", () => {
    // ARRANGE: Mock a state where all challenges are correct and the section is complete
    const completeState: SavedCoverageState = {
      challengeStates: {
        0: { inputs: { t: "30" }, actualOutput: "Hot", isCorrect: true },
        1: { inputs: { t: "20" }, actualOutput: "Normal", isCorrect: true },
      },
    };
    vi.mocked(useInteractiveTableLogic).mockReturnValue({
      savedState: completeState,
      isSectionComplete: true, // Tell the component it's complete
      runningStates: {},
      isLoading: false,
      pyodideError: null,
      handleUserInputChange: vi.fn(),
      runRow: vi.fn(),
    });

    render(
      <CoverageSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // ASSERT
    const progressBar = screen.getByText("2 / 2 challenges completed")
      .previousElementSibling?.firstChild;

    expect(progressBar).toHaveClass("progressFillComplete");
  });
});
