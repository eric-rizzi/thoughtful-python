import React from "react";
import { VideoBlock as VideoBlockData } from "../../types/data";
import styles from "./ContentRenderer.module.css";

interface VideoBlockProps {
  block: VideoBlockData;
}

const VideoBlock: React.FC<VideoBlockProps> = ({ block }) => {
  const getEmbedUrl = (url: string): string | null => {
    try {
      const urlObject = new URL(url);

      // Handle YouTube URLs
      if (urlObject.hostname.includes("youtube.com")) {
        const videoId = urlObject.searchParams.get("v");
        // Check for timestamp 't' parameter (e.g., &t=120s)
        let embedUrl = `https://www.youtube.com/embed/${videoId}?`;

        if (block.start) {
          embedUrl += `start=${block.start}&`;
        }
        if (block.end) {
          embedUrl += `end=${block.end}`;
        }
        return embedUrl;
      }

      // Handles youtu.be short links
      if (urlObject.hostname.includes("youtu.be")) {
        // Handles youtu.be short links
        const pathParts = urlObject.pathname.split("/");
        const videoId = pathParts[pathParts.length - 1];
        let embedUrl = `https://www.youtube.com/embed/${videoId}?`;

        if (block.start) {
          embedUrl += `start=${block.start}&`;
        }
        if (block.end) {
          embedUrl += `end=${block.end}`;
        }
        return embedUrl;
      }

      // Handle Vimeo URLs
      if (urlObject.hostname.includes("vimeo.com")) {
        const pathParts = urlObject.pathname.split("/");
        const videoId = pathParts[pathParts.length - 1];

        if (videoId && /^\d+$/.test(videoId)) {
          // Check for timestamp in the hash (e.g., #t=1m2s)
          const timestamp = urlObject.hash.substring(1); // Remove '#'
          let embedUrl = `https://player.vimeo.com/video/${videoId}`;
          if (timestamp) {
            embedUrl += `#${timestamp}`;
          }
          return embedUrl;
        }
      }
    } catch (e) {
      console.error("Invalid URL passed to VideoBlock:", url, e);
      return null;
    }

    return null; // Return null if the URL is not a valid YouTube or Vimeo link
  };

  const embedUrl = getEmbedUrl(block.src);

  if (!embedUrl) {
    return (
      <div className={styles.contentBlock}>
        Invalid or unsupported video URL provided.
      </div>
    );
  }

  return (
    <div className={styles.contentBlock}>
      <div className={styles.videoContainer}>
        <iframe
          src={embedUrl}
          title={block.caption || "Embedded Video"}
          className={styles.videoIframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      {block.caption && <p className={styles.videoCaption}>{block.caption}</p>}
    </div>
  );
};

export default VideoBlock;
