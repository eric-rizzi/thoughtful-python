import React from "react";
import { ImageBlock as ImageBlockData } from "../../types/data";
import styles from "./ContentRenderer.module.css";
import { BASE_PATH } from "../../config";

interface ImageBlockProps {
  block: ImageBlockData;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  // Construct the full path to the image
  const imageUrl = `${BASE_PATH}images/${block.src}`;

  return (
    <div className={`${styles.contentBlock} ${styles.imageContainer}`}>
      <img src={imageUrl} alt={block.alt} className={styles.image} />
      {block.alt && <p className={styles.imageCaption}>{block.alt}</p>}
    </div>
  );
};

export default ImageBlock;
