from mpmath import mp
import relativity_lib as rl


def photon_rocket_accel_time(fuel_mass, dry_mass, efficiency=1.0, g=None):
    """
    Compute the time (in seconds) that a rocket can maintain 1g acceleration
    using matter–antimatter annihilation, assuming photon-rocket behaviour.

    Parameters:
        fuel_mass : mpmath number or float
            Combined matter + antimatter mass (kg) that will be annihilated.
        dry_mass : mpmath number or float
            Dry mass of the spacecraft after all fuel is gone (kg).
        efficiency : mpmath number or float
            Fraction of annihilation energy that becomes perfectly directed
            photon thrust (1.0 = ideal).
        g : mpmath number or float or None
            Acceleration to maintain (m/s^2). Default = None (uses 1g from relativity_lib).

    Returns:
        mpmath number : acceleration time in seconds.
    """

    # Convert inputs to mpmath
    fuel_mass = rl.ensure(fuel_mass)
    dry_mass = rl.ensure(dry_mass)
    efficiency = rl.ensure(efficiency)

    # Use relativity_lib's g if not provided
    if g is None:
        g = rl.g
    else:
        g = rl.ensure(g)

    # initial mass = dry mass + fuel to be annihilated
    M0 = dry_mass + fuel_mass
    Mf = dry_mass

    if M0 <= Mf:
        return rl.zero

    # Effective mass ratio improvement from efficiency:
    # Efficiency <1 scales the available thrust power linearly.
    # For constant proper acceleration, t = (η c / g) * ln(M0/Mf)
    return (efficiency * rl.c / g) * mp.log(M0 / Mf)


def pion_rocket_accel_time(fuel_mass, dry_mass, nozzle_efficiency=0.85, g=None):
    """
    Compute the time (in seconds) that a rocket can maintain constant
    proper acceleration g using matter–antimatter annihilation with
    charged-pion exhaust.

    Physics: Matter-antimatter annihilation produces ~1/3 each of π⁺, π⁻, and π⁰.
    Only charged pions (π⁺, π⁻) can be magnetically redirected for thrust.
    Neutral pions (π⁰) decay immediately to gamma rays that cannot be directed,
    representing unavoidable ~33% energy loss.

    Parameters:
        fuel_mass : mpmath number or float
            Combined matter + antimatter mass (kg) that will be annihilated.
        dry_mass : mpmath number or float
            Final spacecraft mass after fuel is gone (kg).
        nozzle_efficiency : mpmath number or float
            Magnetic nozzle effectiveness at directing charged pions (0–1).
            Default = 0.85 (realistic for magnetic nozzles).
            Note: Total system efficiency ≈ (2/3) × nozzle_efficiency ≈ 0.567 at default.
        g : mpmath number or float or None
            Acceleration to maintain (m/s^2). Default = None (uses 1g from relativity_lib).

    Returns:
        mpmath number : acceleration time in seconds.
    """

    # Convert inputs to mpmath
    fuel_mass = rl.ensure(fuel_mass)
    dry_mass = rl.ensure(dry_mass)
    nozzle_efficiency = rl.ensure(nozzle_efficiency)

    # Use relativity_lib's g if not provided
    if g is None:
        g = rl.g
    else:
        g = rl.ensure(g)

    # Charged pion fraction: ~2/3 of energy goes to charged pions (π⁺, π⁻)
    # The remaining ~1/3 goes to neutral pions (π⁰) which cannot be directed
    charged_fraction = rl.ensure("2") / rl.ensure("3")
    
    # Effective exhaust velocity accounting for both charged fraction and nozzle efficiency
    # Base pion velocity ~0.94c, reduced by charged fraction and nozzle efficiency
    ve = rl.ensure("0.94") * rl.c * charged_fraction * nozzle_efficiency

    M0 = dry_mass + fuel_mass
    Mf = dry_mass

    if M0 <= Mf or ve <= rl.zero:
        return rl.zero

    return (ve / g) * mp.log(M0 / Mf)


