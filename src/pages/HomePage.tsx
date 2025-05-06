// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchUnitsData } from "../lib/dataLoader"; // Step 6 utility
import type { Unit } from "../types/data"; // Step 6 types
import styles from "./HomePage.module.css"; // Step 7 CSS Module
import { BASE_PATH } from "../config"; // Import BASE_PATH

const HomePage: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const unitsData = await fetchUnitsData();
        setUnits(unitsData.units);
      } catch (err) {
        console.error("HomePage Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Empty dependency array means this runs once on mount

  const defaultImagePath = `${BASE_PATH}images/default-unit.svg`; // Path relative to deployment root

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    // Type assertion needed because TS doesn't know target is an image
    const target = event.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop if default image also fails
    target.src = defaultImagePath;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.loading}>
          <p>Loading learning paths...</p>
          <div className={styles.spinner}></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          Error loading learning paths: {error}
        </div>
      );
    }

    if (units.length === 0) {
      return (
        <div className={styles.loading}>
          <p>No learning paths available yet. Check back soon!</p>
        </div>
      );
    }

    return (
      <div className={styles.unitsGrid}>
        {units.map((unit) => (
          // Use Link component for client-side navigation
          <Link
            to={`/unit/${unit.id}`}
            key={unit.id}
            className={styles.unitCardLink}
          >
            <div className={styles.unitCard}>
              <div className={styles.unitImageContainer}>
                <img
                  // Construct image path using BASE_PATH
                  src={`${BASE_PATH}images/${unit.image || "default-unit.svg"}`}
                  alt={`${unit.title} image`}
                  className={styles.unitImage}
                  onError={handleImageError} // Fallback for broken images
                />
              </div>
              <div className={styles.unitContent}>
                <h3 className={styles.unitTitle}>{unit.title}</h3>
                <p className={styles.unitDescription}>{unit.description}</p>
                <div className={styles.unitDetails}>
                  <div className={styles.unitLessons}>
                    {unit.lessons.length} lessons
                  </div>
                  <button className={styles.unitButton}>Start Learning</button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div>
      <section className={styles.welcome}>
        <h2>Welcome to Interactive Python Learning</h2>
        <p>
          Learn Python programming directly in your browser - no installation
          required!
        </p>
      </section>

      {/* Optional Features Section - can be removed if not needed */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <h3>Interactive Code Editor</h3>
          <p>Write and execute Python code directly in your browser.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Step-by-Step Lessons</h3>
          <p>Learn programming concepts through guided exercises.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Instant Feedback</h3>
          <p>See your code results immediately as you type.</p>
        </div>
      </section>

      <section className={styles.learningPaths}>
        <h2>Learning Paths</h2>
        <p>Choose a learning path to begin your Python journey.</p>
        {renderContent()}
      </section>
    </div>
  );
};

export default HomePage;
