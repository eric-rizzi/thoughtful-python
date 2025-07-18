import React from "react";
import { ImageBlock as ImageBlockData } from "../../types/data";
import styles from "./ContentRenderer.module.css";
import { BASE_PATH } from "../../config";

interface ImageBlockProps {
  block: ImageBlockData;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  // Construct the full path to the image
  let imageUrl: string;
  if (block.src.startsWith("https")) {
    imageUrl = block.src;
  } else {
    imageUrl = `${BASE_PATH}images/${block.src}`;
  }

  const imageStyles: React.CSSProperties = {};
  if (block.maxWidthPercentage) {
    imageStyles.maxWidth = `${block.maxWidthPercentage}%`;
  }

  return (
    <div className={`${styles.contentBlock} ${styles.imageContainer}`}>
      <img
        src={imageUrl}
        alt={block.alt}
        className={styles.image}
        style={imageStyles}
      />
      {block.alt && <p className={styles.imageCaption}>{block.alt}</p>}
    </div>
  );
};

export default ImageBlock;
