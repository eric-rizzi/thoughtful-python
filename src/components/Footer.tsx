// src/components/Footer.tsx
import React from 'react';
import styles from './Footer.module.css'; // Import CSS Module

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}> {/* Use imported style */}
      <div className={styles.container}> {/* Use imported style */}
        <p>&copy; {currentYear} Thoughtful Python Lessons</p>
      </div>
    </footer>
  );
};

export default Footer;