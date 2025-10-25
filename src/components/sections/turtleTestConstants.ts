/**
 * Constants for turtle test result styling
 */

export const COLORS = {
  pass: "#4caf50",
  fail: "#f44336",
  primary: "#306998",
  muted: "#999",
  border: "#ccc",
} as const;

export const DIMENSIONS = {
  borderWidth: "4px",
  maxImageWidth: "400px",
} as const;

export const STYLES = {
  heading: { margin: 0 } as React.CSSProperties,
  flexRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "0.5rem",
  } as React.CSSProperties,
  testLabel: {
    fontWeight: "bold",
    marginBottom: "0.5rem",
    fontSize: "0.95em",
    color: COLORS.primary,
  } as React.CSSProperties,
  referenceImage: {
    border: `2px solid ${COLORS.border}`,
    borderRadius: "4px",
    width: "100%",
    maxWidth: DIMENSIONS.maxImageWidth,
    display: "block",
  } as React.CSSProperties,
  noImageText: {
    color: COLORS.muted,
    fontStyle: "italic",
  } as React.CSSProperties,
  similarityText: (passed: boolean) =>
    ({
      color: passed ? COLORS.pass : COLORS.fail,
      fontWeight: "bold",
      marginRight: "0.5rem",
    }) as React.CSSProperties,
} as const;
