// src/components/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./Layout.module.css"; // Import CSS Module

const Layout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={`${styles.mainContent}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
