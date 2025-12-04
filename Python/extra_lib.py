import numpy as np


def estimate_stars_in_sphere(R_ly, samples=300000):
    """
    Improved estimate of the number of stars within radius R_ly (light-years)
    using a more realistic Milky Way model.
    """

    stars_in_galaxy = (
        200_000_000_000  # Approximate total number of stars in the Milky Way
    )

    # --- Galactic parameters (updated) ---
    # Thin disk
    rho0 = 0.014  # local density (stars/ly^3)
    h_R = 9000.0  # radial scale length (ly)
    h_z = 300.0  # vertical scale height (ly)

    # Bulge (weaker + more compact)
    rho_b = 0.5  # central bulge density (stars/ly^3)
    r_b = 1000  # bulge scale radius (ly)

    # Halo (weaker)
    rho_h = 1e-7  # normalization (stars/ly^3)
    r_h = 10000.0  # reference radius (ly)

    # Sun's position
    R_sun = 27000.0  # ly from Galactic center

    # --- Monte Carlo sampling inside sphere ---
    u = np.random.uniform(0, 1, samples)
    costheta = np.random.uniform(-1, 1, samples)
    phi = np.random.uniform(0, 2 * np.pi, samples)

    r = R_ly * u ** (1 / 3)
    theta = np.arccos(costheta)

    # Convert to Cartesian relative to Sun
    x = r * np.sin(theta) * np.cos(phi)
    y = r * np.sin(theta) * np.sin(phi)
    z = r * np.cos(theta)

    # Galactic coordinates relative to center
    R_gal = np.sqrt((R_sun + x) ** 2 + y**2)
    z_gal = z
    r_gal = np.sqrt((R_sun + x) ** 2 + y**2 + z**2)

    # --- Density components ---
    disk_density = rho0 * np.exp(-(R_gal - R_sun) / h_R) * np.exp(-np.abs(z_gal) / h_z)
    bulge_density = rho_b * np.exp(-((r_gal / r_b) ** 2))
    halo_density = rho_h * (r_gal / r_h) ** (-3.5)

    rho = disk_density + bulge_density + halo_density

    # Volume of sphere
    volume = (4 / 3) * np.pi * R_ly**3

    stars = rho.mean() * volume
    fraction = stars / stars_in_galaxy

    return stars, fraction


if __name__ == "__main__":
    print("Radius (ly) | Estimated Stars         | Fraction of Galaxy")
    for R in [5, 10, 20, 50, 80, 100, 1000, 5000, 20000, 50000, 100000]:
        stars, frac = estimate_stars_in_sphere(R)
        print(f"{R:<15} | {stars:<22.6g} | {frac:.3e}")
