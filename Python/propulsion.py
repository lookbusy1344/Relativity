import math


def photon_rocket_accel_time(
    fuel_mass: float, dry_mass: float, efficiency: float = 1.0, g: float = 9.80665
) -> float:
    """
    Compute the time (in seconds) that a rocket can maintain 1g acceleration
    using matter–antimatter annihilation, assuming photon-rocket behaviour.

    Parameters:
        fuel_mass : float
            Combined matter + antimatter mass (kg) that will be annihilated.
        dry_mass : float
            Dry mass of the spacecraft after all fuel is gone (kg).
        efficiency : float
            Fraction of annihilation energy that becomes perfectly directed
            photon thrust (1.0 = ideal).
        g : float
            Acceleration to maintain (m/s^2). Default = 1g (9.80665 m/s^2).

    Returns:
        float : acceleration time in seconds.
    """

    # speed of light (m/s)
    c = 2.99792458e8

    # initial mass = dry mass + fuel to be annihilated
    M0 = dry_mass + fuel_mass
    Mf = dry_mass

    if M0 <= Mf:
        return 0.0

    # Effective mass ratio improvement from efficiency:
    # Efficiency <1 scales the available thrust power linearly.
    # For constant proper acceleration, t = (η c / g) * ln(M0/Mf)
    return (efficiency * c / g) * math.log(M0 / Mf)


def pion_rocket_accel_time(
    fuel_mass: float, dry_mass: float, efficiency: float = 1.0, g: float = 9.80665
) -> float:
    """
    Compute the time (in seconds) that a rocket can maintain constant
    proper acceleration g using matter–antimatter annihilation with
    charged-pion exhaust.

    Parameters:
        fuel_mass : float
            Combined matter + antimatter mass (kg) that will be annihilated.
        dry_mass : float
            Final spacecraft mass after fuel is gone (kg).
        efficiency : float
            Fraction of usable annihilation energy channelled into
            directed charged-pion thrust (0–1).
        g : float
            Acceleration to maintain (m/s^2). Default = 1g.

    Returns:
        float : acceleration time in seconds.
    """

    # Speed of light
    c = 2.99792458e8

    # Charged pion exhaust velocity (~0.94c)
    ve = 0.94 * c * efficiency

    M0 = dry_mass + fuel_mass
    Mf = dry_mass

    if M0 <= Mf or ve <= 0:
        return 0.0

    return (ve / g) * math.log(M0 / Mf)


def photon_rocket_fuel_fraction(
    thrust_time: float, acceleration: float = 9.80665, efficiency: float = 0.4
) -> float:
    """
    Compute the propellant mass fraction required for a photon rocket
    to maintain constant proper acceleration for a given time.

    Parameters:
        thrust_time : float
            Duration of thrust in seconds.
        acceleration : float
            Constant proper acceleration (m/s²). Default = 1g.
        efficiency : float
            Fraction of annihilation energy converted to directed thrust.
            Default = 0.4 (40%, realistic for magnetic nozzle design).

    Returns:
        float : Propellant mass fraction (fuel_mass / initial_mass).
                Range: 0.0 to 1.0
    """
    c = 2.99792458e8  # speed of light (m/s)

    # Mass ratio M0/Mf = exp(a*t / (η*c))
    mass_ratio = math.exp(acceleration * thrust_time / (efficiency * c))

    # Propellant fraction = 1 - (Mf/M0) = 1 - 1/mass_ratio
    return 1.0 - (1.0 / mass_ratio)


def pion_rocket_fuel_fraction(
    thrust_time: float, acceleration: float = 9.80665, efficiency: float = 0.7
) -> float:
    """
    Compute the propellant mass fraction required for a charged-pion
    antimatter rocket to maintain constant proper acceleration for a
    specified duration.

    Parameters:
        thrust_time : float
            Duration of thrust in seconds.
        acceleration : float
            Constant proper acceleration (m/s²). Default = 1g.
        efficiency : float
            Fraction of charged-pion kinetic energy effectively directed
            into thrust (0–1). Typical magnetic-nozzle values: ~0.6–0.8.

    Returns:
        float : Propellant fraction = fuel_mass / initial_mass (0–1).
    """

    c = 2.99792458e8  # speed of light
    ve = 0.94 * c * efficiency  # effective exhaust velocity

    if ve <= 0:
        return 0.0

    # M0/Mf = exp(a t / v_e)
    mass_ratio = math.exp(acceleration * thrust_time / ve)

    # fuel fraction = 1 − Mf/M0 = 1 − 1/mass_ratio
    return 1.0 - (1.0 / mass_ratio)


if __name__ == "__main__":
    fuel_mass = 1000.0  # kg, half is matter, half is antimatter
    dry_mass = 500.0  # kg, the spacecraft dry mass

    t = pion_rocket_accel_time(fuel_mass, dry_mass, efficiency=0.6)
    years = t / 60.0 / 60.0 / 24.0 / 365.25
    print(
        f"Dry mass {dry_mass:.0f}, fuel mass {fuel_mass:.0f} means {years:.2f} years at 1g with 60% efficiency"
    )

    # Calculate propellant fraction for 3.52 years of 1g acceleration at 60% efficiency
    years = 3.52
    secs = 365.25 * 86400 * years
    f = pion_rocket_fuel_fraction(secs, 9.80665, 0.6)
    print(
        f"Propellant mass fraction: {f * 100:.4f}% for {years} years of 1g acceleration at 60% efficiency"
    )
