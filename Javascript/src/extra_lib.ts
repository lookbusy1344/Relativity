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
	// See docs/galactic-stellar-density-research.md for sources and derivations

	// Thin disk: Exponential profile ρ(R,z) = ρ₀ * exp(-R/h_R) * exp(-|z|/h_z)
	// Local stellar density from RECONS/Gaia/HIPPARCOS surveys: 0.10-0.14 stars/pc³
	// Unit conversion: 1 pc³ = 34.71 ly³, so 0.12 stars/pc³ = 0.0034 stars/ly³
	const rhoLocal = 0.0034; // Local stellar density at Sun's position (stars/ly³)

	// Disk scale length: meta-analysis gives 2.6-3.5 kpc (Licquia & Newman 2016)
	const hR = 11500.0; // Radial scale length: 3.5 kpc = 11,500 ly

	// Disk scale height: Effective value combining thin disk (~300 pc) and thick disk (~1 kpc)
	// The thick disk contains ~10-15% of disk stars but extends much higher
	// Using effective scale height of ~860 pc captures both populations
	const hZ = 2800.0; // Effective vertical scale height: ~860 pc = 2,800 ly

	// Bulge: Gaussian spheroid centered on galaxy
	// Research shows bulge is 10-15% of stellar mass
	// Central density tuned to produce ~16% of total galaxy stars (~30B of 200B)
	const rhoBulgeCenter = 0.14; // Central bulge density (stars/ly³)
	const rBulge = 3500.0; // Bulge scale radius: ~1 kpc

	// Halo: Power-law profile with core (minor component, ~1-2% of galaxy)
	// Reduced from original to match observational ~1% stellar halo fraction
	const rhoHaloNorm = 3e-6; // Halo normalization constant (stars/ly³)
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
 * @returns Formatted string like "~866,200", "~12,600,000", "5"
 */
export function formatStarCount(stars: number): string {
	if (stars < 0.5) return '< 1 star';
	if (stars >= 1e3) {
		// Round to 3 significant figures for thousands and above
		const rounded = Math.round(stars / 100) * 100;
		return `~${rounded.toLocaleString('en-US')}`;
	}
	return Math.round(stars).toFixed(0);
}

/**
 * Helper function to compute star count without normalization (avoids recursion).
 */
function _computeStarsWithoutNormalization(
	radiusLy: number,
	samplesPerShell: number
): StarEstimationResult {
	// Same model parameters as main function - MUST be kept in sync!
	const rhoLocal = 0.0034;
	const hR = 11500.0;
	const hZ = 2800.0;
	const rhoBulgeCenter = 0.14;
	const rBulge = 3500.0;
	const rhoHaloNorm = 3e-6;
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
