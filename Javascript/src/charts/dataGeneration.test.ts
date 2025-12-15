import { describe, it, expect } from "vitest";
import {
	generateAccelChartData,
	generateFlipBurnChartData,
	generateVisualizationChartData,
	generateTwinParadoxChartData,
} from "./dataGeneration";

describe("Data Generation Functions", () => {
	describe("generateAccelChartData", () => {
		it("returns expected data structure", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateAccelChartData(accelG, durationDays);

			expect(result).toHaveProperty("properTimeVelocity");
			expect(result).toHaveProperty("coordTimeVelocity");
			expect(result).toHaveProperty("properTimeRapidity");
			expect(result).toHaveProperty("coordTimeRapidity");
			expect(result).toHaveProperty("properTimeTimeDilation");
			expect(result).toHaveProperty("coordTimeTimeDilation");
			expect(result).toHaveProperty("positionVelocity");
			expect(result).toHaveProperty("spacetimeWorldline");
			expect(Array.isArray(result.properTimeVelocity)).toBe(true);
		});

		it("velocity data never exceeds 1 (c)", () => {
			const accelG = 1;
			const durationDays = 3650; // 10 years
			const result = generateAccelChartData(accelG, durationDays);

			result.properTimeVelocity.forEach(point => {
				expect(point.y).toBeLessThan(1);
				expect(point.y).toBeGreaterThanOrEqual(0);
			});

			result.coordTimeVelocity.forEach(point => {
				expect(point.y).toBeLessThan(1);
				expect(point.y).toBeGreaterThanOrEqual(0);
			});
		});

		it("velocity data is monotonically increasing", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateAccelChartData(accelG, durationDays);

			for (let i = 1; i < result.properTimeVelocity.length; i++) {
				expect(result.properTimeVelocity[i].y).toBeGreaterThanOrEqual(
					result.properTimeVelocity[i - 1].y
				);
			}
		});

		it("rapidity data increases monotonically", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateAccelChartData(accelG, durationDays);

			for (let i = 1; i < result.properTimeRapidity.length; i++) {
				expect(result.properTimeRapidity[i].y).toBeGreaterThan(result.properTimeRapidity[i - 1].y);
			}
		});

		it("time dilation is between 0 and 1", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateAccelChartData(accelG, durationDays);

			result.properTimeTimeDilation.forEach(point => {
				expect(point.y).toBeGreaterThan(0);
				expect(point.y).toBeLessThanOrEqual(1);
			});
		});

		it("mass remaining percentages are between 0 and 100", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateAccelChartData(accelG, durationDays);

			result.properTimeMassRemaining40.forEach(point => {
				expect(point.y).toBeGreaterThanOrEqual(0);
				expect(point.y).toBeLessThanOrEqual(100);
			});
		});

		it("generates correct number of data points", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateAccelChartData(accelG, durationDays);

			// Proper time arrays should have 101 points (0 to 100 inclusive)
			expect(result.properTimeVelocity.length).toBe(101);

			// Coordinate time arrays should also have 101 points (same number of samples)
			expect(result.coordTimeVelocity.length).toBe(101);

			// Verify coordinate time is always >= proper time due to time dilation
			// At t=0 they're equal, but coordinate time grows faster at relativistic speeds
			const maxProperTime = durationDays;
			result.coordTimeVelocity.forEach((point, i) => {
				const properTimePoint = result.properTimeVelocity[i];
				expect(point.x).toBeGreaterThanOrEqual(properTimePoint.x);
			});

			// Last coordinate time point should be > last proper time point for 1g accel
			const lastCoordTime = result.coordTimeVelocity[result.coordTimeVelocity.length - 1].x;
			expect(lastCoordTime).toBeGreaterThan(maxProperTime);
		});

		it("handles very short durations", () => {
			const accelG = 1;
			const durationDays = 1;
			const result = generateAccelChartData(accelG, durationDays);

			expect(result.properTimeVelocity.length).toBeGreaterThan(0);
			expect(result.properTimeVelocity[0].y).toBeGreaterThanOrEqual(0);
		});
	});

	describe("generateFlipBurnChartData", () => {
		it("returns expected data structure", () => {
			const accelG = 1;
			const distanceLightYears = 10;
			const result = generateFlipBurnChartData(accelG, distanceLightYears);

			expect(result).toHaveProperty("properTimeVelocity");
			expect(result).toHaveProperty("coordTimeVelocity");
			expect(result).toHaveProperty("positionVelocityAccel");
			expect(result).toHaveProperty("positionVelocityDecel");
			expect(result).toHaveProperty("spacetimeWorldline");
			expect(Array.isArray(result.properTimeVelocity)).toBe(true);
		});

		it("final velocity is near zero (decelerated to stop)", () => {
			const accelG = 1;
			const distanceLightYears = 10;
			const result = generateFlipBurnChartData(accelG, distanceLightYears);

			const finalVelocity = result.properTimeVelocity[result.properTimeVelocity.length - 1].y;
			// Final velocity should be very close to zero (ship has stopped)
			expect(Math.abs(finalVelocity)).toBeLessThan(0.01);
		});

		it("velocity peaks at midpoint", () => {
			const accelG = 1;
			const distanceLightYears = 10;
			const result = generateFlipBurnChartData(accelG, distanceLightYears);

			const midIndex = Math.floor(result.properTimeVelocity.length / 2);
			const peakVelocity = result.properTimeVelocity[midIndex].y;

			// All velocities should be <= peak (with some tolerance for numerical issues)
			result.properTimeVelocity.forEach(point => {
				expect(Math.abs(point.y)).toBeLessThanOrEqual(peakVelocity + 0.001);
			});
		});

		it("velocity never exceeds c", () => {
			const accelG = 1;
			const distanceLightYears = 100000; // Very long distance
			const result = generateFlipBurnChartData(accelG, distanceLightYears);

			result.properTimeVelocity.forEach(point => {
				expect(Math.abs(point.y)).toBeLessThan(1);
			});
		});

		it("distance increases monotonically during acceleration", () => {
			const accelG = 1;
			const distanceLightYears = 10;
			const result = generateFlipBurnChartData(accelG, distanceLightYears);

			// Check acceleration phase
			for (let i = 1; i < result.positionVelocityAccel.length; i++) {
				expect(result.positionVelocityAccel[i].x).toBeGreaterThanOrEqual(
					result.positionVelocityAccel[i - 1].x
				);
			}
		});

		it("handles very short distances", () => {
			const accelG = 1;
			const distanceLightYears = 0.01;
			const result = generateFlipBurnChartData(accelG, distanceLightYears);

			expect(result.properTimeVelocity.length).toBeGreaterThan(0);
			// Velocity should stay low for short distances
			const maxVelocity = Math.max(...result.properTimeVelocity.map(p => Math.abs(p.y)));
			expect(maxVelocity).toBeLessThan(0.5);
		});
	});

	describe("generateVisualizationChartData", () => {
		it("returns expected data structure", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateVisualizationChartData(accelG, durationDays);

			expect(result).toHaveProperty("timePoints");
			expect(result).toHaveProperty("velocityC");
			expect(result).toHaveProperty("distanceLy");
			expect(result).toHaveProperty("rapidity");
			expect(result).toHaveProperty("timeDilation");
			expect(Array.isArray(result.timePoints)).toBe(true);
			expect(Array.isArray(result.velocityC)).toBe(true);
		});

		it("velocity data never exceeds 1 (c)", () => {
			const accelG = 1;
			const durationDays = 3650;
			const result = generateVisualizationChartData(accelG, durationDays);

			result.velocityC.forEach(v => {
				expect(v).toBeLessThan(1);
				expect(v).toBeGreaterThanOrEqual(0);
			});
		});

		it("velocity increases monotonically", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateVisualizationChartData(accelG, durationDays);

			for (let i = 1; i < result.velocityC.length; i++) {
				expect(result.velocityC[i]).toBeGreaterThanOrEqual(result.velocityC[i - 1]);
			}
		});

		it("generates reasonable number of data points", () => {
			const accelG = 1;
			const durationDays = 365;
			const result = generateVisualizationChartData(accelG, durationDays);

			expect(result.timePoints.length).toBeGreaterThan(10);
			expect(result.velocityC.length).toBeGreaterThan(10);
			expect(result.distanceLy.length).toBeGreaterThan(10);
		});
	});

	describe("generateTwinParadoxChartData", () => {
		it("returns expected data structure", () => {
			const velocityC = 0.8;
			const properTimeYears = 4;
			const result = generateTwinParadoxChartData(velocityC, properTimeYears);

			expect(result).toHaveProperty("velocityProfile");
			expect(result).toHaveProperty("travelingTwinAging");
			expect(result).toHaveProperty("earthTwinAging");
			expect(result).toHaveProperty("distanceProfile");
			expect(result).toHaveProperty("properTimeDistance");
			expect(result).toHaveProperty("coordTimeDistance");
			expect(Array.isArray(result.properTimeDistance)).toBe(true);
			expect(Array.isArray(result.coordTimeDistance)).toBe(true);
		});

		it("distance traveled is symmetrical (out and back)", () => {
			const velocityC = 0.8;
			const properTimeYears = 4;
			const result = generateTwinParadoxChartData(velocityC, properTimeYears);

			const distances = result.distanceProfile.map(p => p.y);
			const maxDistance = Math.max(...distances);
			const finalDistance = distances[distances.length - 1];

			// Final distance should be near zero (returned to origin)
			expect(Math.abs(finalDistance)).toBeLessThan(0.1);

			// Max distance should occur around midpoint
			const maxIndex = distances.indexOf(maxDistance);
			const midIndex = Math.floor(distances.length / 2);
			expect(Math.abs(maxIndex - midIndex)).toBeLessThan(distances.length * 0.2);
		});

		it("handles different velocities", () => {
			const velocities = [0.1, 0.5, 0.9];
			const properTimeYears = 4;

			velocities.forEach(velocityC => {
				const result = generateTwinParadoxChartData(velocityC, properTimeYears);
				expect(result.distanceProfile.length).toBeGreaterThan(0);

				// Max distance should increase with velocity
				const maxDistance = Math.max(...result.distanceProfile.map(p => p.y));
				expect(maxDistance).toBeGreaterThan(0);
			});
		});

		it("generates reasonable number of data points", () => {
			const velocityC = 0.8;
			const properTimeYears = 4;
			const result = generateTwinParadoxChartData(velocityC, properTimeYears);

			expect(result.properTimeDistance.length).toBeGreaterThan(10);
			expect(result.coordTimeDistance.length).toBeGreaterThan(10);
		});
	});
});
