import React from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuthStore } from "../stores/authStore"; // Use the main store
import styles from "./SessionExpiredModal.module.css";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login } = useAuthStore((state) => state.actions);

  // If the modal isn't supposed to be open, render nothing.
  if (!isOpen) {
    return null;
  }

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        await login(credentialResponse.credential);
      } catch (e) {
        console.error("Re-login process failed:", e);
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
        <button onClick={onClose} className={styles.closeButton}>
          Cancel and Log Out
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
