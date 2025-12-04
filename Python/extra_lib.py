import numpy as np
from numpy.typing import NDArray


def estimate_stars_in_sphere(R_ly: float, samples: int = 300000) -> tuple[float, float]:
    """
    Estimate the number of stars within a sphere of radius R_ly centered on the Sun.

    This function models the Milky Way galaxy from Earth's perspective using a
    three-component density model:
    - Exponential thin disk (main stellar population)
    - Gaussian bulge (central concentration)
    - Power-law halo (diffuse outer component)

    The estimation uses Monte Carlo sampling to compute the average stellar density
    within the sphere, accounting for the Sun's offset from the galactic center.

    Args:
        R_ly: Radius of the sphere in light-years (must be positive)
        samples: Number of Monte Carlo samples for density estimation (default: 300000)

    Returns:
        tuple: (estimated_stars, fraction_of_galaxy)
            - estimated_stars: Number of stars within the sphere
            - fraction_of_galaxy: Ratio to total Milky Way stars (~200 billion)

    Raises:
        ValueError: If R_ly <= 0 or samples <= 0
    """
    # Input validation
    if R_ly <= 0:
        raise ValueError(f"Sphere radius must be positive, got {R_ly}")
    if samples <= 0:
        raise ValueError(f"Sample count must be positive, got {samples}")

    STARS_IN_GALAXY = 200_000_000_000  # Approximate total stars in Milky Way

    # --- Galactic Model Parameters ---
    # All measurements from Sun's position at R_sun from galactic center

    # Thin disk: Exponential profile ρ(R,z) = ρ₀ * exp(-R/h_R) * exp(-|z|/h_z)
    rho_local = 0.014  # Local stellar density at Sun's position (stars/ly³)
    h_R = 9000.0  # Radial scale length of disk (ly)
    h_z = 300.0  # Vertical scale height of disk (ly)

    # Bulge: Gaussian spheroid centered on galaxy
    rho_bulge_center = 0.5  # Central bulge density (stars/ly³)
    r_bulge = 1000.0  # Bulge scale radius (ly)

    # Halo: Power-law profile with core to avoid singularity at center
    rho_halo_norm = 1e-7  # Halo normalization constant (stars/ly³)
    r_halo = 10000.0  # Halo reference radius (ly)
    r_core = 100.0  # Core radius to prevent singularity at r=0 (ly)

    # Sun's galactocentric distance
    R_sun = 27000.0  # Distance from galactic center to Sun (ly)

    # Compute disk central density from local density
    # At Sun: rho_local = rho_disk_center * exp(-R_sun/h_R)
    rho_disk_center = rho_local * np.exp(R_sun / h_R)

    # --- Monte Carlo sampling inside sphere ---
    # Generate uniformly distributed points within sphere of radius R_ly
    # Using inverse transform sampling for radial coordinate
    u = np.random.uniform(0, 1, samples)
    costheta = np.random.uniform(-1, 1, samples)
    phi = np.random.uniform(0, 2 * np.pi, samples)

    # Convert to spherical coordinates (uniform in volume)
    r = R_ly * u ** (1 / 3)  # Cube root for uniform volume distribution
    theta = np.arccos(costheta)

    # Convert to Cartesian coordinates centered on Sun
    # Coordinate system: x points away from galactic center,
    #                    z points toward north galactic pole,
    #                    y completes right-handed system
    x = r * np.sin(theta) * np.cos(phi)
    y = r * np.sin(theta) * np.sin(phi)
    z = r * np.cos(theta)

    # Transform to galactocentric coordinates
    # Sun is at (R_sun, 0, 0) in galactic cylindrical coords
    R_gal = np.sqrt((R_sun + x) ** 2 + y**2)  # Cylindrical radius from galactic center
    z_gal = z  # Height above galactic plane
    r_gal = np.sqrt((R_sun + x) ** 2 + y**2 + z**2)  # 3D distance from galactic center

    # --- Compute stellar density at each sample point ---

    # Disk: Exponential profile in R and z
    # ρ_disk(R,z) = ρ₀ * exp(-R/h_R) * exp(-|z|/h_z)
    disk_density = rho_disk_center * np.exp(-R_gal / h_R) * np.exp(-np.abs(z_gal) / h_z)

    # Bulge: Gaussian profile (using 3D distance for spherical bulge)
    # ρ_bulge(r) = ρ_b * exp(-(r/r_b)²)
    bulge_density = rho_bulge_center * np.exp(-((r_gal / r_bulge) ** 2))

    # Halo: Power-law profile with core radius to avoid singularity
    # ρ_halo(r) = ρ_h * ((r + r_core) / r_h)^(-3.5)
    halo_density = rho_halo_norm * ((r_gal + r_core) / r_halo) ** (-3.5)

    # Total density is sum of all components
    rho_total = disk_density + bulge_density + halo_density

    # --- Estimate total stars in sphere ---
    # Volume of sphere
    volume = (4 / 3) * np.pi * R_ly**3

    # Mean density times volume gives star count estimate
    stars = rho_total.mean() * volume

    # Fraction relative to entire galaxy (note: this is approximate since
    # our density model may not integrate to exactly STARS_IN_GALAXY)
    fraction = stars / STARS_IN_GALAXY

    return stars, fraction


if __name__ == "__main__":
    print("Radius (ly) | Estimated Stars         | Fraction of Galaxy")
    for R in [5, 10, 20, 50, 80, 100, 1000, 5000, 20000, 50000, 100000]:
        stars, frac = estimate_stars_in_sphere(R)
        print(f"{R:<15} | {stars:<22.6g} | {frac:.3e}")
