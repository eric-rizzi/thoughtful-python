import React from "react";
import { Outlet } from "react-router-dom";
import { PyodideProvider } from "../contexts/PyodideContext";

/**
 * This layout component wraps all student-facing routes that require the
 * Pyodide (in-browser Python) environment.
 */
const StudentLayout: React.FC = () => {
  return (
    <PyodideProvider>
      <Outlet />
    </PyodideProvider>
  );
};

export default StudentLayout;
