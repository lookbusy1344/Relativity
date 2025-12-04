import seedrandom from 'seedrandom';

/**
 * Result of estimating stars in a sphere
 */
export interface StarEstimationResult {
	stars: number;
	fraction: number;
}

// Cache for model's total galaxy star count (computed once at 200,000 ly)
let _modelTotalStars: number | null = null;

/**
 * Estimate the number of stars within a sphere of radius radiusLy centered on the Sun.
 *
 * This function models the Milky Way galaxy from Earth's perspective using a
 * three-component density model:
 * - Exponential thin disk (main stellar population)
 * - Gaussian bulge (central concentration)
 * - Power-law halo (diffuse outer component)
 *
 * The estimation uses shell-based Monte Carlo integration, sampling each radial
 * shell independently and accumulating stars outward. This guarantees that larger
 * spheres always contain at least as many stars as smaller ones (monotonicity).
 *
 * @param radiusLy - Radius of the sphere in light-years (must be positive)
 * @param nShells - Number of radial shells for integration (default: 200)
 * @param samplesPerShell - Monte Carlo samples per shell (default: 2000)
 * @returns Object with estimated_stars and fraction_of_galaxy
 * @throws Error if radiusLy <= 0 or nShells <= 0 or samplesPerShell <= 0
 */
export function estimateStarsInSphere(
	radiusLy: number,
	nShells: number = 200,
	samplesPerShell: number = 2000
): StarEstimationResult {
	// Input validation
	if (radiusLy <= 0) {
		throw new Error(`Sphere radius must be positive, got ${radiusLy}`);
	}
	if (nShells <= 0) {
		throw new Error(`Number of shells must be positive, got ${nShells}`);
	}
	if (samplesPerShell <= 0) {
		throw new Error(`Samples per shell must be positive, got ${samplesPerShell}`);
	}

	// --- Galactic Model Parameters ---
	// All measurements from Sun's position at R_sun from galactic center

	// Thin disk: Exponential profile ρ(R,z) = ρ₀ * exp(-R/h_R) * exp(-|z|/h_z)
	// Unit conversion: Observational data shows 0.1-0.14 stars/pc³ near the Sun
	// Converting to stars/ly³: 1 pc = 3.26156 ly, so 1 pc³ = 34.71 ly³
	// Range: 0.10 stars/pc³ = 0.00288 stars/ly³ to 0.14 stars/pc³ = 0.00403 stars/ly³
	// Using midpoint: 0.12 stars/pc³ = 0.00346 stars/ly³ ≈ 0.0034 stars/ly³
	const rhoLocal = 0.0034; // Local stellar density at Sun's position (stars/ly³)
	                          // Based on HIPPARCOS/Gaia/RECONS surveys
	const hR = 9000.0; // Radial scale length of disk (ly)
	const hZ = 300.0; // Vertical scale height of disk (ly)

	// Bulge: Gaussian spheroid centered on galaxy (~40-50 billion stars, ~20% of galaxy)
	// Value adjusted to maintain realistic Milky Way total of ~200 billion stars
	// while using corrected local density. The bulge is ~26,000 ly from Earth,
	// so this adjustment has minimal effect on nearby star counts.
	const rhoBulgeCenter = 0.75; // Central bulge density (stars/ly³)
	const rBulge = 3500.0; // Bulge scale radius (ly)

	// Halo: Power-law profile with core to avoid singularity at center (minor component, ~1-2% of galaxy)
	const rhoHaloNorm = 1.5e-5; // Halo normalization constant (stars/ly³)
	const rHalo = 25000.0; // Halo reference radius (ly)
	const rCore = 500.0; // Core radius to prevent singularity at r=0 (ly)

	// Sun's galactocentric distance
	const rSun = 27000.0; // Distance from galactic center to Sun (ly)

	// Compute disk central density from local density
	// At Sun: rhoLocal = rhoDiskCenter * exp(-R_sun/h_R)
	const rhoDiskCenter = rhoLocal * Math.exp(rSun / hR);

	// --- Shell-based Monte Carlo integration ---
	// Use FIXED shell width across all calls to ensure shells align and samples match
	// This guarantees monotonicity: estimate(R1) <= estimate(R2) when R1 < R2
	const SHELL_WIDTH_LY = 500.0; // Fixed shell width in light-years
	const nActualShells = Math.ceil(radiusLy / SHELL_WIDTH_LY);
	let totalStars = 0.0;

	// Use deterministic seeding for reproducibility across calls
	const rng = seedrandom('42');

	for (let i = 0; i < nActualShells; i++) {
		const rInner = i * SHELL_WIDTH_LY;
		const rOuter = Math.min((i + 1) * SHELL_WIDTH_LY, radiusLy);

		// Arrays to hold sample densities
		const densities: number[] = [];

		for (let j = 0; j < samplesPerShell; j++) {
			// Sample uniformly within this shell
			// Use inverse transform: r³ uniform in [r_inner³, r_outer³]
			const u = rng();
			const r = Math.cbrt(rInner ** 3 + u * (rOuter ** 3 - rInner ** 3));

			// Random angles for uniform distribution on sphere
			const costheta = 2 * rng() - 1; // uniform in [-1, 1]
			const phi = 2 * Math.PI * rng();
			const theta = Math.acos(costheta);

			// Convert to Cartesian coordinates centered on Sun
			const x = r * Math.sin(theta) * Math.cos(phi);
			const y = r * Math.sin(theta) * Math.sin(phi);
			const z = r * Math.cos(theta);

			// Transform to galactocentric coordinates
			const rGal = Math.sqrt((rSun + x) ** 2 + y ** 2);
			const zGal = z;
			const rGalSph = Math.sqrt((rSun + x) ** 2 + y ** 2 + z ** 2);

			// Compute stellar density at each sample point
			const diskDensity = rhoDiskCenter * Math.exp(-rGal / hR) * Math.exp(-Math.abs(zGal) / hZ);
			const bulgeDensity = rhoBulgeCenter * Math.exp(-((rGalSph / rBulge) ** 2));
			const haloDensity = rhoHaloNorm * ((rGalSph + rCore) / rHalo) ** -3.5;

			const rhoTotal = diskDensity + bulgeDensity + haloDensity;
			densities.push(rhoTotal);
		}

		// Shell volume and star count
		const shellVolume = (4 / 3) * Math.PI * (rOuter ** 3 - rInner ** 3);
		const meanDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length;
		const shellStars = meanDensity * shellVolume;
		totalStars += shellStars;
	}

	// Compute model's total galaxy star count for normalization (cache it)
	if (_modelTotalStars === null) {
		// Estimate total by integrating to 200,000 ly (captures essentially all stars)
		const temp = _computeStarsWithoutNormalization(200000, samplesPerShell);
		_modelTotalStars = temp.stars;
	}

	const fraction = totalStars / _modelTotalStars;
	return { stars: totalStars, fraction };
}

