// src/pages/ConfigurationPage.tsx
import React, { useState, useEffect } from "react";
import { useSettingsStore, useSettingsActions } from "../stores/settingsStore";
import type { UserSettings } from "../stores/settingsStore";
import styles from "./ConfigurationPage.module.css";

const ConfigurationPage: React.FC = () => {
  // Get current settings and actions from the Zustand store
  const currentSettings = useSettingsStore((state) => ({
    profileImageUrl: state.profileImageUrl,
    progressApiGateway: state.progressApiGateway,
    chatBotApiKey: state.chatBotApiKey,
    chatBotModelId: state.chatBotModelId,
  }));
  const { updateSettings } = useSettingsActions();

  // Local form state, initialized from the store
  const [formState, setFormState] = useState<UserSettings>(currentSettings);
  const [saveStatus, setSaveStatus] = useState<string>(""); // For user feedback

  useEffect(() => {
    // Sync local form state if store changes (e.g., loaded from localStorage initially)
    setFormState(currentSettings);
  }, [currentSettings]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setSaveStatus(""); // Clear save status on new change
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateSettings(formState);
    setSaveStatus("Settings saved successfully!");
    setTimeout(() => setSaveStatus(""), 3000); // Clear status after 3 seconds
  };

  // For profile image, we'll use a URL input for simplicity.
  // File upload and local preview are more involved.
  // For an actual file upload, you'd typically send it to a server.
  // For local only, you could convert to base64, but localStorage has size limits.

  return (
    <div className={styles.configPageContainer}>
      <h2>User & Application Configuration</h2>

      <form onSubmit={handleSubmit} className={styles.configForm}>
        {/* Profile Settings */}
        <section className={styles.configSection}>
          <h3>Profile</h3>
          <div className={styles.formGroup}>
            <label htmlFor="profileImageUrl">Profile Image URL:</label>
            <input
              type="url"
              id="profileImageUrl"
              name="profileImageUrl"
              value={formState.profileImageUrl || ""}
              onChange={handleChange}
              placeholder="https://example.com/your-image.png"
            />
            {formState.profileImageUrl && (
              <div className={styles.imagePreview}>
                <p>Current Preview:</p>
                <img src={formState.profileImageUrl} alt="Profile Preview" />
              </div>
            )}
            <small>
              Enter the URL of an image to use as your profile picture in the
              header.
            </small>
          </div>
        </section>

        {/* Progress Publishing Settings */}
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
              value={formState.progressApiGateway || ""}
              onChange={handleChange}
              placeholder="https://api.example.com/submit-progress"
            />
            <small>
              (Future Feature) Enter the API endpoint where your progress should
              be published. Leave blank if not applicable. When implemented,
              completed work will be sent here.
            </small>
          </div>
        </section>

        {/* ChatBot Feedback Settings */}
        <section className={styles.configSection}>
          <h3>AI Feedback Assistant (ChatBot)</h3>
          <div className={styles.formGroup}>
            <label htmlFor="chatBotApiKey">API Key:</label>
            <input
              type="password" // Use password type for sensitive keys
              id="chatBotApiKey"
              name="chatBotApiKey"
              value={formState.chatBotApiKey || ""}
              onChange={handleChange}
              placeholder="Enter your AI provider API Key"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="chatBotModelId">Model ID / Name:</label>
            <input
              type="text"
              id="chatBotModelId"
              name="chatBotModelId"
              value={formState.chatBotModelId || ""}
              onChange={handleChange}
              placeholder="e.g., gpt-4, claude-3-opus"
            />
            <small>
              (Future Feature) Configure the AI model used for providing
              feedback in Reflection/PRIMM sections.
            </small>
          </div>
          {/* Add more fields here e.g., system prompt, temperature */}
        </section>

        <button type="submit" className={styles.saveButton}>
          Save Settings
        </button>
        {saveStatus && <p className={styles.saveStatus}>{saveStatus}</p>}
      </form>
    </div>
  );
};

export default ConfigurationPage;
