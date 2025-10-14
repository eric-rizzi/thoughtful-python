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
import { useAuthStore } from "./stores/authStore";
import StudentLayout from "./components/StudentLayout";
import SyncingOverlay from "./components/SyncingOverlay";
import SessionExpiredModal from "./components/SessionExpiredModal";
import { PROGRESS_CONFIG } from "./config/constants";

function App() {
  const theme = useThemeStore((state) => state.theme);
  const isSyncingProgress = useAuthStore((state) => state.isSyncingProgress);
  const sessionHasExpired = useAuthStore((state) => state.sessionHasExpired);
  const { logout, setSessionExpired } = useAuthStore((state) => state.actions);
  const penaltyEndTime = useProgressStore((state) => state.penaltyEndTime);
  const { clearPenalty } = useProgressActions();

  const handleModalClose = () => {
    logout(); // Peforms a full logout, clearing the stale state
    setSessionExpired(false); // Reset the flag for the next session
  };

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
    const intervalId = setInterval(
      checkPenalty,
      PROGRESS_CONFIG.PENALTY_CHECK_INTERVAL_MS
    );
    return () => clearInterval(intervalId);
  }, [penaltyEndTime, clearPenalty]);

  return (
    <>
      {isSyncingProgress && <SyncingOverlay />}
      <SessionExpiredModal
        isOpen={sessionHasExpired}
        onClose={handleModalClose}
      />
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
    </>
  );
}

export default App;
