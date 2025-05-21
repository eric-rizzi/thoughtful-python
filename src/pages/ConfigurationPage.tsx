import React, { useState, useEffect } from "react";
import styles from "./ConfigurationPage.module.css";
import { useApiSettingsStore } from "../stores/apiSettingsStore";
import {
  saveProgress,
  loadProgress,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../lib/localStorageUtils";
import { useAuthStore } from "../stores/authStore";

const ConfigurationPage: React.FC = () => {
  // --- For Progress API Gateway URL (uses apiSettingsStore) ---
  const progressApiUrlFromStore = useApiSettingsStore(
    (state) => state.progressApiGateway
  );
  const setProgressApiUrlInStore = useApiSettingsStore(
    (state) => state.setProgressApiGateway
  );

  // Local React state for the form input for progressApiGateway, initialized from the store
  const [formProgressApiGateway, setFormProgressApiGateway] =
    useState<string>("");

  useEffect(() => {
    setFormProgressApiGateway(progressApiUrlFromStore || "");
  }, [progressApiUrlFromStore]);

  // --- For ChatBot specific settings (can continue using existing user-specific storage) ---
  const [chatbotVersion, setChatbotVersion] = useState<string>("");
  const [chatbotApiKey, setChatbotApiKey] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Example: Load ChatBot settings from their user-specific key
  const authUser = useAuthStore((state) => state.user); // Get user for user-specific keys
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentStorageUserId =
    isAuthenticated && authUser ? authUser.id : ANONYMOUS_USER_ID_PLACEHOLDER;

  useEffect(() => {
    // Load ChatBot specific settings if they are stored under "chatbot_config"
    const savedChatBotConfig = loadProgress<{
      progressApiGateway?: string;
      chatbotVersion: string;
      chatbotApiKey: string;
    }>(
      currentStorageUserId,
      "chatbot_config" // Your original CONFIG_STORAGE_KEY
    );
    if (savedChatBotConfig) {
      setChatbotVersion(savedChatBotConfig.chatbotVersion || "");
      setChatbotApiKey(savedChatBotConfig.chatbotApiKey || "");
    }
  }, [currentStorageUserId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Save the Progress API Gateway URL to its dedicated global store (apiSettingsStore)
    // This will update "api-gateway-settings-storage" in localStorage
    setProgressApiUrlInStore(formProgressApiGateway);
    console.log(
      `[ConfigurationPage] Set progressApiGateway in apiSettingsStore to: "${formProgressApiGateway}"`
    );

    // 2. Save OTHER settings (e.g., chatbot specific ones) to their user-specific key if needed
    const chatBotSpecificSettings = {
      chatbotVersion: chatbotVersion,
      chatbotApiKey: chatbotApiKey,
    };
    saveProgress(
      currentStorageUserId,
      "chatbot_config",
      chatBotSpecificSettings
    );
    console.log(
      `[ConfigurationPage] Saved chatbot specific settings to "${currentStorageUserId}_chatbot_config":`,
      chatBotSpecificSettings
    );

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className={styles.configPageContainer}>
      <h2>Configuration Settings</h2>
      <form onSubmit={handleSave} className={styles.configForm}>
        <div className={styles.configSection}>
          <h3>API Gateway Settings</h3>
          <div className={styles.formGroup}>
            <label htmlFor="api-gateway-url">Progress API Gateway URL:</label>
            <input
              type="url"
              id="api-gateway-url"
              value={formProgressApiGateway} // Bound to local form state
              onChange={(e) => setFormProgressApiGateway(e.target.value)}
              placeholder="e.g., https://your-api-gateway-url.com/prod"
            />
            <small>
              Global URL for the backend API gateway that manages lesson
              progress.
            </small>
          </div>
        </div>

        <div className={styles.configSection}>
          <h3>ChatBot Configuration</h3>
          <div className={styles.formGroup}>
            <label htmlFor="chatbot-version">ChatBot Version:</label>
            <input
              type="text"
              id="chatbot-version"
              value={chatbotVersion}
              onChange={(e) => setChatbotVersion(e.target.value)}
              placeholder="e.g., models/gemini-1.5-flash"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="chatbot-api-key">ChatBot API Key:</label>
            <input
              type="password"
              id="chatbot-api-key"
              value={chatbotApiKey}
              onChange={(e) => setChatbotApiKey(e.target.value)}
              placeholder="Enter your API Key"
            />
          </div>
        </div>

        <button type="submit" className={styles.saveButton}>
          Save Configuration
        </button>
        {isSaved && <p className={styles.saveStatus}>Configuration saved!</p>}
      </form>
    </div>
  );
};

export default ConfigurationPage;
