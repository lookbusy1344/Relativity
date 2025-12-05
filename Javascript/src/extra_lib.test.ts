import { describe, it, expect } from 'vitest';
import { estimateStarsInSphere, formatStarCount } from './extra_lib';

describe('estimateStarsInSphere', () => {
	it('estimates stars at 1000 light years within expected range', () => {
		const result = estimateStarsInSphere(1000);

		// With corrected disk scale height (300 pc = 1000 ly), ~10 million stars at 1000 ly
		// The disk is thicker than previously modeled, containing more stars
		expect(result.stars).toBeGreaterThan(9_000_000);
		expect(result.stars).toBeLessThan(11_000_000);
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

		// With corrected model parameters:
		// - Disk scale height: 1000 ly (300 pc, not 300 ly)
		// - Bulge fraction: ~15% of total (not 89%)
		// At 50k ly we capture ~90% of galaxy (disk extends beyond, halo is sparse)
		expect(result.fraction).toBeGreaterThan(0.85);
		expect(result.fraction).toBeLessThan(0.92);
	});

	describe('comprehensive accuracy validation', () => {
		// Expected values based on corrected galactic model
		// See docs/galactic-stellar-density-research.md for sources
		//
		// Key corrections from observational astronomy:
		// - Local density: 0.0034 stars/ly³ (0.12 stars/pc³ from RECONS/Gaia)
		// - Disk scale height: 1000 ly (300 pc, NOT 300 ly - unit conversion error fixed)
		// - Disk scale length: 10,000 ly (3.1 kpc)
		// - Bulge: ~15% of total stellar mass (not 89% as in broken model)
		//
		// Total galaxy: ~105 billion fusing stars (within 100-400B observational range)
		// Distribution: 90% at 50k ly, 97% at 70k ly, 99% at 100k ly
		const comparisonResults = [
			[5, 1.78, '~1-3 stars (Proxima, α Cen A/B)'],
			[10, 14.24, '~12-15 known stars (incl. Sirius, Barnard\'s)'],
			[20, 113.5, '~100-130 stars'],
			[50, 1754, '~1700-2000 stars'],
			[100, 13778, '~12,000-15,000 stars (local bubble)'],
			[1000, 10.09e6, '~10 million stars (thicker disk than old model)'],
			[5000, 507.3e6, '~500 million stars'],
			[10000, 2.27e9, '~2.3B stars (~2% of galaxy)'],
			[20000, 11.66e9, '~12B stars (~11% of galaxy)'],
			[50000, 94.76e9, '~95B stars (~90% of galaxy)'],
			[60000, 99.97e9, '~100B stars (~95% of galaxy)'],
			[70000, 102.5e9, '~103B stars (~97% of galaxy)'],
			[80000, 103.7e9, '~104B stars (~98% of galaxy)'],
			[85000, 104.0e9, '~104B stars (~98% of galaxy)'],
			[100000, 104.6e9, '~105B fusing stars (full MW extent)'],
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
			// Our corrected model produces ~105 billion fusing stars, which:
			// - Uses observationally-constrained local density (0.0034 stars/ly³)
			// - Has correct disk scale height (1000 ly = 300 pc)
			// - Has realistic bulge fraction (~15% of total)
			// - Produces correct spatial distribution (90% at 50k ly, 99% at 100k ly)
			//
			// This is on the lower end of estimates but consistent with counting
			// only hydrogen-fusing stars (excluding brown dwarfs) and using
			// conservative local density measurements.
			const result = estimateStarsInSphere(100000);

			// Verify total is in reasonable range (80-130B for fusing stars)
			expect(result.stars).toBeGreaterThan(80e9);   // 80 billion minimum
			expect(result.stars).toBeLessThan(130e9);     // 130 billion maximum
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
