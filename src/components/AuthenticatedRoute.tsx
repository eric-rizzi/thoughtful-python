// src/components/AuthenticatedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import LoadingSpinner from "./LoadingSpinner"; // Optional: for loading state

interface AuthenticatedRouteProps {
  children: JSX.Element;
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    // Optional: Show a loading spinner while auth state is being determined
    // This is useful if your auth state hydration is async on app load
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect them to the home page (or a login page)
    // We can pass the current location in state so they can be redirected back after login,
    // though your current login flow (Google popup) might not use this directly.
    // For simplicity, redirecting to home.
    console.log(
      "User not authenticated, redirecting from AuthenticatedRoute. Current location:",
      location.pathname
    );
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children; // User is authenticated, render the requested component
};

export default AuthenticatedRoute;
