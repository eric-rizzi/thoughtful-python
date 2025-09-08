import { screen } from "@testing-library/react";
import { vi } from "vitest";

import { render } from "../../../test-utils";
import CodeBlock from "../CodeBlock";
import CodeEditor from "../../CodeEditor"; // Import the actual component for mocking
import type { CodeBlock as CodeBlockData } from "../../../types/data";

// Mock the child CodeEditor component
vi.mock("../../CodeEditor", () => ({
  default: vi.fn(() => <div>Mocked CodeEditor</div>),
}));

const mockBlockData: CodeBlockData = {
  kind: "code",
  value: "print('Hello from CodeBlock!')",
};

describe("CodeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render a read-only CodeEditor and pass the correct props", () => {
    render(<CodeBlock block={mockBlockData} />);

    // 1. Assert that our mocked child component is on the screen
    expect(screen.getByText("Mocked CodeEditor")).toBeInTheDocument();

    // 2. Assert that the child component was called exactly once
    expect(CodeEditor).toHaveBeenCalledTimes(1);

    // 3. Assert that the child component was called with the correct props
    const expectedProps = {
      value: "print('Hello from CodeBlock!')",
      onChange: expect.any(Function), // It should be a no-op function
      readOnly: true,
      height: "auto",
    };

    // We check the first argument of the first call to the mock
    expect(vi.mocked(CodeEditor).mock.calls[0][0]).toEqual(expectedProps);
  });
});
