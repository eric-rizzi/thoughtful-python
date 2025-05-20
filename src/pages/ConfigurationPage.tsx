// src/pages/ConfigurationPage.tsx
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import styles from "./ConfigurationPage.module.css";
import {
  saveProgress,
  loadProgress,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../lib/localStorageUtils";
import { useAuthStore } from "../stores/authStore"; // Import useAuthStore

interface ChatBotConfig {
  progressApiGateway: string;
  chatbotVersion: string;
  chatbotApiKey: string;
}

const CONFIG_STORAGE_KEY = "chatbot_config";

const ConfigurationPage: React.FC = () => {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const currentStorageUserId = useMemo(() => {
    return isAuthenticated && authUser
      ? authUser.id
      : ANONYMOUS_USER_ID_PLACEHOLDER;
  }, [isAuthenticated, authUser]);

  const [progressApiGateway, setProgressApiGateway] = useState<string>("");
  const [chatbotVersion, setChatbotVersion] = useState<string>("");
  const [chatbotApiKey, setChatbotApiKey] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    // Load config auth-aware
    const savedConfig = loadProgress<ChatBotConfig>(
      currentStorageUserId,
      CONFIG_STORAGE_KEY
    );
    if (savedConfig) {
      setProgressApiGateway(savedConfig.progressApiGateway || "");
      setChatbotVersion(savedConfig.chatbotVersion || "");
      setChatbotApiKey(savedConfig.chatbotApiKey || "");
    } else {
      // Reset to defaults if no saved config for this user/anonymous
      setProgressApiGateway("");
      setChatbotVersion("");
      setChatbotApiKey("");
    }
  }, [currentStorageUserId]); // Reload if user changes

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: ChatBotConfig = {
      progressApiGateway,
      chatbotVersion,
      chatbotApiKey,
    };
    // Save config auth-aware
    saveProgress(currentStorageUserId, CONFIG_STORAGE_KEY, newConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className={styles.configPageContainer}>
      <h2>Configuration Settings</h2>
      <p className={styles.introText}>
        Adjust the application's settings here. Settings are saved per-user or
        for anonymous sessions.
      </p>
      <form onSubmit={handleSave} className={styles.configForm}>
        <div className={styles.configSection}>
          <h3>API Gateway Settings</h3>
          <div className={styles.formGroup}>
            <label htmlFor="api-gateway-url">Progress API Gateway URL:</label>
            <input
              type="url"
              id="api-gateway-url"
              value={progressApiGateway}
              onChange={(e) => setProgressApiGateway(e.target.value)}
              placeholder="e.g., https://your-api-gateway-url.com/prod"
            />
            <small>
              URL for the backend API gateway that manages lesson progress.
            </small>
          </div>
        </div>

        <div className={styles.configSection}>
          <h3>ChatBot Configuration</h3>
          <p /*className={styles.sectionDescription}*/>
            {" "}
            {/* Assuming this class may not exist or is not critical */}
            Configure the ChatBot version and API Key for assessing reflection
            sections and learning entries.
          </p>
          <div className={styles.formGroup}>
            <label htmlFor="chatbot-version">ChatBot Version:</label>
            <input
              type="text"
              id="chatbot-version"
              value={chatbotVersion}
              onChange={(e) => setChatbotVersion(e.target.value)}
              placeholder="e.g., models/gemini-1.5-flash or similar"
              // Removed 'required' to allow saving even if empty,
              // the reflection section can handle missing config.
            />
            <small>
              Specify the version or model identifier of the ChatBot (e.g., from
              Google AI Studio).
            </small>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="chatbot-api-key">ChatBot API Key:</label>
            <input
              type="password"
              id="chatbot-api-key"
              value={chatbotApiKey}
              onChange={(e) => setChatbotApiKey(e.target.value)}
              placeholder="Enter your API Key"
              // Removed 'required'
            />
            <small>
              Your API key for authenticating with the ChatBot service.
            </small>
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
