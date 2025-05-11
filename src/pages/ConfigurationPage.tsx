// src/pages/ConfigurationPage.tsx
import React, { useState, useEffect } from "react";
// Import the new store
import { useApiSettingsStore } from "../stores/apiSettingsStore";
import styles from "./ConfigurationPage.module.css";

const ConfigurationPage: React.FC = () => {
  // Get current settings and actions from the new Zustand store
  const progressApiUrlFromStore = useApiSettingsStore(
    (state) => state.progressApiGateway
  );
  const setProgressApiUrlInStore = useApiSettingsStore(
    (state) => state.setProgressApiGateway
  );

  // Local form state for this single field
  const [localApiUrl, setLocalApiUrl] = useState<string>(
    progressApiUrlFromStore || ""
  );
  const [saveStatus, setSaveStatus] = useState<string>("");

  // Sync local form state if store changes (e.g., loaded from localStorage initially)
  useEffect(() => {
    setLocalApiUrl(progressApiUrlFromStore || "");
  }, [progressApiUrlFromStore]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalApiUrl(e.target.value);
    setSaveStatus(""); // Clear save status on new change
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProgressApiUrlInStore(localApiUrl); // Update the store
    setSaveStatus("API Gateway URL saved successfully!");
    setTimeout(() => setSaveStatus(""), 3000); // Clear status after 3 seconds
  };

  console.log(
    "Rendering ConfigurationPage, API URL from store:",
    progressApiUrlFromStore
  );

  return (
    <div className={styles.configPageContainer}>
      <h2>Application Configuration (API Gateway Test)</h2>

      <form onSubmit={handleSubmit} className={styles.configForm}>
        <section className={styles.configSection}>
          <h3>Progress Publishing</h3>
          <div className={styles.formGroup}>
            <label htmlFor="progressApiGateway">
              Progress API Gateway URL:
            </label>
            <input
              type="url"
              id="progressApiGateway"
              name="progressApiGateway"
              value={localApiUrl} // Use local state for input
              onChange={handleChange}
              placeholder="https://api.example.com/submit-progress"
            />
            <small>
              (Future Feature) Enter the API endpoint where your progress should
              be published.
            </small>
          </div>
        </section>

        <button type="submit" className={styles.saveButton}>
          Save API URL
        </button>
        {saveStatus && <p className={styles.saveStatus}>{saveStatus}</p>}
      </form>
    </div>
  );
};

export default ConfigurationPage;
