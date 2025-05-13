import math
from scipy.integrate import quad, solve_ivp

earth_radius: float = 6_375_325.0  # radius of Earth (adjusted to ensure g = 9.80665) Equatorial radius is actual 6,378,137
earth_mass: float = 5.972e24  # mass of Earth in kg
G: float = 6.674_30e-11  # gravitational constant in m³/kg/s²
c: float = 299_792_458.0  # speed of light in m/s


def gravity_acceleration_for_radius(mass: float, radius: float) -> float:
    """
    Calculate gravitational acceleration using Newton's law of gravitation. For a `mass` at a distance `radius` from the center of a mass

    Parameters:
    - mass: Mass of the attracting body in kilograms (eg, Earth)
    - radius: Distance from the center of the mass in meters (eg, Earth's radius: 6.371e6)

    Returns:
    - Gravitational acceleration in m/s²
    """
    global G
    return G * mass / (radius**2.0)


def fall_time_from_altitude(mass: float, radius: float, altitude: float) -> float:
    """
    Numerical integration for time to fall from given altitude to ground level.
    Calculate time to fall from a given altitude to Earth's surface, accounting for varying gravity with distance.

    Parameters:
    - mass: Mass of the Earth in kg
    - radius: Radius of the Earth in meters
    - altitude: Altitude above the surface in meters

    Returns:
    - Time in seconds to fall to the surface
    """
    global G
    r0 = radius + altitude  # Initial distance from center
    R = radius  # Earth's radius

    def integrand(r: float) -> float:
        return 1.0 / math.sqrt(2.0 * G * mass * (1.0 / r - 1.0 / r0))

    time, _ = quad(integrand, R, r0)
    return time


def fall_time_and_velocity(
    mass: float, radius: float, altitude: float
) -> tuple[float, float]:
    """
    Calculate the time to fall from a given altitude to Earth's surface,
    and the velocity at impact, accounting for varying gravity with distance.

    Parameters:
    - mass: Mass of the Earth in kg
    - radius: Radius of the Earth in meters
    - altitude: Altitude above the surface in meters

    Returns:
    - 2-Tuple: (time in seconds to fall, velocity in m/s at impact)
    """
    global G
    r0 = radius + altitude  # Initial distance from Earth's center
    R = radius  # Earth's radius

    def integrand(r: float) -> float:
        return 1.0 / math.sqrt(2.0 * G * mass * (1.0 / r - 1.0 / r0))

    time, _ = quad(integrand, R, r0)

    # Compute impact velocity
    velocity = math.sqrt(2.0 * G * mass * (1.0 / R - 1.0 / r0))

    return time, velocity


def atmospheric_density(altitude: float) -> float:
    """Approximate Earth atmospheric density as a function of altitude (in meters)."""
    rho0 = 1.225  # kg/m³ at sea level
    H = 8500.0  # scale height (m)
    return rho0 * math.exp(-altitude / H)


def fall_time_with_drag(
    mass: float, radius: float, altitude: float, area_m2: float, drag_coefficient: float
) -> tuple[float, float]:
    """
    Compute fall time and impact velocity from given altitude, including atmospheric drag.

    Parameters:
    - mass: Mass of the object in kg
    - radius: Radius of Earth in meters
    - altitude: Initial altitude in meters
    - area_m2: Cross-sectional area of the object (m²)
    - drag_coefficient: Drag coefficient (dimensionless)

    Returns:
    - 2-Tuple (fall time in seconds, impact velocity in m/s)
    """
    global G

    def deriv(_, y) -> list[float]:
        global G
        h, v = y
        r = radius + h
        g = G * 5.972e24 / r**2
        rho = atmospheric_density(h)
        drag = 0.5 * drag_coefficient * rho * area_m2 * v**2 / mass
        drag *= -1 if v > 0 else 1  # Opposes motion
        dvdt = -g + drag
        return [v, dvdt]

    y0 = [altitude, 0.0]  # initial altitude, initial velocity
    t_span = (0, 20000)  # reasonable upper bound for time in seconds

    def hit_ground(_, y) -> float:
        return y[0]  # Stop integration when h == 0

    hit_ground.terminal = True
    hit_ground.direction = -1

    sol = solve_ivp(deriv, t_span, y0, events=hit_ground, max_step=1.0)

    fall_time = sol.t[-1]
    impact_velocity = abs(sol.y[1][-1])
    return fall_time, impact_velocity


