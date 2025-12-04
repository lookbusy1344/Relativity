import { describe, it, expect } from 'vitest';
import { estimateStarsInSphere, formatStarCount } from './extra_lib';

describe('estimateStarsInSphere', () => {
	it('estimates stars at 1000 light years within expected range', () => {
		const result = estimateStarsInSphere(1000);

		// Corrected local density (midpoint) gives ~5-6 million stars at 1000 ly
		expect(result.stars).toBeGreaterThan(4_500_000);
		expect(result.stars).toBeLessThan(7_000_000);
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

		// With corrected density (midpoint), ~85% of galaxy at 50k ly
		expect(result.fraction).toBeGreaterThan(0.80);
		expect(result.fraction).toBeLessThan(0.90);
	});

	describe('comprehensive accuracy validation', () => {
		// Expected values after correction to match observational astronomy data
		// Format: [radius_ly, expected_stars, notes]
		//
		// NOTE: Local stellar density corrected from 0.014 to 0.0034 stars/ly³ based on
		// observational data from HIPPARCOS, Gaia, and RECONS surveys showing 0.1-0.14 stars/pc³.
		// Using midpoint of range: 0.12 stars/pc³ = 0.00346 stars/ly³ ≈ 0.0034 stars/ly³.
		// This represents the best estimate rather than the high end of the range.
		const comparisonResults = [
			[5, 1.78, '~1-3 stars (Proxima, α Cen A/B)'],
			[10, 14.11, '~15 stars (incl. Sirius, Barnard\'s)'],
			[20, 111.77, '~120 stars'],
			[50, 1680.02, '~1700-2000 stars'],
			[100, 12678.52, '~12,000-14,000 stars (local bubble)'],
			[1000, 5.46e6, '~5-6 million stars (local arm)'],
			[5000, 166.04e6, '~170 million stars'],
			[10000, 726.50e6, '~0.7B stars (~0.4% of galaxy)'],
			[20000, 4.25e9, '~4.2B stars (~2% of galaxy)'],
			[50000, 170.80e9, '~170B stars (~85% of galaxy)'],
			[60000, 173.46e9, '~173B stars (~87% of galaxy)'],
			[70000, 174.31e9, '~174B stars (~87% of galaxy)'],
			[80000, 174.69e9, '~175B stars (~87% of galaxy)'],
			[85000, 174.80e9, '~175B stars (~87% of galaxy)'],
			[100000, 174.92e9, '~175B stars (full MW extent, ~200B stars)'],
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

		it('validates galaxy total is in reasonable range', () => {
			// The Milky Way is estimated to contain 100-400 billion stars,
			// with 200 billion being a commonly cited value. Our model with
			// midpoint local density gives ~175B stars, which is within
			// the acceptable range and prioritizes accuracy for nearby stars.
			const result = estimateStarsInSphere(100000);

			// Verify total is in reasonable range (allow 100-250B)
			expect(result.stars).toBeGreaterThan(100e9);  // 100 billion minimum
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
