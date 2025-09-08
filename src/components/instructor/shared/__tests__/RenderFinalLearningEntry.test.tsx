import { screen } from "@testing-library/react";
import { vi } from "vitest";

import { render } from "../../../../test-utils";
import RenderFinalLearningEntry from "../RenderFinalLearningEntry";
import * as dataLoader from "../../../../lib/dataLoader";
import type { ReflectionVersionItem } from "../../../../types/apiServiceTypes";

// Mock the dataLoader module to control the getLessonPathSync function
vi.mock("../../../../lib/dataLoader");

// --- Mock Data ---
const mockEntry: ReflectionVersionItem = {
  versionId: "v-final-123",
  lessonId: "lesson-abc",
  sectionId: "reflect-xyz",
  userTopic: "State Management in React",
  userCode: "const [count, setCount] = useState(0);",
  userExplanation:
    "The useState hook is used to add state to functional components.",
  createdAt: "2024-01-01T10:00:00Z",
  aiAssessment: "achieves",
  aiFeedback: "This is a clear and accurate explanation.",
};

describe("RenderFinalLearningEntry", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Default mock for a successful path lookup
    vi.mocked(dataLoader.getLessonPathSync).mockReturnValue(
      "unit-1/lesson-abc-path"
    );
  });

  it("renders all details of a complete learning entry", () => {
    render(<RenderFinalLearningEntry entry={mockEntry} />);

    // Check for the main topic/title
    expect(screen.getByText("State Management in React")).toBeInTheDocument();

    // Check for the formatted date
    expect(
      screen.getByText(new Date(mockEntry.createdAt).toLocaleString())
    ).toBeInTheDocument();

    // Check for the code and explanation
    expect(
      screen.getByText("const [count, setCount] = useState(0);")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The useState hook is used to add state to functional components."
      )
    ).toBeInTheDocument();

    // Check for the AI assessment and feedback
    expect(screen.getByText("ACHIEVES")).toBeInTheDocument();
    expect(
      screen.getByText("This is a clear and accurate explanation.")
    ).toBeInTheDocument();

    // Check that the link to the original section is correct
    const link = screen.getByRole("link", { name: /from section/i });
    expect(link).toHaveAttribute("href", "/lesson/unit-1/lesson-abc-path");
  });

  it("handles an entry with missing optional data gracefully", () => {
    // ARRANGE: Create an entry with no topic or AI feedback
    const partialEntry: ReflectionVersionItem = {
      ...mockEntry,
      userTopic: undefined,
      aiAssessment: undefined,
      aiFeedback: undefined,
    };

    render(<RenderFinalLearningEntry entry={partialEntry} />);

    // Should render a default title
    expect(screen.getByText("Untitled Entry")).toBeInTheDocument();

    // The AI feedback block should not be rendered at all
    expect(
      screen.queryByRole("heading", { name: /ai assessment/i })
    ).toBeNull();
  });

  it("handles a missing lesson path for the context link", () => {
    // ARRANGE: Mock the function to return null
    vi.mocked(dataLoader.getLessonPathSync).mockReturnValue(null);

    render(<RenderFinalLearningEntry entry={mockEntry} />);

    // The link should now point to the root path and have a title indicating the issue
    const link = screen.getByRole("link", { name: /from section/i });
    // FIX: react-router-dom resolves '#' to '/' in the test environment's BrowserRouter
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("title", "Lesson path not found");
  });
});