def photon_rocket_fuel_fraction(thrust_time, acceleration=None, efficiency=0.4):
    """
    Compute the propellant mass fraction required for a photon rocket
    to maintain constant proper acceleration for a given time.

    Parameters:
        thrust_time : mpmath number or float
            Duration of thrust in seconds.
        acceleration : mpmath number or float or None
            Constant proper acceleration (m/s²). Default = None (uses 1g from relativity_lib).
        efficiency : mpmath number or float
            Fraction of annihilation energy converted to directed thrust.
            Default = 0.4 (40%, realistic for magnetic nozzle design).

    Returns:
        mpmath number : Propellant mass fraction (fuel_mass / initial_mass).
                        Range: 0.0 to 1.0
    """

    # Convert inputs to mpmath
    thrust_time = rl.ensure(thrust_time)
    efficiency = rl.ensure(efficiency)

    # Use relativity_lib's g if not provided
    if acceleration is None:
        acceleration = rl.g
    else:
        acceleration = rl.ensure(acceleration)

    # Mass ratio M0/Mf = exp(a*t / (η*c))
    mass_ratio = mp.exp(acceleration * thrust_time / (efficiency * rl.c))

    # Propellant fraction = 1 - (Mf/M0) = 1 - 1/mass_ratio
    return rl.one - (rl.one / mass_ratio)


def pion_rocket_fuel_fraction(thrust_time, acceleration=None, nozzle_efficiency=0.85):
    """
    Compute the propellant mass fraction required for a charged-pion
    antimatter rocket to maintain constant proper acceleration for a
    specified duration.

    Physics: Matter-antimatter annihilation produces ~1/3 each of π⁺, π⁻, and π⁰.
    Only charged pions (π⁺, π⁻) can be magnetically redirected for thrust.
    Neutral pions (π⁰) decay immediately to gamma rays that cannot be directed,
    representing unavoidable ~33% energy loss.

    Parameters:
        thrust_time : mpmath number or float
            Duration of thrust in seconds.
        acceleration : mpmath number or float or None
            Constant proper acceleration (m/s²). Default = None (uses 1g from relativity_lib).
        nozzle_efficiency : mpmath number or float
            Magnetic nozzle effectiveness at directing charged pions (0–1).
            Default = 0.85 (realistic for magnetic nozzles).
            Note: Total system efficiency ≈ (2/3) × nozzle_efficiency ≈ 0.567 at default.

    Returns:
        mpmath number : Propellant fraction = fuel_mass / initial_mass (0–1).
    """

    # Convert inputs to mpmath
    thrust_time = rl.ensure(thrust_time)
    nozzle_efficiency = rl.ensure(nozzle_efficiency)

    # Use relativity_lib's g if not provided
    if acceleration is None:
        acceleration = rl.g
    else:
        acceleration = rl.ensure(acceleration)

    # Charged pion fraction: ~2/3 of energy goes to charged pions (π⁺, π⁻)
    # The remaining ~1/3 goes to neutral pions (π⁰) which cannot be directed
    charged_fraction = rl.ensure("2") / rl.ensure("3")
    
    # Effective exhaust velocity accounting for both charged fraction and nozzle efficiency
    ve = rl.ensure("0.94") * rl.c * charged_fraction * nozzle_efficiency

    if ve <= rl.zero:
        return rl.zero

    # M0/Mf = exp(a t / v_e)
    mass_ratio = mp.exp(acceleration * thrust_time / ve)

    # fuel fraction = 1 − Mf/M0 = 1 − 1/mass_ratio
    return rl.one - (rl.one / mass_ratio)


if __name__ == "__main__":
    # Configure relativity_lib for precision calculations
    rl.configure(50)

    fuel_mass = 1000.0  # kg, half is matter, half is antimatter
    dry_mass = 500.0  # kg, the spacecraft dry mass

    t = pion_rocket_accel_time(fuel_mass, dry_mass, nozzle_efficiency=0.85)
    years = t / rl.seconds_per_year
    print(
        f"Dry mass {float(dry_mass):.0f}, fuel mass {float(fuel_mass):.0f} means {float(years):.2f} years at 1g with 85% nozzle efficiency"
    )

    # Calculate propellant fraction for 3.52 years of 1g acceleration at 85% nozzle efficiency
    years = rl.ensure("3.52")
    secs = rl.seconds_per_year * years
    f = pion_rocket_fuel_fraction(secs, None, 0.85)
    print(
        f"Propellant mass fraction: {float(f) * 100:.4f}% for {float(years)} years of 1g acceleration at 85% nozzle efficiency"
    )
