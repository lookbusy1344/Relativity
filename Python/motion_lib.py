import dis
import math
import numpy as np
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


def calculate_gravitational_constant(
    mass: float, radius: float, gravity: float
) -> float:
    """EXAMPLE: Calculate G from mass, radius, and surface gravity."""
    return gravity * radius**2 / mass


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
    altitude: float, obj_mass: float, obj_area_m2: float, obj_drag_coefficient: float
) -> tuple[float, float]:
    """
    Compute fall time and impact velocity from given altitude, including atmospheric drag.

    Parameters:
    - altitude: Initial altitude in meters
    - obj_mass: Mass of the object in kg
    - obj_area_m2: Cross-sectional area of the object (m²)
    - obj_drag_coefficient: Drag coefficient (dimensionless)

    Returns:
    - 2-Tuple (fall time in seconds, impact velocity in m/s)
    """
    global G, earth_radius

    # Some examples of drag coefficients:
    # A smooth sphere: Cd ≈ 0.47
    # A flat plate perpendicular to flow: Cd ≈ 1.28
    # A streamlined body: Cd ≈ 0.04
    # Person head first: Cd ≈ 0.7
    # Person belly first: Cd ≈ 1.2

    def deriv(_, y) -> list[float]:
        global G, earth_radius
        h, v = y
        r = earth_radius + h
        g = G * earth_mass / r**2
        rho = atmospheric_density(h)
        drag = 0.5 * obj_drag_coefficient * rho * obj_area_m2 * v**2 / obj_mass
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


def ballistic_trajectory_with_drag(
    distance: float,
    launch_angle_deg: float,
    initial_speed: float,
    obj_mass: float,
    obj_area_m2: float,
    obj_drag_coefficient: float,
    initial_height: float = 0.0,
) -> tuple[float, float, float]:
    """
    Simulate a 2D ballistic trajectory with atmospheric drag.

    Parameters:
    - distance: Horizontal distance to target (m)
    - launch_angle_deg: Launch angle above horizontal (degrees)
    - initial_speed: Initial speed (m/s). Object is instantaneously launched at this speed with no further acceleration
    - obj_mass: Mass of the object (kg)
    - obj_area_m2: Cross-sectional area (m²)
    - obj_drag_coefficient: Drag coefficient (dimensionless)
    - initial_height: Initial height (m, default 0)

    Returns:
    - (max_altitude, total_time, impact_velocity)
    """
    angle = math.radians(launch_angle_deg)
    vx0 = initial_speed * math.cos(angle)
    vy0 = initial_speed * math.sin(angle)

    def deriv(_, y):
        x, y_, vx, vy = y
        v = math.hypot(vx, vy)
        h = max(y_, 0.0)
        rho = atmospheric_density(h)
        drag = 0.5 * obj_drag_coefficient * rho * obj_area_m2 * v / obj_mass
        dvx = -drag * vx
        dvy = -gravity_acceleration_for_radius(earth_mass, earth_radius + h) - drag * vy
        return [vx, vy, dvx, dvy]

    def hit_ground(_, y):
        return y[1]

    def reach_distance(_, y):
        return y[0] - distance

    hit_ground.terminal = True
    hit_ground.direction = -1
    reach_distance.terminal = True
    reach_distance.direction = 1

    y_init = [0.0, initial_height, vx0, vy0]
    t_span = (0, 10000)
    sol = solve_ivp(
        deriv,
        t_span,
        y_init,
        events=[hit_ground, reach_distance],
        max_step=0.1,
        rtol=1e-6,
        atol=1e-9,
    )

    x_traj, y_traj, vx_traj, vy_traj = sol.y
    # Find the index where the projectile reaches the specified distance or hits the ground
    if sol.t_events[1].size > 0:
        idx = np.searchsorted(x_traj, distance)
    else:
        idx = -1  # fallback to last point if distance not reached

    max_altitude = np.max(y_traj[: idx + 1]) if idx > 0 else np.max(y_traj)
    total_time = sol.t[idx] if idx > 0 else sol.t[-1]
    impact_velocity = (
        math.hypot(vx_traj[idx], vy_traj[idx])
        if idx > 0
        else math.hypot(vx_traj[-1], vy_traj[-1])
    )
    return max_altitude, total_time, impact_velocity


