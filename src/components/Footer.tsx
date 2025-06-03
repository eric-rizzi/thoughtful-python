// src/components/Footer.tsx
import React from "react";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>&copy; {currentYear} Thoughtful Python Lessons</p>
      </div>
    </footer>
  );
};

export default Footer;
