// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchUnitsData } from "../lib/dataLoader";
import type { Unit } from "../types/data";
import styles from "./HomePage.module.css";
import { BASE_PATH } from "../config";

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
  }, []);

  const defaultImagePath = `${BASE_PATH}images/default-unit.svg`;

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = event.target as HTMLImageElement;
    target.onerror = null;
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
          <Link
            to={`/unit/${unit.id}`}
            key={unit.id}
            className={styles.unitCardLink}
          >
            <div className={styles.unitCard}>
              <div className={styles.unitImageContainer}>
                <img
                  src={`${BASE_PATH}images/${unit.image || "default-unit.svg"}`}
                  alt={`${unit.title} image`}
                  className={styles.unitImage}
                  onError={handleImageError}
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
    <div className={styles.homePageContainer}>
      <section className={styles.welcome}>
        <h2>Welcome to Interactive Python Learning</h2>
        <p>
          Learn Python programming directly in your browser - no installation
          required!
        </p>
      </section>
      <section className={styles.philosophySection}>
        <h3>The Philosophy of this website is:</h3>
        <ul>
          <li>Anyone can learn Python</li>
          <li>
            Python is a wonderful way to order your thoughts and accomplish
            complex tasks
          </li>
          <li>
            Like any language, learning Python takes a lot of concentration and
            practice
          </li>
          <li>
            The best way to learn a language is PRIMM: Predict, Run,
            Investigate, Modify, Make
          </li>
          <li>The best way to solidify your knowledge is through reflection</li>
          <li>
            There are many wonderful tools (e.g., VSCode) that are a bit
            overwhelming for first time learners
          </li>
          <li>
            Once you have a base understanding, it's easy to jump to these more
            powerful tools
          </li>
        </ul>
        <p>
          This website can be viewed as the first step on your programming
          journey. It will help you establish a strong foundation Python
          fundamentals and effective learning processes. Once you feel more
          confident, you'll be well-prepared to explore other more powerful
          tools.
        </p>
      </section>
      <section className={styles.learningPaths}>
        <h2>Learning Paths</h2>
        <p className={styles.learningPathsIntro}>
          {" "}
          Choose a learning path to begin your Python journey.
        </p>
        {renderContent()}
      </section>
    </div>
  );
};

export default HomePage;