def ballistic_trajectory_with_drag_opt_angle(
    distance: float,
    initial_speed: float,
    obj_mass: float,
    obj_area_m2: float,
    obj_drag_coefficient: float,
    initial_height: float = 0.0,
    launch_angle_deg: float | None = None,
) -> tuple[float, float, float, float]:
    """
    Simulate a 2D ballistic trajectory with atmospheric drag.
    If launch_angle_deg is not provided, calculates the optimal angle to hit the target distance.

    Parameters:
    - distance: Horizontal distance to target (m)
    - initial_speed: Initial speed (m/s). Object is instantaneously launched at this speed with no further acceleration
    - obj_mass: Mass of the object (kg)
    - obj_area_m2: Cross-sectional area (m²)
    - obj_drag_coefficient: Drag coefficient (dimensionless)
    - initial_height: Initial height (m, default 0)
    - launch_angle_deg: Launch angle above horizontal (degrees). If None, calculated automatically.

    Returns:
    - (max_altitude, total_time, impact_velocity, launch_angle_deg)
    """

    def simulate_trajectory(angle_deg: float) -> tuple[float, float, float, bool]:
        angle = math.radians(angle_deg)
        vx0 = initial_speed * math.cos(angle)
        vy0 = initial_speed * math.sin(angle)

        def deriv(_, y):
            x, y_, vx, vy = y
            v = math.hypot(vx, vy)
            h = max(y_, 0.0)
            rho = atmospheric_density(h)
            drag = 0.5 * obj_drag_coefficient * rho * obj_area_m2 * v / obj_mass
            dvx = -drag * vx
            dvy = (
                -gravity_acceleration_for_radius(earth_mass, earth_radius + h)
                - drag * vy
            )
            return [vx, vy, dvx, dvy]

        def hit_ground(_, y):
            return y[1]

        def reach_distance(_, y):
            return y[0] - distance

        hit_ground.terminal = True
        hit_ground.direction = -1
        reach_distance.terminal = True
        reach_distance.direction = 1

        y_init = [0.0, initial_height, vx0, vy0]
        t_span = (0, 10000)
        sol = solve_ivp(
            deriv,
            t_span,
            y_init,
            events=[hit_ground, reach_distance],
            max_step=0.1,
            rtol=1e-6,
            atol=1e-9,
        )

        x_traj, y_traj, vx_traj, vy_traj = sol.y

        # Did we reach the target distance?
        target_reached = len(sol.t_events[1]) > 0
        max_altitude = np.max(y_traj)
        total_time = sol.t[-1]
        impact_velocity = math.hypot(vx_traj[-1], vy_traj[-1])

        return max_altitude, total_time, impact_velocity, target_reached

    # If launch angle is provided, just use it
    if launch_angle_deg is not None:
        max_altitude, total_time, impact_velocity, _ = simulate_trajectory(
            launch_angle_deg
        )
        return max_altitude, total_time, impact_velocity, launch_angle_deg

    # Otherwise, find the optimal angle
    # Use a practical upper bound (e.g., 75°) instead of 90° for reachability
    angle_low, angle_high = 0.0, 75.0
    optimal_angle = None
    best_results = None

    # First check if any angle works
    _, _, _, low_reaches = simulate_trajectory(angle_low)
    _, _, _, high_reaches = simulate_trajectory(angle_high)

    if not low_reaches and not high_reaches:
        # Target is too far for given speed
        max_altitude, total_time, impact_velocity, _ = simulate_trajectory(45.0)
        return max_altitude, total_time, impact_velocity, -1.0  # No valid angle found

    # Binary search for optimal angle
    for _ in range(12):  # Increase iterations for better precision
        mid_angle = (angle_low + angle_high) / 2
        max_alt, time, velocity, reaches = simulate_trajectory(mid_angle)

        if reaches:
            optimal_angle = mid_angle
            best_results = (max_alt, time, velocity)
            angle_high = mid_angle  # Try to find a lower angle
        else:
            angle_low = mid_angle  # Angle too low, need higher

    if optimal_angle is None:
        max_altitude, total_time, impact_velocity, _ = simulate_trajectory(angle_high)
        return max_altitude, total_time, impact_velocity, angle_high

    return *best_results, optimal_angle  # type: ignore


