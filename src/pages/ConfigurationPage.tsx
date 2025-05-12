// src/pages/ConfigurationPage.tsx
import React, { useState, useEffect } from "react";
import styles from "./ConfigurationPage.module.css";
import { saveProgress, loadProgress } from "../lib/localStorageUtils";

interface ChatBotConfig {
  progressApiGateway: string; // Existing field
  chatbotVersion: string; // New field for ChatBot version
  chatbotApiKey: string; // New field for ChatBot API Key
}

const CONFIG_STORAGE_KEY = "chatbot_config"; // Changed to be more specific if needed, but can reuse

const ConfigurationPage: React.FC = () => {
  const [progressApiGateway, setProgressApiGateway] = useState<string>(""); // Existing state
  const [chatbotVersion, setChatbotVersion] = useState<string>(""); // New state for ChatBot version
  const [chatbotApiKey, setChatbotApiKey] = useState<string>(""); // New state for ChatBot API Key
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    const savedConfig = loadProgress<ChatBotConfig>(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      setProgressApiGateway(savedConfig.progressApiGateway || ""); // Ensure it's not undefined
      setChatbotVersion(savedConfig.chatbotVersion || ""); // Load new field
      setChatbotApiKey(savedConfig.chatbotApiKey || ""); // Load new field
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: ChatBotConfig = {
      progressApiGateway,
      chatbotVersion, // Save new field
      chatbotApiKey, // Save new field
    };
    saveProgress(CONFIG_STORAGE_KEY, newConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide saved message after 3 seconds
  };

  return (
    <div className={styles.configPageContainer}>
      {" "}
      {/* Use the new class for the container */}
      <h2>Configuration Settings</h2>
      <p className={styles.introText}>
        Adjust the application's settings here.
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

        {/* New ChatBot Configuration Section */}
        <div className={styles.configSection}>
          <h3>ChatBot Configuration</h3>
          <p className={styles.sectionDescription}>
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
              placeholder="e.g., v1.0 or gpt-4o"
              required
            />
            <small>
              Specify the version or model identifier of the ChatBot.
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
              required
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
