import numpy as np
from numpy.typing import NDArray


# Cache for model's total galaxy star count (computed once at 200,000 ly)
_MODEL_TOTAL_STARS = None

# --- Cross-Platform Implementation Notes ---
# This implementation uses identical algorithms and model parameters to the TypeScript
# version in ../Javascript/src/extra_lib.ts, but produces slightly different numerical
# results due to implementation details:
#
# Algorithm Match: ✓
# - All model parameters identical (10+ constants match exactly)
# - Same shell-based Monte Carlo integration approach
# - Same density formulas (disk, bulge, halo components)
# - Same deterministic seeding (seed=42)
#
# Numerical Differences:
# - Small radii (< 10,000 ly): < 1% difference (excellent match)
# - Large radii (> 10,000 ly): 1.3% - 7.2% difference
# - Root cause: Different random number consumption order
#   * Python (vectorized): Generates all u values, then all costheta, then all phi
#   * TypeScript (iterative): Interleaves u, costheta, phi for each sample
# - Both approaches are valid; differences are within Monte Carlo statistical variance
#
# See test_extra_lib.py for detailed cross-platform validation tests.


def estimate_stars_in_sphere(
    R_ly: float, n_shells: int = 200, samples_per_shell: int = 2000
) -> tuple[float, float]:
    """
    Estimate the number of stars within a sphere of radius R_ly centered on the Sun.

    This function models the Milky Way galaxy from Earth's perspective using a
    three-component density model:
    - Exponential thin disk (main stellar population)
    - Gaussian bulge (central concentration)
    - Power-law halo (diffuse outer component)

    The estimation uses shell-based Monte Carlo integration, sampling each radial
    shell independently and accumulating stars outward. This guarantees that larger
    spheres always contain at least as many stars as smaller ones (monotonicity).

    Args:
        R_ly: Radius of the sphere in light-years (must be positive)
        n_shells: Number of radial shells for integration (default: 200)
        samples_per_shell: Monte Carlo samples per shell (default: 2000)

    Returns:
        tuple: (estimated_stars, fraction_of_galaxy)
            - estimated_stars: Number of stars within the sphere
            - fraction_of_galaxy: Ratio to model's total (normalized to approach 100% at large radii)

    Raises:
        ValueError: If R_ly <= 0 or n_shells <= 0 or samples_per_shell <= 0
    """
    # Input validation
    if R_ly <= 0:
        raise ValueError(f"Sphere radius must be positive, got {R_ly}")
    if n_shells <= 0:
        raise ValueError(f"Number of shells must be positive, got {n_shells}")
    if samples_per_shell <= 0:
        raise ValueError(f"Samples per shell must be positive, got {samples_per_shell}")

    # --- Galactic Model Parameters ---
    # All measurements from Sun's position at R_sun from galactic center
    # See docs/galactic-stellar-density-research.md for sources and derivations

    # Thin disk: Exponential profile ρ(R,z) = ρ₀ * exp(-R/h_R) * exp(-|z|/h_z)
    # Local stellar density from RECONS/Gaia/HIPPARCOS surveys: 0.10-0.14 stars/pc³
    # Unit conversion: 1 pc³ = 34.71 ly³, so 0.12 stars/pc³ = 0.0034 stars/ly³
    rho_local = 0.0034  # Local stellar density at Sun's position (stars/ly³)

    # Disk scale length: meta-analysis gives 2.6-3.5 kpc (Licquia & Newman 2016)
    h_R = 11500.0  # Radial scale length: 3.5 kpc = 11,500 ly

    # Disk scale height: Effective value combining thin disk (~300 pc) and thick disk (~1 kpc)
    # The thick disk contains ~10-15% of disk stars but extends much higher
    # Using effective scale height of ~860 pc captures both populations
    h_z = 2800.0  # Effective vertical scale height: ~860 pc = 2,800 ly

    # Bulge: Gaussian spheroid centered on galaxy
    # Research shows bulge is 10-15% of stellar mass
    # Central density tuned to produce ~16% of total galaxy stars (~30B of 200B)
    rho_bulge_center = 0.14  # Central bulge density (stars/ly³)
    r_bulge = 3500.0  # Bulge scale radius: ~1 kpc

    # Halo: Power-law profile with core (minor component, ~1-2% of galaxy)
    # Reduced from original to match observational ~1% stellar halo fraction
    rho_halo_norm = 3e-6  # Halo normalization constant (stars/ly³)
    r_halo = 25000.0  # Halo reference radius (ly)
    r_core = 500.0  # Core radius to prevent singularity at r=0 (ly)

    # Sun's galactocentric distance
    R_sun = 27000.0  # Distance from galactic center to Sun (ly)

    # Compute disk central density from local density
    # At Sun: rho_local = rho_disk_center * exp(-R_sun/h_R)
    rho_disk_center = rho_local * np.exp(R_sun / h_R)

    # --- Shell-based Monte Carlo integration ---
    # Use FIXED shell width across all calls to ensure shells align and samples match
    # This guarantees monotonicity: estimate(R1) <= estimate(R2) when R1 < R2
    SHELL_WIDTH_LY = 500.0  # Fixed shell width in light-years
    n_actual_shells = int(np.ceil(R_ly / SHELL_WIDTH_LY))
    total_stars = 0.0

    # Use deterministic seeding for reproducibility across calls
    rng = np.random.default_rng(seed=42)

    for i in range(n_actual_shells):
        r_inner = i * SHELL_WIDTH_LY
        r_outer = min((i + 1) * SHELL_WIDTH_LY, R_ly)

        # Sample uniformly within this shell
        # Use inverse transform: r³ uniform in [r_inner³, r_outer³]
        #
        # NOTE: Vectorized approach (generate all samples at once) for performance.
        # TypeScript version uses iterative loop generating u, costheta, phi for each
        # sample, which consumes random numbers in different order. Both valid; this
        # is faster due to NumPy vectorization.
        u = rng.uniform(0, 1, samples_per_shell)
        r = (r_inner**3 + u * (r_outer**3 - r_inner**3)) ** (1 / 3)

        # Random angles for uniform distribution on sphere
        costheta = rng.uniform(-1, 1, samples_per_shell)
        phi = rng.uniform(0, 2 * np.pi, samples_per_shell)
        theta = np.arccos(costheta)

        # Convert to Cartesian coordinates centered on Sun
        x = r * np.sin(theta) * np.cos(phi)
        y = r * np.sin(theta) * np.sin(phi)
        z = r * np.cos(theta)

        # Transform to galactocentric coordinates
        R_gal = np.sqrt((R_sun + x) ** 2 + y**2)
        z_gal = z
        r_gal = np.sqrt((R_sun + x) ** 2 + y**2 + z**2)

        # Compute stellar density at each sample point
        disk_density = (
            rho_disk_center * np.exp(-R_gal / h_R) * np.exp(-np.abs(z_gal) / h_z)
        )
        bulge_density = rho_bulge_center * np.exp(-((r_gal / r_bulge) ** 2))
        halo_density = rho_halo_norm * ((r_gal + r_core) / r_halo) ** (-3.5)

        rho_total = disk_density + bulge_density + halo_density

        # Shell volume and star count
        shell_volume = (4 / 3) * np.pi * (r_outer**3 - r_inner**3)
        shell_stars = rho_total.mean() * shell_volume
        total_stars += shell_stars

    # Compute model's total galaxy star count for normalization (cache it)
    global _MODEL_TOTAL_STARS
    if _MODEL_TOTAL_STARS is None:
        # Estimate total by integrating to 200,000 ly (captures essentially all stars)
        temp_stars, _ = _compute_stars_without_normalization(
            200000, samples_per_shell=2000
        )
        _MODEL_TOTAL_STARS = temp_stars

    fraction = total_stars / _MODEL_TOTAL_STARS
    return total_stars, fraction


