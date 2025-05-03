// src/components/Footer.tsx
import React from 'react';
// Assuming you have ported relevant styles from base.css to a global CSS
// or will create a Footer.module.css file.
// import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    // Use className={styles.footer} if using CSS Modules
    <footer style={{ backgroundColor: '#306998', color: 'white', padding: '1.5rem 0', textAlign: 'center', marginTop: '2rem' }}>
      <div className="container"> {/* Assuming 'container' class provides max-width and centering */}
        <p>&copy; {currentYear} Thoughtful Python Lessons</p> {/* Updated name slightly */}
      </div>
    </footer>
  );
};

export default Footer;