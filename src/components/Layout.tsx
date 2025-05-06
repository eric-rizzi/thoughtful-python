// src/components/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./Layout.module.css"; // Import CSS Module

const Layout: React.FC = () => {
  return (
    <div className={styles.layout}>
      {" "}
      {/* Use layout style */}
      <Header />
      {/* Apply container class directly here if preferred, or ensure pages apply it */}
      <main className={`${styles.mainContent} ${styles.container}`}>
        <Outlet /> {/* Child route components render here */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
