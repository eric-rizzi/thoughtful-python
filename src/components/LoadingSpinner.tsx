// src/components/LoadingSpinner.tsx
import React from "react";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large"; // Optional size prop for flexibility
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = "medium",
}) => {
  return (
    <div className={`${styles.spinnerContainer} ${styles[size]}`}>
      <div className={styles.spinner}></div>
      {message && <p className={styles.spinnerText}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
