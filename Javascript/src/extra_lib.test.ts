import { describe, it, expect } from 'vitest';
import { estimateStarsInSphere, formatStarCount } from './extra_lib';

describe('estimateStarsInSphere', () => {
	it('estimates stars at 1000 light years within expected range', () => {
		const result = estimateStarsInSphere(1000);

		// Corrected local density gives ~6-7 million stars at 1000 ly
		expect(result.stars).toBeGreaterThan(5_000_000);
		expect(result.stars).toBeLessThan(8_000_000);
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

		// With corrected density, ~97% of galaxy at 50k ly
		expect(result.fraction).toBeGreaterThan(0.95);
		expect(result.fraction).toBeLessThan(0.99);
	});

	describe('comprehensive accuracy validation', () => {
		// Expected values after correction to match observational astronomy data
		// Format: [radius_ly, expected_stars, notes]
		//
		// NOTE: Local stellar density corrected from 0.014 to 0.004 stars/ly³ based on
		// observational data from HIPPARCOS, Gaia, and RECONS surveys showing ~0.1 stars/pc³
		// (equivalent to 0.004 stars/ly³). This makes nearby star counts match reality.
		const comparisonResults = [
			[5, 2.09, '~1-3 stars (Proxima, α Cen A/B)'],
			[10, 16.60, '~15 stars (incl. Sirius, Barnard\'s)'],
			[20, 131.49, '~120-150 stars'],
			[50, 1976.49, '~2000 stars'],
			[100, 14915.91, '~14,000-20,000 stars (local bubble)'],
			[1000, 6.42e6, '~6-7 million stars (local arm)'],
			[5000, 195.34e6, '~200 million stars'],
			[10000, 855.29e6, '~1% of galaxy'],
			[20000, 5.00e9, '~2-3% of galaxy'],
			[50000, 200.81e9, '~97% of disk'],
			[60000, 203.47e9, '~99% of galaxy'],
			[70000, 204.32e9, '~99.5% of galaxy'],
			[80000, 204.70e9, '~99.8% of galaxy'],
			[85000, 204.81e9, '~99.9% of galaxy'],
			[100000, 204.93e9, '~100% of galaxy (full MW extent, ~200B stars)'],
		] as const;

		comparisonResults.forEach(([radius, expectedStars, notes]) => {
			it(`radius ${radius} ly: ${formatStarCount(expectedStars)} - ${notes}`, () => {
				const result = estimateStarsInSphere(radius);

				// Test that implementation matches expected values from corrected model
				// Allow 1% tolerance for Monte Carlo variance
				const tolerance = expectedStars * 0.01;
				expect(result.stars).toBeGreaterThan(expectedStars - tolerance);
				expect(result.stars).toBeLessThan(expectedStars + tolerance);

				// Verify fraction is reasonable (0-100% with slight overage allowed)
				expect(result.fraction).toBeGreaterThan(0);
				expect(result.fraction).toBeLessThan(1.1);
			});
		});

		it('validates galaxy total is approximately 200 billion stars', () => {
			// The Milky Way is estimated to contain 100-400 billion stars,
			// with 200 billion being a commonly cited value
			const result = estimateStarsInSphere(100000);
			
			// Verify total is in reasonable range
			expect(result.stars).toBeGreaterThan(150e9);  // 150 billion minimum
			expect(result.stars).toBeLessThan(250e9);     // 250 billion maximum
		});
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
