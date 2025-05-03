// src/components/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Import the Header component
import Footer from './Footer'; // Import the Footer component

const Layout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      {/* 'container' class assumed for main content area padding/max-width */}
      {/* Apply flex-grow to make main content fill available space */}
      <main className="container" style={{ padding: '20px', flexGrow: 1 }}>
        {/* Child route components render here */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;