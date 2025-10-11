import { screen } from "@testing-library/react";
import { vi } from "vitest";

import { render } from "../../../test-utils";
import ImageBlock from "../ImageBlock";
import type { ImageBlock as ImageBlockData } from "../../../types/data";

// Mock the config module to provide a consistent BASE_PATH for tests
vi.mock("../../../config", () => ({
  BASE_PATH: "/mock-base-path",
}));

describe("ImageBlock", () => {
  it("constructs the correct URL for a local image source", () => {
    const mockBlock: ImageBlockData = {
      kind: "image",
      src: "local/python-logo.png",
      alt: "A local Python logo",
    };

    render(<ImageBlock block={mockBlock} />);

    const img = screen.getByAltText("A local Python logo");
    expect(img).toBeInTheDocument();
    // Verify that the BASE_PATH prefix is added
    expect(img).toHaveAttribute("src", "/mock-base-path/local/python-logo.png");
  });

  it("uses the source URL directly for an external image", () => {
    const mockBlock: ImageBlockData = {
      kind: "image",
      src: "https://example.com/some-image.jpg",
      alt: "An external image",
    };

    render(<ImageBlock block={mockBlock} />);

    const img = screen.getByAltText("An external image");
    expect(img).toBeInTheDocument();
    // Verify that the src is used as-is
    expect(img).toHaveAttribute("src", "https://example.com/some-image.jpg");
  });

  it("applies the maxWidth style when maxWidthPercentage is provided", () => {
    const mockBlock: ImageBlockData = {
      kind: "image",
      src: "local/another-image.png",
      alt: "A sized image",
      maxWidthPercentage: 50,
    };

    render(<ImageBlock block={mockBlock} />);

    const img = screen.getByAltText("A sized image");
    // Use .toHaveStyle to check for inline styles
    expect(img).toHaveStyle("max-width: 50%");
  });

  it("does not apply the maxWidth style when maxWidthPercentage is not provided", () => {
    const mockBlock: ImageBlockData = {
      kind: "image",
      src: "local/full-width-image.png",
      alt: "A full-width image",
    };

    render(<ImageBlock block={mockBlock} />);

    const img = screen.getByAltText("A full-width image");
    // FIX: Directly check the style property on the element. If it wasn't set,
    // it will be an empty string.
    expect(img.style.maxWidth).toBe("");
  });
});
