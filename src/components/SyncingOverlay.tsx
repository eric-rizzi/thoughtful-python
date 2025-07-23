import React from "react";
import LoadingSpinner from "./LoadingSpinner";
import styles from "./SyncingOverlay.module.css";

const SyncingOverlay: React.FC = () => {
  return (
    <div className={styles.overlayBackdrop}>
      <div className={styles.overlayContent}>
        <LoadingSpinner />
        <p>Syncing your progress...</p>
      </div>
    </div>
  );
};

export default SyncingOverlay;
