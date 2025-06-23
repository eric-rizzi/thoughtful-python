import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UnitPage from "./pages/UnitPage";
import LessonPage from "./pages/LessonPage";
import CodeEditorPage from "./pages/CodeEditorPage";
import ProgressPage from "./pages/ProgressPage";
import LearningEntriesPage from "./pages/LearningEntriesPage";
import ConfigurationPage from "./pages/ConfigurationPage";
import InstructorDashboardPage from "./pages/InstructorDashboardPage";
import Layout from "./components/Layout";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import { useThemeStore } from "./stores/themeStore";
import { useProgressStore, useProgressActions } from "./stores/progressStore";
import StudentLayout from "./components/StudentLayout";

function App() {
  const theme = useThemeStore((state) => state.theme);
  const penaltyEndTime = useProgressStore((state) => state.penaltyEndTime);
  const { clearPenalty } = useProgressActions();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");

    if (theme === "light") {
      root.classList.add("theme-light");
    } else if (theme === "dark") {
      root.classList.add("theme-dark");
    }
    // If theme is 'system', no class is added, and the CSS media query takes over.
  }, [theme]);

  useEffect(() => {
    if (penaltyEndTime === null) {
      return;
    }
    const checkPenalty = () => {
      if (Date.now() >= penaltyEndTime) {
        clearPenalty();
      }
    };
    checkPenalty();
    const intervalId = setInterval(checkPenalty, 1000);
    return () => clearInterval(intervalId);
  }, [penaltyEndTime, clearPenalty]);

  return (
    <Routes>
      {/* Routes that use the standard student-facing layout */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="unit/:unitId" element={<UnitPage />} />
          <Route path="lesson/*" element={<LessonPage />} />
          <Route path="editor" element={<CodeEditorPage />} />
          <Route path="learning-entries" element={<LearningEntriesPage />} />
          <Route path="configure" element={<ConfigurationPage />} />
          <Route
            path="progress"
            element={
              <AuthenticatedRoute>
                <ProgressPage />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div>
                <h2>404 - Page Not Found</h2>
              </div>
            }
          />
        </Route>
      </Route>

      <Route
        path="instructor-dashboard/*"
        element={<InstructorDashboardPage />}
      />
    </Routes>
  );
}

export default App;