def _compute_stars_without_normalization(
    R_ly: float, samples_per_shell: int
) -> tuple[float, float]:
    """Helper function to compute star count without normalization (avoids recursion)."""
    # Same model parameters as main function - MUST be kept in sync!
    rho_local = 0.0034
    h_R = 11500.0
    h_z = 2800.0
    rho_bulge_center = 0.14
    r_bulge = 3500.0
    rho_halo_norm = 3e-6
    r_halo = 25000.0
    r_core = 500.0
    R_sun = 27000.0
    rho_disk_center = rho_local * np.exp(R_sun / h_R)

    SHELL_WIDTH_LY = 500.0  # Must match main function
    n_actual_shells = int(np.ceil(R_ly / SHELL_WIDTH_LY))
    total_stars = 0.0
    rng = np.random.default_rng(seed=42)

    for i in range(n_actual_shells):
        r_inner = i * SHELL_WIDTH_LY
        r_outer = min((i + 1) * SHELL_WIDTH_LY, R_ly)

        u = rng.uniform(0, 1, samples_per_shell)
        r = (r_inner**3 + u * (r_outer**3 - r_inner**3)) ** (1 / 3)

        costheta = rng.uniform(-1, 1, samples_per_shell)
        phi = rng.uniform(0, 2 * np.pi, samples_per_shell)
        theta = np.arccos(costheta)

        x = r * np.sin(theta) * np.cos(phi)
        y = r * np.sin(theta) * np.sin(phi)
        z = r * np.cos(theta)

        R_gal = np.sqrt((R_sun + x) ** 2 + y**2)
        z_gal = z
        r_gal = np.sqrt((R_sun + x) ** 2 + y**2 + z**2)

        disk_density = (
            rho_disk_center * np.exp(-R_gal / h_R) * np.exp(-np.abs(z_gal) / h_z)
        )
        bulge_density = rho_bulge_center * np.exp(-((r_gal / r_bulge) ** 2))
        halo_density = rho_halo_norm * ((r_gal + r_core) / r_halo) ** (-3.5)

        rho_total = disk_density + bulge_density + halo_density
        shell_volume = (4 / 3) * np.pi * (r_outer**3 - r_inner**3)
        shell_stars = rho_total.mean() * shell_volume
        total_stars += shell_stars

    return total_stars, 1.0


