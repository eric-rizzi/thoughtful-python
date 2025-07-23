import React from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuthActions } from "../stores/authStore";
import styles from "./SessionExpiredModal.module.css";

const SessionExpiredModal: React.FC = () => {
  const { login } = useAuthActions();

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        // The login action already handles setting the new state and syncing progress.
        await login(credentialResponse.credential);
        // The modal will disappear automatically when the sessionHasExpired state is reset.
      } catch (e) {
        console.error("Re-login process failed:", e);
        // Optionally show an error message within the modal
      }
    } else {
      console.error("Login failed: No credential returned from Google.");
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>Session Expired</h2>
        <p>Your session has timed out. Please log in again to continue.</p>
        <div className={styles.loginButtonWrapper}>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => {
              console.error("Google Login Failed");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
