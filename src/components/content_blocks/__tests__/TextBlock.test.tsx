import { screen } from "@testing-library/react";
import { render } from "../../../test-utils";
import TextBlock from "../TextBlock";
import type { TextBlock as TextBlockData } from "../../../types/data";

describe("TextBlock", () => {
  it("renders a simple paragraph of text correctly", () => {
    const mockBlock: TextBlockData = {
      kind: "text",
      value: "This is a simple line of text.",
    };

    render(<TextBlock block={mockBlock} />);

    // ReactMarkdown will wrap the text in a <p> tag
    const paragraph = screen.getByText("This is a simple line of text.");
    expect(paragraph).toBeInTheDocument();
    expect(paragraph.tagName).toBe("P");
  });

  it("renders markdown content into the correct HTML elements", () => {
    const mockBlock: TextBlockData = {
      kind: "text",
      value: "# Main Heading\n\nThis is **bold** text.",
    };

    render(<TextBlock block={mockBlock} />);

    // Check for the H1 heading
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Main Heading",
    });
    expect(heading).toBeInTheDocument();

    // Check for the bolded text. ReactMarkdown renders **bold** as <strong>.
    const boldText = screen.getByText("bold");
    expect(boldText).toBeInTheDocument();
    expect(boldText.tagName).toBe("STRONG");
  });
});