def relativistic_fall_time_and_velocity(
    mass: float, radius: float, altitude: float
) -> tuple[float, float, float]:
    """
    Calculate fall time with special relativity effects from a given altitude to Earth's surface,
    including proper time, coordinate time, and impact velocity.

    Parameters:
    - mass: Mass of Earth in kg
    - radius: Radius of Earth in meters
    - altitude: Altitude above Earth's surface in meters

    Returns:
    - 3-Tuple (tau / proper time in seconds, coordinate time in seconds, impact velocity in m/s)
    """
    global G, c
    R = radius
    r0 = R + altitude

    def velocity_at_radius(r: float) -> float:
        """Calculate velocity at a given radius using conservation of energy."""
        global G
        return (
            math.sqrt(2.0 * G * mass * (1.0 / R - 1.0 / r0))
            if r == R
            else math.sqrt(2.0 * G * mass * (1.0 / r - 1.0 / r0))
        )

    def dt_dr(r: float) -> float:
        """Coordinate time differential."""
        global G
        return 1.0 / math.sqrt(2.0 * G * mass * (1.0 / r - 1.0 / r0))

    def d_tau_dr(r: float) -> float:
        """Proper time differential with relativistic correction."""
        global c
        v = velocity_at_radius(r)
        gamma = 1.0 / math.sqrt(1.0 - v**2 / c**2)
        return dt_dr(r) / gamma

    # Coordinate time
    coord, _ = quad(dt_dr, R, r0)

    # Proper time
    tau, _ = quad(d_tau_dr, R, r0)

    # Impact velocity
    vel = velocity_at_radius(R)

    return tau, coord, vel


# Sample calculations if we run this file directly
if __name__ == "__main__":
    # ================= Gravitational acceleration at various altitudes =================
    ground_level = gravity_acceleration_for_radius(earth_mass, earth_radius)
    print(f"Gravitational acceleration at ground level: {ground_level:.5f} m/s²")
    low_level = gravity_acceleration_for_radius(
        earth_mass, earth_radius + 100 * 1000
    )  # 100km above ground
    print(f"Gravitational acceleration at 100km: {low_level:.5f} m/s²")
    mid_level = gravity_acceleration_for_radius(
        earth_mass, earth_radius + 250 * 1000
    )  # 250km above ground
    print(f"Gravitational acceleration at 250km: {mid_level:.5f} m/s²")

    # ================= Falling from given altitude, no drag =================
    altitude = 10_000.0  # 10 km
    print()
    print("Falling from 10 km altitude:")
    time_to_fall, vel = fall_time_and_velocity(earth_mass, earth_radius, altitude)
    print(f"Time to fall: {time_to_fall:.2f} seconds")
    print(f"Impact velocity: {vel:.2f} m/s")

    # ================= Falling from given altitude, with drag =================
    altitude = 10_000.0  # 10 km
    # Parameters for a 1-meter radius sphere
    mass = 80.0  # kg
    area = math.pi * 0.5**2  # m² (1m diameter sphere)
    Cd = 0.47  # drag coefficient of a sphere

    time, velocity = fall_time_with_drag(
        mass=mass, radius=6.371e6, altitude=altitude, area_m2=area, drag_coefficient=Cd
    )

    print()
    print(f"Falling from {altitude} m with drag for 80kg sphere:")
    print(f"Fall time: {time:.2f} s")
    print(f"Impact velocity: {velocity:.2f} m/s")

    # ================= Falling from given altitude, taking into account special relativity =================
    altitude = 1_000_000.0  # 1000 km
    tau, t, v = relativistic_fall_time_and_velocity(earth_mass, earth_radius, altitude)
    print()
    print("Falling from 1000 km altitude with special relativity:")
    print(f"Proper time: {tau:.8f} s")
    print(f"Coordinate time: {t:.8f} s")
    print(f"Impact velocity: {v:.2f} m/s")