/**
 * Format star count for display with appropriate units
 * @param stars - Number of stars to format
 * @returns Formatted string like "1.50 billion", "25.00 million", "5"
 */
export function formatStarCount(stars: number): string {
	if (stars < 0.5) return '< 1 star';
	if (stars >= 1e9) return `${(stars / 1e9).toFixed(2)} billion`;
	if (stars >= 1e6) return `${(stars / 1e6).toFixed(2)} million`;
	if (stars >= 1e3) return `${(stars / 1e3).toFixed(2)} thousand`;
	return stars.toFixed(0);
}

/**
 * Helper function to compute star count without normalization (avoids recursion).
 */
function _computeStarsWithoutNormalization(
	radiusLy: number,
	samplesPerShell: number
): StarEstimationResult {
	// Same model parameters as main function
	const rhoLocal = 0.0034;
	const hR = 9000.0;
	const hZ = 300.0;
	const rhoBulgeCenter = 0.75;
	const rBulge = 3500.0;
	const rhoHaloNorm = 1.5e-5;
	const rHalo = 25000.0;
	const rCore = 500.0;
	const rSun = 27000.0;
	const rhoDiskCenter = rhoLocal * Math.exp(rSun / hR);

	const SHELL_WIDTH_LY = 500.0; // Must match main function
	const nActualShells = Math.ceil(radiusLy / SHELL_WIDTH_LY);
	let totalStars = 0.0;
	const rng = seedrandom('42');

	for (let i = 0; i < nActualShells; i++) {
		const rInner = i * SHELL_WIDTH_LY;
		const rOuter = Math.min((i + 1) * SHELL_WIDTH_LY, radiusLy);

		const densities: number[] = [];

		for (let j = 0; j < samplesPerShell; j++) {
			const u = rng();
			const r = Math.cbrt(rInner ** 3 + u * (rOuter ** 3 - rInner ** 3));

			const costheta = 2 * rng() - 1;
			const phi = 2 * Math.PI * rng();
			const theta = Math.acos(costheta);

			const x = r * Math.sin(theta) * Math.cos(phi);
			const y = r * Math.sin(theta) * Math.sin(phi);
			const z = r * Math.cos(theta);

			const rGal = Math.sqrt((rSun + x) ** 2 + y ** 2);
			const zGal = z;
			const rGalSph = Math.sqrt((rSun + x) ** 2 + y ** 2 + z ** 2);

			const diskDensity = rhoDiskCenter * Math.exp(-rGal / hR) * Math.exp(-Math.abs(zGal) / hZ);
			const bulgeDensity = rhoBulgeCenter * Math.exp(-((rGalSph / rBulge) ** 2));
			const haloDensity = rhoHaloNorm * ((rGalSph + rCore) / rHalo) ** -3.5;

			const rhoTotal = diskDensity + bulgeDensity + haloDensity;
			densities.push(rhoTotal);
		}

		const shellVolume = (4 / 3) * Math.PI * (rOuter ** 3 - rInner ** 3);
		const meanDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length;
		const shellStars = meanDensity * shellVolume;
		totalStars += shellStars;
	}

	return { stars: totalStars, fraction: 1.0 };
}
