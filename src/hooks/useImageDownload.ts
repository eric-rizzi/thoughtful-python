import { useCallback } from "react";
import type { RealTurtleInstance } from "../lib/turtleRenderer";

interface UseImageDownloadProps {
  turtleInstance: RealTurtleInstance | null;
  filename?: string;
}

export const useImageDownload = ({
  turtleInstance,
  filename = "turtle-drawing.png",
}: UseImageDownloadProps) => {
  const downloadImage = useCallback(() => {
    if (!turtleInstance) {
      console.error("Turtle instance not available for download");
      return;
    }

    const dataURL = turtleInstance.getCanvasDataURL();
    if (!dataURL) {
      console.error("Could not get canvas data URL");
      return;
    }

    // Create a temporary link element to trigger download
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [turtleInstance, filename]);

  return { downloadImage };
};
