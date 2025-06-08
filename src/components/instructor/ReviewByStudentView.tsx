import React, { useState } from "react";
import type { UserId } from "../../types/data";
import type { InstructorStudentInfo } from "../../types/apiServiceTypes";
import styles from "./InstructorViews.module.css";
import ReviewStudentDetailView from "./shared/ReviewStudentDetailView"; // Import the new component

interface ReviewByStudentViewProps {
  permittedStudents: InstructorStudentInfo[];
  // The 'units' prop is no longer needed here as the detail view fetches its own data
}

const ReviewByStudentView: React.FC<ReviewByStudentViewProps> = ({
  permittedStudents,
}) => {
  const [viewingStudentId, setViewingStudentId] = useState<UserId | null>(null);

  // If a student is selected, render the detailed view
  if (viewingStudentId) {
    return (
      <ReviewStudentDetailView
        studentId={viewingStudentId}
        onBack={() => setViewingStudentId(null)}
      />
    );
  }

  // Otherwise, render the student selector list
  return (
    <div className={styles.viewContainer}>
      <h3>Review by Student</h3>
      <p>
        Select a student to view their detailed progress and submissions across
        the curriculum.
      </p>

      <div
        className={styles.assignmentListContainer}
        style={{ maxHeight: "60vh" }}
      >
        <ul className={styles.assignmentList}>
          {permittedStudents.map((student) => (
            <li
              key={student.studentId}
              className={styles.assignmentListItem}
              onClick={() => setViewingStudentId(student.studentId)}
            >
              <span className={styles.assignmentTitle}>
                {student.studentName || student.studentId}
              </span>
              <span className={styles.assignmentMeta}>
                {student.studentEmail}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {permittedStudents.length === 0 && (
        <p className={styles.placeholderMessage}>
          No students are currently assigned to you.
        </p>
      )}
    </div>
  );
};

export default ReviewByStudentView;
