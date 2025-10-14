// src/config/constants.ts
/**
 * Application-wide configuration constants.
 * This file centralizes all magic numbers and configurable values.
 */

/**
 * Pyodide Configuration
 * Settings for the in-browser Python runtime
 */
export const PYODIDE_CONFIG = {
  /**
   * Version of Pyodide to load from CDN
   */
  VERSION: "v0.25.0",

  /**
   * Base URL for Pyodide CDN
   */
  CDN_BASE_URL: "https://cdn.jsdelivr.net/pyodide",

  /**
   * Full URL to Pyodide script (constructed from base + version)
   */
  get SCRIPT_URL(): string {
    return `${this.CDN_BASE_URL}/${this.VERSION}/full/pyodide.js`;
  },

  /**
   * Index URL for Pyodide package loading (constructed from base + version)
   */
  get INDEX_URL(): string {
    return `${this.CDN_BASE_URL}/${this.VERSION}/full/`;
  },

  /**
   * ID for the dynamically injected Pyodide script tag
   */
  SCRIPT_ELEMENT_ID: "pyodide-script",
} as const;

/**
 * Progress Tracking Configuration
 * Settings for section completion and progress sync
 */
export const PROGRESS_CONFIG = {
  /**
   * Duration in milliseconds for the penalty period
   * Applied when user resets lesson progress
   */
  PENALTY_DURATION_MS: 15 * 1000, // 15 seconds

  /**
   * Interval in milliseconds for checking if penalty has expired
   */
  PENALTY_CHECK_INTERVAL_MS: 1000, // 1 second

  /**
   * Base key for localStorage persistence
   */
  STORAGE_KEY: "lesson-progress-storage-v3",
} as const;

/**
 * API Configuration
 * Settings for backend API communication
 */
export const API_CONFIG = {
  /**
   * Default timeout for API requests in milliseconds
   * (Currently not enforced, but available for future use)
   */
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds

  /**
   * Maximum number of retry attempts for failed requests
   * (Currently not implemented, but available for future use)
   */
  MAX_RETRY_ATTEMPTS: 3,

  /**
   * Delay between retry attempts in milliseconds
   * (Currently not implemented, but available for future use)
   */
  RETRY_DELAY_MS: 1000, // 1 second
} as const;

/**
 * UI/UX Configuration
 * Settings for user interface behavior
 */
export const UI_CONFIG = {
  /**
   * Delay in milliseconds before showing success messages
   * Used in ConfigurationPage for theme changes
   */
  SUCCESS_MESSAGE_DELAY_MS: 100,

  /**
   * Duration in milliseconds to show success messages
   * Used in ConfigurationPage for theme changes
   */
  SUCCESS_MESSAGE_DURATION_MS: 2000, // 2 seconds
} as const;

/**
 * Mock API Configuration
 * Settings for simulated API delays in development
 */
export const MOCK_API_CONFIG = {
  /**
   * Simulated delay for mock API responses in milliseconds
   */
  RESPONSE_DELAY_MS: 500, // 0.5 seconds
} as const;

/**
 * Type exports for better type safety
 */
export type PyodideConfig = typeof PYODIDE_CONFIG;
export type ProgressConfig = typeof PROGRESS_CONFIG;
export type ApiConfig = typeof API_CONFIG;
export type UiConfig = typeof UI_CONFIG;
export type MockApiConfig = typeof MOCK_API_CONFIG;
