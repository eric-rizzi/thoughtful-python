import { useEffect } from "react"; // Added useEffect
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
import { useProgressStore, useProgressActions } from "./stores/progressStore"; // Import store and actions

function App() {
  // Get penaltyEndTime and clearPenalty action from the store
  const penaltyEndTime = useProgressStore((state) => state.penaltyEndTime);
  const { clearPenalty } = useProgressActions();

  // Effect to monitor and clear penalty when time expires
  useEffect(() => {
    if (penaltyEndTime === null) {
      return; // No active penalty, do nothing
    }

    const checkPenalty = () => {
      if (Date.now() >= penaltyEndTime) {
        clearPenalty();
        // console.log("Penalty cleared by App.tsx timer.");
      }
    };

    // Check immediately in case the page was refreshed and penalty already expired
    checkPenalty();

    // Set up an interval to check periodically
    // This ensures the penalty clears even if the user stays on the page
    const intervalId = setInterval(checkPenalty, 1000); // Check every second

    // Cleanup function to clear the interval when the component unmounts
    // or when penaltyEndTime changes (which will re-run this effect)
    return () => clearInterval(intervalId);
  }, [penaltyEndTime, clearPenalty]); // Re-run effect if penaltyEndTime or clearPenalty changes

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="unit/:unitId" element={<UnitPage />} />
        <Route path="lesson/*" element={<LessonPage />} />
        <Route path="editor" element={<CodeEditorPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="learning-entries" element={<LearningEntriesPage />} />
        <Route path="configure" element={<ConfigurationPage />} />
        <Route
          path="instructor-dashboard"
          element={
            <AuthenticatedRoute>
              <InstructorDashboardPage />
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
    </Routes>
  );
}

export default App;
