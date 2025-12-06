import { describe, it, expect } from 'vitest';
import { estimateStarsInSphere, formatStarCount } from './extra_lib';

describe('estimateStarsInSphere', () => {
	it('estimates stars at 1000 light years within expected range', () => {
		const result = estimateStarsInSphere(1000);

		// With effective disk scale height (~860 pc) combining thin+thick disk
		// Model produces ~12.5 million stars at 1000 ly
		expect(result.stars).toBeGreaterThan(11_000_000);
		expect(result.stars).toBeLessThan(14_000_000);
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

		// With calibrated model (~200B total):
		// - Effective disk captures thin+thick disk populations
		// - Component proportions: 83% disk, 16% bulge, 1% halo
		// At 50k ly we capture ~85% of galaxy (outer disk and halo extend beyond)
		expect(result.fraction).toBeGreaterThan(0.82);
		expect(result.fraction).toBeLessThan(0.88);
	});

	describe('comprehensive accuracy validation', () => {
		// Expected values based on calibrated galactic model targeting ~200B stars
		// See docs/galactic-stellar-density-research.md for sources
		//
		// Model parameters:
		// - Local density: 0.0034 stars/ly³ (0.12 stars/pc³ from RECONS/Gaia)
		// - Disk scale height: 2800 ly (~860 pc effective, combines thin+thick disk)
		// - Disk scale length: 11,500 ly (3.5 kpc)
		// - Component proportions: Disk 83%, Bulge 16%, Halo 1%
		//
		// Total galaxy: ~200 billion stars (middle of 100-400B observational range)
		// Distribution: 85% at 50k ly, 97% at 70k ly, 99% at 100k ly
		const comparisonResults = [
			[5, 1.78, '~1-3 stars (Proxima, α Cen A/B)'],
			[10, 14.23, '~12-15 known stars (incl. Sirius, Barnard\'s)'],
			[20, 113.7, '~100-130 stars'],
			[50, 1770, '~1700-2000 stars'],
			[100, 14066, '~12,000-15,000 stars (local bubble)'],
			[1000, 12.50e6, '~12 million stars'],
			[5000, 1.007e9, '~1B stars'],
			[10000, 5.37e9, '~5B stars (~3% of galaxy)'],
			[20000, 27.80e9, '~28B stars (~14% of galaxy)'],
			[50000, 170.9e9, '~171B stars (~85% of galaxy)'],
			[60000, 185.5e9, '~186B stars (~93% of galaxy)'],
			[70000, 193.1e9, '~193B stars (~97% of galaxy)'],
			[80000, 196.7e9, '~197B stars (~98% of galaxy)'],
			[85000, 197.7e9, '~198B stars (~99% of galaxy)'],
			[100000, 199.3e9, '~200B stars (full MW extent)'],
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
			// The Milky Way is estimated to contain 100-400 billion stars.
			// Our calibrated model produces ~200 billion stars, which:
			// - Uses observationally-constrained local density (0.0034 stars/ly³)
			// - Has effective disk scale height (2800 ly = 860 pc) combining thin+thick disk
			// - Has realistic component proportions (83% disk, 16% bulge, 1% halo)
			// - Produces correct spatial distribution (85% at 50k ly, 97% at 70k ly)
			//
			// This is in the middle of observational estimates and uses
			// an effective single-disk model that captures both thin and thick populations.
			const result = estimateStarsInSphere(100000);

			// Verify total is in reasonable range (180-220B)
			expect(result.stars).toBeGreaterThan(180e9);   // 180 billion minimum
			expect(result.stars).toBeLessThan(220e9);      // 220 billion maximum
		});
	});
});

describe('formatStarCount', () => {
	it('formats very small counts as "< 1 star"', () => {
		expect(formatStarCount(0.3)).toBe('< 1 star');
		expect(formatStarCount(0)).toBe('< 1 star');
	});

	it('formats single digit with tilde prefix', () => {
		expect(formatStarCount(5)).toBe('~5');
	});

	it('formats hundreds with tilde prefix', () => {
		expect(formatStarCount(523)).toBe('~523');
	});

	it('formats thousands with thousand separators', () => {
		expect(formatStarCount(1500)).toBe('~1,500');
		expect(formatStarCount(25000)).toBe('~25,000');
		expect(formatStarCount(866150)).toBe('~866,200');
	});

	it('formats millions with thousand separators', () => {
		expect(formatStarCount(1_500_000)).toBe('~1,500,000');
		expect(formatStarCount(25_000_000)).toBe('~25,000,000');
		expect(formatStarCount(12_560_000)).toBe('~12,560,000');
	});

	it('formats billions with thousand separators', () => {
		expect(formatStarCount(1_500_000_000)).toBe('~1,500,000,000');
		expect(formatStarCount(25_000_000_000)).toBe('~25,000,000,000');
	});
});
