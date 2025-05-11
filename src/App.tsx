import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UnitPage from "./pages/UnitPage";
import LessonPage from "./pages/LessonPage";
import CodeEditorPage from "./pages/CodeEditorPage";
import LearningEntriesPage from "./pages/LearningEntriesPage";
import ConfigurationPage from "./pages/ConfigurationPage";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      {/* Use Layout as the parent element for nested routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="unit/:unitId" element={<UnitPage />} />
        <Route path="lesson/*" element={<LessonPage />} />
        <Route path="editor" element={<CodeEditorPage />} />{" "}
        <Route path="learning-entries" element={<LearningEntriesPage />} />
        <Route path="configure" element={<ConfigurationPage />} />
        {/* Other routes go here */}
        <Route
          path="*"
          element={
            <div>
              <h2>404 - Page Not Found</h2>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