def get_results(altitude_km: float) -> None:
    global earth_mass, earth_radius

    print("================================================")
    print(f"Falling from {altitude_km} km altitude:")
    altitude = altitude_km * 1000.0  # Convert km to m

    # Gravitational acceleration at given altitude
    accel = gravity_acceleration_for_radius(earth_mass, earth_radius + altitude)
    print(f"Gravitational acceleration: {accel:.5f} m/s^2")

    # Time & velocity to fall from given altitude, no drag
    time_to_fall, vel = fall_time_and_velocity(earth_mass, earth_radius, altitude)
    print()
    print(f"Time to fall: {time_to_fall:.2f} s")
    print(f"Impact velocity: {vel:.2f} m/s")

    # Falling from given altitude, taking into account special relativity
    tau, t, v = relativistic_fall_time_and_velocity(earth_mass, earth_radius, altitude)
    print()
    print("Falling from altitude with special relativity, no drag:")
    print(f"Proper time: {tau:.8f} s")
    print(f"Coordinate time: {t:.8f} s")
    print(f"Impact velocity: {v:.2f} m/s")

    # Time & velocity to fall from given altitude, with drag
    # Parameters for skydiver, head first
    mass_obj = 70.0  # kg
    area = 0.2  # math.pi * 0.5**2  # m² (1m diameter sphere)
    Cd = 0.7  # drag coefficient of person head first

    time, velocity = fall_time_with_drag(
        altitude=altitude,
        obj_mass=mass_obj,
        obj_area_m2=area,
        obj_drag_coefficient=Cd,
    )
    print()
    print("Falling with drag for skydiver:")
    print(f"Fall time: {time:.2f} s")
    print(f"Impact velocity: {velocity:.2f} m/s")


# Sample calculations if we run this file directly
if __name__ == "__main__":
    # get_results(1000)
    # get_results(10)
    # get_results(1.5)
    # get_results(1)
    # get_results(0.5)  # 500m

    distance = 15_000.0  # m
    initial_speed = 1_000.0  # m/s
    # launch_angle_deg = 9.0  # degrees
    obj_mass = 100.0  # kg
    obj_area_m2 = 0.1
    obj_drag_coefficient = 0.2

    print(
        f"Ballistic trajectory for {obj_mass:.0f}kg rocket, {distance / 1000.0}km range, initial speed: {initial_speed:.0f} m/s"
    )

    # Calculate the optimal angle to hit the target distance, along with max altitude, total time, and impact velocity
    max_alt, total_time, impact_v, calc_angle = (
        ballistic_trajectory_with_drag_opt_angle(
            distance=distance,
            initial_speed=initial_speed,
            obj_mass=obj_mass,
            obj_area_m2=obj_area_m2,
            obj_drag_coefficient=obj_drag_coefficient,
            initial_height=0.0,
        )
    )
    print("CALCULATING ANGLE:")
    print(f"Max altitude: {max_alt:.2f} m")
    print(f"Total flight time: {total_time:.2f} s")
    print(f"Impact velocity: {impact_v:.2f} m/s")
    print(f"Optimal launch angle: {calc_angle:.2f}°")
    print()

    if calc_angle < 0.0:
        print("No valid angle found for the given parameters.")
        exit(1)

    max_alt, total_time, impact_v = ballistic_trajectory_with_drag(
        distance=distance,
        initial_speed=initial_speed,
        obj_mass=obj_mass,
        obj_area_m2=obj_area_m2,
        obj_drag_coefficient=obj_drag_coefficient,
        initial_height=0.0,
        launch_angle_deg=calc_angle,
    )
    print("CHECKING:")
    print(f"Launch angle: {calc_angle:.1f}°")
    print(f"Max altitude: {max_alt:.2f} m")
    print(f"Total flight time: {total_time:.2f} s")
    print(f"Impact velocity: {impact_v:.2f} m/s")
    print()
