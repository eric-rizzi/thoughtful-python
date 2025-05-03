// src/App.tsx (Should already look like this from Step 3 implementation)
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import UnitPage from './pages/UnitPage';
import LessonPage from './pages/LessonPage';
import Layout from './components/Layout'; // Import the Layout component

function App() {
  return (
    <Routes>
      {/* Use Layout as the parent element for nested routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="unit/:unitId" element={<UnitPage />} />
        <Route path="lesson/:lessonId" element={<LessonPage />} />
        {/* Other routes go here */}
        <Route path="*" element={<div><h2>404 - Page Not Found</h2></div>} />
      </Route>
    </Routes>
  );
}

export default App;