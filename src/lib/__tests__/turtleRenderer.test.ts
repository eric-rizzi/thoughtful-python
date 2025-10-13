import {
  normalizeAngle,
  calculateSpeedsFromTurtleSpeed,
} from "../turtleRenderer";

describe("turtleRenderer utility functions", () => {
  describe("normalizeAngle", () => {
    it("should return angles within -180 to 180 unchanged", () => {
      expect(normalizeAngle(90)).toBe(90);
      expect(normalizeAngle(-90)).toBe(-90);
      expect(normalizeAngle(0)).toBe(0);
      expect(normalizeAngle(180)).toBe(180);
      expect(normalizeAngle(-180)).toBe(-180);
    });

    it("should normalize angles greater than 180", () => {
      expect(normalizeAngle(270)).toBe(-90);
      expect(normalizeAngle(200)).toBe(-160);
      expect(normalizeAngle(360)).toBe(0);
    });

    it("should normalize angles less than -180", () => {
      expect(normalizeAngle(-270)).toBe(90);
      expect(normalizeAngle(-200)).toBe(160);
      expect(normalizeAngle(-360)).toBe(0);
    });

    it("should handle multiple full rotations", () => {
      expect(normalizeAngle(450)).toBe(90); // 360 + 90
      expect(normalizeAngle(720)).toBe(0); // Two full rotations
      expect(normalizeAngle(810)).toBe(90); // 720 + 90
      expect(normalizeAngle(-450)).toBe(-90); // -360 - 90
      expect(normalizeAngle(-720)).toBe(0); // Negative two full rotations
    });

    it("should handle edge cases near boundaries", () => {
      expect(normalizeAngle(181)).toBe(-179);
      expect(normalizeAngle(-181)).toBe(179);
      expect(normalizeAngle(540)).toBe(180); // 360 + 180 = 540, normalized to 180
    });
  });

  describe("calculateSpeedsFromTurtleSpeed", () => {
    it("should return infinite speeds for speed 0 (instant mode)", () => {
      const result = calculateSpeedsFromTurtleSpeed(0);
      expect(result.moveSpeed).toBe(Infinity);
      expect(result.turnSpeed).toBe(Infinity);
    });

    it("should map speed 1 to slowest movement", () => {
      const result = calculateSpeedsFromTurtleSpeed(1);
      expect(result.moveSpeed).toBe(0.5);
      expect(result.turnSpeed).toBe(1); // turnSpeed = moveSpeed * 2
    });

    it("should map speed 6 (default) correctly", () => {
      const result = calculateSpeedsFromTurtleSpeed(6);
      expect(result.moveSpeed).toBe(4); // speedMap[6] = 4
      expect(result.turnSpeed).toBe(8); // turnSpeed = moveSpeed * 2
    });

    it("should map speed 10 to fastest movement", () => {
      const result = calculateSpeedsFromTurtleSpeed(10);
      expect(result.moveSpeed).toBe(10);
      expect(result.turnSpeed).toBe(20);
    });

    it("should map intermediate speeds correctly", () => {
      const result3 = calculateSpeedsFromTurtleSpeed(3);
      expect(result3.moveSpeed).toBe(1.5);
      expect(result3.turnSpeed).toBe(3);

      const result5 = calculateSpeedsFromTurtleSpeed(5);
      expect(result5.moveSpeed).toBe(3); // speedMap[5] = 3
      expect(result5.turnSpeed).toBe(6); // turnSpeed = moveSpeed * 2
    });

    it("should clamp speeds below 1 to speed 1", () => {
      const resultNegative = calculateSpeedsFromTurtleSpeed(-5);
      expect(resultNegative.moveSpeed).toBe(0.5); // Same as speed 1
      expect(resultNegative.turnSpeed).toBe(1);

      const resultZeroPoint5 = calculateSpeedsFromTurtleSpeed(0.5);
      expect(resultZeroPoint5.moveSpeed).toBe(0.5); // Clamped to speed 1
      expect(resultZeroPoint5.turnSpeed).toBe(1);
    });

    it("should clamp speeds above 10 to speed 10", () => {
      const result15 = calculateSpeedsFromTurtleSpeed(15);
      expect(result15.moveSpeed).toBe(10); // Same as speed 10
      expect(result15.turnSpeed).toBe(20);

      const result100 = calculateSpeedsFromTurtleSpeed(100);
      expect(result100.moveSpeed).toBe(10);
      expect(result100.turnSpeed).toBe(20);
    });

    it("should maintain turnSpeed as double moveSpeed", () => {
      // Test several speeds to ensure the 2x relationship holds
      for (let speed = 1; speed <= 10; speed++) {
        const result = calculateSpeedsFromTurtleSpeed(speed);
        expect(result.turnSpeed).toBe(result.moveSpeed * 2);
      }
    });
  });
});
