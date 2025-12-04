import numpy as np


def estimate_stars_simple(R_ly, samples=300000):
    """
    Estimate the number of stars within radius R_ly (light-years)
    using a simple, spherically averaged Milky Way model.

    Components:
      - Thin disk (exponential)
      - Bulge (spherical Gaussian)
      - Halo (power-law)
    """

    # --- Galactic parameters ---
    # Thin disk
    rho0 = 0.004  # local density (stars/ly^3)
    h_R = 2600  # radial scale length (ly)
    h_z = 300  # vertical scale height (ly)

    # Bulge
    rho_b = 0.05  # central bulge density (stars/ly^3)
    r_b = 3000  # bulge scale radius (ly)

    # Halo
    rho_h = 1e-6  # normalization (stars/ly^3)
    r_h = 10000  # reference radius (ly)

    # Sun's position
    R_sun = 27000  # ly from Galactic center

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
    # Thin disk (spherically averaged)
    disk_density = rho0 * np.exp(-(R_gal - R_sun) / h_R) * np.exp(-np.abs(z_gal) / h_z)

    # Bulge
    bulge_density = rho_b * np.exp(-((r_gal / r_b) ** 2))

    # Halo
    halo_density = rho_h * (r_gal / r_h) ** (-3.5)

    # Total density
    rho = disk_density + bulge_density + halo_density

    # Volume of sphere
    volume = (4 / 3) * np.pi * R_ly**3

    return rho.mean() * volume


if __name__ == "__main__":
    print("Radius (ly) | Estimated Stars")
    for R in [5, 10, 20, 50, 80, 100, 1000, 5000, 20000, 50000, 100000]:
        print(f"{R:<15} | {estimate_stars_simple(R):<15}")