if __name__ == "__main__":
    print("\nEstimated stars within spheres centered on the Sun (Earth):\n")
    print(f"{'Radius':<12} {'Stars':<20} {'Fraction':<12} {'Expected/Notes':<40}")
    print("=" * 85)

    # Test cases with expected values for validation
    test_cases = [
        (5, "~3 stars (Proxima, α Cen A/B)"),
        (10, "~10-15 stars (incl. Sirius, Barnard's)"),
        (20, "Few hundred stars"),
        (50, "Few thousand stars"),
        (100, "~50,000 stars (local bubble)"),
        (1000, "~20-30 million stars (local arm)"),
        (5000, "~0.5-1 billion stars"),
        (10000, "~1-2% of galaxy"),
        (20000, "~5-10% of galaxy"),
        (50000, "~80-90% of disk, most of galaxy"),
        (60000, "~90% of galaxy"),
        (70000, "~95% of galaxy"),
        (80000, "~98% of galaxy"),
        (85000, "~99% of galaxy"),
        (100000, "~90-100% of galaxy (full MW extent)"),
    ]

    for R, expected in test_cases:
        stars, frac = estimate_stars_in_sphere(R)

        # Format star count for readability
        if stars >= 1e9:
            stars_str = f"{stars / 1e9:.2f} billion"
        elif stars >= 1e6:
            stars_str = f"{stars / 1e6:.2f} million"
        elif stars >= 1e3:
            stars_str = f"{stars / 1e3:.2f} thousand"
        else:
            stars_str = f"{stars:.1f}"

        # Format fraction as percentage
        frac_str = f"{frac * 100:.2f}%"

        print(f"{R:<12,} {stars_str:<20} {frac_str:<12} {expected}")

    print(
        "\nNote: Uses shell-based integration with deterministic seeding for monotonicity."
    )
