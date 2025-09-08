import { screen } from "@testing-library/react";
import { render } from "../../../test-utils";
import VideoBlock from "../VideoBlock";
import type { VideoBlock as VideoBlockData } from "../../../types/data";

describe("VideoBlock", () => {
  it("correctly generates an embed URL for a standard YouTube link", () => {
    const mockBlock: VideoBlockData = {
      kind: "video",
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      caption: "Test YouTube Video",
    };

    render(<VideoBlock block={mockBlock} />);

    const iframe = screen.getByTitle("Test YouTube Video");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?"
    );
  });

  it("correctly generates an embed URL for a YouTube link with start and end times", () => {
    const mockBlock: VideoBlockData = {
      kind: "video",
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      caption: "Timed YouTube Video",
      start: 30,
      end: 60,
    };

    render(<VideoBlock block={mockBlock} />);

    const iframe = screen.getByTitle("Timed YouTube Video");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?start=30&end=60"
    );
  });

  it("correctly generates an embed URL for a youtu.be short link", () => {
    const mockBlock: VideoBlockData = {
      kind: "video",
      src: "https://youtu.be/dQw4w9WgXcQ",
      caption: "Short YouTube Video",
    };

    render(<VideoBlock block={mockBlock} />);

    const iframe = screen.getByTitle("Short YouTube Video");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?"
    );
  });

  it("correctly generates an embed URL for a Vimeo link", () => {
    const mockBlock: VideoBlockData = {
      kind: "video",
      src: "https://vimeo.com/123456789",
      caption: "Test Vimeo Video",
    };

    render(<VideoBlock block={mockBlock} />);

    const iframe = screen.getByTitle("Test Vimeo Video");
    expect(iframe).toHaveAttribute(
      "src",
      "https://player.vimeo.com/video/123456789"
    );
  });

  it("renders a caption when one is provided", () => {
    const mockBlock: VideoBlockData = {
      kind: "video",
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      caption: "This is a test caption.",
    };

    render(<VideoBlock block={mockBlock} />);

    // The caption is rendered as a <p> tag
    const caption = screen.getByText("This is a test caption.");
    expect(caption).toBeInTheDocument();
    expect(caption.tagName).toBe("P");
  });

  it("renders an error message for an unsupported URL", () => {
    const mockBlock: VideoBlockData = {
      kind: "video",
      src: "https://example.com/not-a-video",
    };

    render(<VideoBlock block={mockBlock} />);

    expect(
      screen.getByText("Invalid or unsupported video URL provided.")
    ).toBeInTheDocument();
    // The iframe should not be rendered
    expect(screen.queryByRole("iframe")).toBeNull();
  });

  it("renders an error message for a completely invalid URL string", () => {
    const mockBlock: VideoBlockData = {
      kind: "video",
      src: "this-is-not-a-url",
    };

    render(<VideoBlock block={mockBlock} />);

    expect(
      screen.getByText("Invalid or unsupported video URL provided.")
    ).toBeInTheDocument();
  });
});
