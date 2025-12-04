import { describe, it, expect } from 'vitest';
import { estimateStarsInSphere, formatStarCount } from './extra_lib';

describe('estimateStarsInSphere', () => {
	it('estimates stars at 1000 light years within expected range', () => {
		const result = estimateStarsInSphere(1000);

		// Python version gives ~20-30 million stars at 1000 ly
		expect(result.stars).toBeGreaterThan(15_000_000);
		expect(result.stars).toBeLessThan(35_000_000);
		expect(result.fraction).toBeGreaterThan(0);
		expect(result.fraction).toBeLessThan(1);
	});

	it('throws error for negative radius', () => {
		expect(() => estimateStarsInSphere(-100)).toThrow('Sphere radius must be positive');
	});

	it('throws error for zero radius', () => {
		expect(() => estimateStarsInSphere(0)).toThrow('Sphere radius must be positive');
	});

	it('throws error for invalid nShells', () => {
		expect(() => estimateStarsInSphere(1000, -1)).toThrow('Number of shells must be positive');
	});

	it('throws error for invalid samplesPerShell', () => {
		expect(() => estimateStarsInSphere(1000, 200, 0)).toThrow('Samples per shell must be positive');
	});

	it('produces reproducible results with same inputs', () => {
		const result1 = estimateStarsInSphere(1000);
		const result2 = estimateStarsInSphere(1000);

		expect(result1.stars).toBe(result2.stars);
		expect(result1.fraction).toBe(result2.fraction);
	});

	it('shows monotonicity - larger radius has more stars', () => {
		const small = estimateStarsInSphere(500);
		const large = estimateStarsInSphere(1000);

		expect(large.stars).toBeGreaterThan(small.stars);
		expect(large.fraction).toBeGreaterThan(small.fraction);
	});

	it('estimates very small radius correctly', () => {
		const result = estimateStarsInSphere(5);

		// Should be very few stars (< 10)
		expect(result.stars).toBeGreaterThan(0);
		expect(result.stars).toBeLessThan(10);
	});

	it('estimates large radius approaching full galaxy', () => {
		const result = estimateStarsInSphere(100000);

		// Should be close to 100% of galaxy
		expect(result.fraction).toBeGreaterThan(0.9);
		expect(result.fraction).toBeLessThan(1.1); // Allow slight over 100% due to model limits
	});

	it('estimates at 50000 ly shows significant fraction of galaxy', () => {
		const result = estimateStarsInSphere(50000);

		// Python test cases show ~80-90% of disk at 50k ly
		expect(result.fraction).toBeGreaterThan(0.75);
		expect(result.fraction).toBeLessThan(0.95);
	});
});

describe('formatStarCount', () => {
	it('formats very small counts as "< 1 star"', () => {
		expect(formatStarCount(0.3)).toBe('< 1 star');
		expect(formatStarCount(0)).toBe('< 1 star');
	});

	it('formats single digit as plain number', () => {
		expect(formatStarCount(5)).toBe('5');
	});

	it('formats hundreds as plain number', () => {
		expect(formatStarCount(523)).toBe('523');
	});

	it('formats thousands with suffix', () => {
		expect(formatStarCount(1500)).toBe('1.50 thousand');
		expect(formatStarCount(25000)).toBe('25.00 thousand');
	});

	it('formats millions with suffix', () => {
		expect(formatStarCount(1_500_000)).toBe('1.50 million');
		expect(formatStarCount(25_000_000)).toBe('25.00 million');
	});

	it('formats billions with suffix', () => {
		expect(formatStarCount(1_500_000_000)).toBe('1.50 billion');
		expect(formatStarCount(25_000_000_000)).toBe('25.00 billion');
	});
});
