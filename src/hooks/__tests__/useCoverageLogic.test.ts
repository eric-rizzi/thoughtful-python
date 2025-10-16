import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useCoverageLogic } from "../useCoverageLogic";
import { usePyodide } from "../../contexts/PyodideContext";
import { useSectionProgress } from "../useSectionProgress";
import type {
  UnitId,
  LessonId,
  SectionId,
  CoverageChallenge,
  InputParam,
  SavedCoverageState,
} from "../../types/data";

// --- Mocks Setup ---
vi.mock("../../contexts/PyodideContext");
vi.mock("../useSectionProgress");

const mockedUsePyodide = vi.mocked(usePyodide);
const mockedUseSectionProgress = vi.mocked(useSectionProgress);

// --- Mock Data ---
const mockParams: InputParam[] = [{ name: "x", type: "number" }];
const mockChallenges: CoverageChallenge[] = [
  { id: "c1", expectedOutput: "Positive" },
  { id: "c2", expectedOutput: "Negative" },
];
const mockHookProps = {
  unitId: "u1" as UnitId,
  lessonId: "l1" as LessonId,
  sectionId: "s1" as SectionId,
  codeToRun: "if x > 0: print('Positive')\nelse: print('Negative')",
  inputParams: mockParams,
  coverageChallenges: mockChallenges,
};

describe("useCoverageLogic", () => {
  const runPythonCodeMock = vi.fn();
  const setSavedStateMock = vi.fn();
  let mockCurrentState: SavedCoverageState;

  // Helper to create the initial state for the mock
  const createInitialState = (): SavedCoverageState => ({
    challengeStates: {
      c1: { inputs: { x: "" }, actualOutput: null, isCorrect: null },
      c2: { inputs: { x: "" }, actualOutput: null, isCorrect: null },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePyodide.mockReturnValue({
      runPythonCode: runPythonCodeMock,
      isLoading: false,
      error: null,
    });
    // The mock now returns a state variable we can control in each test
    mockCurrentState = createInitialState();
    mockedUseSectionProgress.mockImplementation(() => [
      mockCurrentState,
      setSavedStateMock,
      false, // isSectionComplete
    ]);
  });

  it("should initialize with the correct state for all challenges", () => {
    const { result } = renderHook(() => useCoverageLogic(mockHookProps));

    expect(result.current.challengeStates["c1"]).toBeDefined();
    expect(result.current.challengeStates["c2"]).toBeDefined();
    expect(result.current.challengeStates["c1"].inputs.x).toBe("");
    expect(result.current.challengeStates["c1"].isCorrect).toBeNull();
  });

  it("should call setSavedState when handleInputChange is triggered", () => {
    const { result } = renderHook(() => useCoverageLogic(mockHookProps));

    act(() => {
      result.current.handleInputChange("c1", "x", "10");
    });

    expect(setSavedStateMock).toHaveBeenCalledTimes(1);
    expect(setSavedStateMock).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should run a challenge with the correct input and update state on success", async () => {
    // ARRANGE: Set the state as if the user has already typed the correct input
    mockCurrentState.challengeStates.c1.inputs.x = "10";

    runPythonCodeMock.mockResolvedValue({
      success: true,
      stdout: "Positive\n",
      stderr: "",
      result: null,
      error: null,
    });

    const { result } = renderHook(() => useCoverageLogic(mockHookProps));

    // ACT
    await act(async () => {
      await result.current.runChallenge(mockChallenges[0]);
    });

    // ASSERT
    expect(runPythonCodeMock).toHaveBeenCalledWith(
      "x = 10\n\n" + mockHookProps.codeToRun
    );
    expect(setSavedStateMock).toHaveBeenCalledWith(expect.any(Function));

    // To verify the final state, we can capture the updater function and apply it
    const lastUpdater = setSavedStateMock.mock.calls.slice(-1)[0][0];
    const finalState = lastUpdater(mockCurrentState); // Apply the update

    expect(finalState.challengeStates.c1.isCorrect).toBe(true);
    expect(finalState.challengeStates.c1.actualOutput).toBe("Positive");
  });

  it("should update state with isCorrect: false for an incorrect output", async () => {
    // ARRANGE: Set the state with incorrect input
    mockCurrentState.challengeStates.c1.inputs.x = "-5";

    runPythonCodeMock.mockResolvedValue({
      success: true,
      stdout: "Negative\n",
      stderr: "",
      result: null,
      error: null,
    });

    const { result } = renderHook(() => useCoverageLogic(mockHookProps));

    // ACT
    await act(async () => {
      await result.current.runChallenge(mockChallenges[0]); // Run against the "Positive" challenge
    });

    const lastUpdater = setSavedStateMock.mock.calls.slice(-1)[0][0];
    const finalState = lastUpdater(mockCurrentState);

    expect(finalState.challengeStates.c1.isCorrect).toBe(false);
    expect(finalState.challengeStates.c1.actualOutput).toBe("Negative");
  });
});
