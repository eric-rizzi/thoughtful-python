import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { render } from "../../../test-utils";
import MultipleChoiceSection from "../MultipleChoiceSection";
import { useQuizLogic } from "../../../hooks/useQuizLogic";
import type {
  MultipleChoiceSectionData,
  UnitId,
  LessonId,
  SectionId,
} from "../../../types/data";

vi.mock("../../../hooks/useQuizLogic");

const mockSectionData: MultipleChoiceSectionData = {
  kind: "MultipleChoice",
  id: "test-mcq" as SectionId,
  title: "Test Question",
  content: [
    {
      kind: "text",
      value: "What is 2 + 2?",
    },
  ],
  options: ["3", "4", "5"],
  correctAnswer: 1,
  feedback: { correct: "You got it!" },
};

describe("MultipleChoiceSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the handleOptionChange and handleSubmit actions from its hook on user interaction", async () => {
    const user = userEvent.setup();
    const handleOptionChangeMock = vi.fn();
    const handleSubmitMock = vi.fn();

    // ARRANGE: Mock the initial state where no option is selected.
    vi.mocked(useQuizLogic).mockReturnValue({
      selectedIndices: [],
      isSubmitted: false,
      isCorrect: null,
      isLocallyDisabled: false,
      remainingPenaltyTime: 0,
      isSectionComplete: false,
      handleOptionChange: handleOptionChangeMock,
      handleSubmit: handleSubmitMock,
      handleTryAgain: vi.fn(),
      canTryAgain: false,
      selectedOptionsSet: new Set(),
    });

    const { rerender } = render(
      <MultipleChoiceSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // ACT 1: Simulate user clicking an option.
    const optionToSelect = screen.getByLabelText("4");
    await user.click(optionToSelect);

    // ASSERT 1: The component should have called the function to change the option.
    expect(handleOptionChangeMock).toHaveBeenCalledWith(1);

    // ARRANGE 2: Now, we simulate the state update that would happen in React.
    // We update the mock's return value to reflect that an option has been selected.
    vi.mocked(useQuizLogic).mockReturnValue({
      selectedIndices: [1], // An option is now selected
      isSubmitted: false,
      isCorrect: null,
      isLocallyDisabled: false,
      remainingPenaltyTime: 0,
      isSectionComplete: false,
      handleOptionChange: handleOptionChangeMock,
      handleSubmit: handleSubmitMock,
      handleTryAgain: vi.fn(),
      canTryAgain: false,
      selectedOptionsSet: new Set([1]),
    });

    // Re-render the component with the new state from the hook.
    rerender(
      <MultipleChoiceSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // ACT 2: Find and click the submit button, which is now enabled.
    const submitButton = screen.getByRole("button", { name: /submit answer/i });
    expect(submitButton).not.toBeDisabled(); // Verify it's enabled
    await user.click(submitButton);

    // ASSERT 2: The component should have now called the submit function.
    expect(handleSubmitMock).toHaveBeenCalledTimes(1);
  });

  it("displays feedback and disables the form when the hook reports the question is submitted and correct", () => {
    // ARRANGE: This test remains the same, as it tests the "submitted" state.
    vi.mocked(useQuizLogic).mockReturnValue({
      selectedIndices: [1],
      isSubmitted: true,
      isCorrect: true,
      isLocallyDisabled: true,
      remainingPenaltyTime: 0,
      isSectionComplete: true,
      handleOptionChange: vi.fn(),
      handleSubmit: vi.fn(),
      handleTryAgain: vi.fn(),
      canTryAgain: false,
      selectedOptionsSet: new Set([1]),
    });

    render(
      <MultipleChoiceSection
        section={mockSectionData}
        unitId={"unit-1" as UnitId}
        lessonId={"lesson-1" as LessonId}
      />
    );

    // ASSERT
    const feedbackMessage = screen.getByText("You got it!");
    expect(feedbackMessage).toBeInTheDocument();

    const submitButton = screen.queryByRole("button", {
      name: /submit answer/i,
    });
    expect(submitButton).toBeNull();

    const firstOption = screen.getByLabelText("3");
    expect(firstOption).toBeDisabled();

    const secondOption = screen.getByLabelText("4");
    expect(secondOption).toBeDisabled();

    const thirdOption = screen.getByLabelText("5");
    expect(thirdOption).toBeDisabled();
  });
});
