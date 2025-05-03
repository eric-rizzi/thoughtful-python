// src/pages/HomePage.tsx
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div>
      <h2>Home Page</h2>
      <p>List of learning paths (units) will go here.</p>
      {/* Link examples (will be functional later) */}
      <a href="/unit/intro_python">Go to Intro Python Unit</a>
    </div>
  );
};

export default HomePage;