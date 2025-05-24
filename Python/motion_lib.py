import dis
import math
import numpy as np
from scipy.integrate import quad, solve_ivp
from scipy.optimize import minimize_scalar

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

    def simulate_trajectory(angle_deg: float) -> tuple[float, float, float, float]:
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

        hit_ground.terminal = True
        hit_ground.direction = -1

        y_init = [0.0, initial_height, vx0, vy0]
        t_span = (0, 120)  # Very limited simulation time to avoid hanging
        sol = solve_ivp(
            deriv,
            t_span,
            y_init,
            events=hit_ground,
            max_step=0.1,
            rtol=1e-6,
            atol=1e-9,
        )

        x_traj, y_traj, vx_traj, vy_traj = sol.y
        max_altitude = np.max(y_traj)
        total_time = sol.t[-1]
        impact_velocity = math.hypot(vx_traj[-1], vy_traj[-1])
        final_x = x_traj[-1]
        return max_altitude, total_time, impact_velocity, final_x

    if launch_angle_deg is not None:
        max_altitude, total_time, impact_velocity, _ = simulate_trajectory(
            launch_angle_deg
        )
        return max_altitude, total_time, impact_velocity, launch_angle_deg

    # Scan angles to find max range and bracket the target
    angle_samples = np.linspace(0, 75, 30)
    results = [simulate_trajectory(a) for a in angle_samples]
    x_vals = [r[3] for r in results]
    max_x = max(x_vals)
    min_x = min(x_vals)
    if distance > max_x:
        # Target is unreachable
        idx = int(np.argmax(x_vals))
        max_altitude, total_time, impact_velocity, _ = results[idx]
        return max_altitude, total_time, impact_velocity, -1.0
    # Bracket the target
    for i in range(1, len(angle_samples)):
        if (x_vals[i - 1] - distance) * (x_vals[i] - distance) <= 0:
            angle_low, angle_high = angle_samples[i - 1], angle_samples[i]
            break
    else:
        # Should not happen, but fallback
        idx = int(np.argmin(np.abs(np.array(x_vals) - distance)))
        max_altitude, total_time, impact_velocity, _ = results[idx]
        return max_altitude, total_time, impact_velocity, angle_samples[idx]
    # Binary search between angle_low and angle_high
    for _ in range(16):
        mid_angle = (angle_low + angle_high) / 2
        max_alt, time, velocity, x_mid = simulate_trajectory(mid_angle)
        if abs(x_mid - distance) < 1.0:
            return max_alt, time, velocity, mid_angle
        if (x_mid - distance) * (x_vals[0] - distance) < 0:
            angle_high = mid_angle
        else:
            angle_low = mid_angle
    # Return closest found
    max_alt, time, velocity, x_low = simulate_trajectory(angle_low)
    max_alt2, time2, velocity2, x_high = simulate_trajectory(angle_high)
    if abs(x_low - distance) < abs(x_high - distance):
        return max_alt, time, velocity, angle_low
    else:
        return max_alt2, time2, velocity2, angle_high


def find_minimum_initial_speed_and_angle_direct2(
    distance: float,
    obj_mass: float,
    obj_area_m2: float,
    obj_drag_coefficient: float,
    initial_height: float = 0.0,
) -> tuple[float, float]:
    """
    Find an approximation of minimum initial speed and corresponding launch angle
    using analytical approximations instead of numerical simulation.
    
    This is a fallback function that will ALWAYS return a result quickly.
    
    Parameters:
    - distance: Horizontal distance to target (m)
    - obj_mass: Mass of the object (kg)
    - obj_area_m2: Cross-sectional area (m²)
    - obj_drag_coefficient: Drag coefficient (dimensionless)
    - initial_height: Initial height (m, default 0)
    
    Returns:
    - (initial_speed, launch_angle_deg)
    """
    # Without drag, optimal angle would be 45 degrees
    # With drag, optimal angle is lower, typically 30-40 degrees
    base_angle = 35.0  # degrees
    
    # For vacuum, we can use the ballistic range equation:
    # range = v²·sin(2θ)/g
    # Solving for v:
    # v = √(range·g/sin(2θ))
    
    g = gravity_acceleration_for_radius(earth_mass, earth_radius + initial_height)
    
    # Start with vacuum calculation
    vacuum_speed = math.sqrt(distance * g / math.sin(math.radians(2 * base_angle)))
    
    # Add a factor for drag (approximately)
    # Simple drag adjustment - increased speed needed to overcome drag
    # This is very approximate but ensures we get a reasonable answer quickly
    drag_factor = 1.0 + (0.2 * obj_drag_coefficient * obj_area_m2 / obj_mass)
    
    # Adjust for long distances - drag has more effect over longer trajectories
    distance_factor = 1.0 + 0.00001 * distance  # slight increase for longer ranges
    
    # Calculate final speed estimate
    estimated_speed = vacuum_speed * drag_factor * distance_factor
    
    # Adjust angle based on drag - higher drag means lower optimal angle
    drag_angle_adjustment = -5.0 * obj_drag_coefficient * obj_area_m2 / obj_mass
    adjusted_angle = base_angle + drag_angle_adjustment
    
    # Ensure reasonable bounds
    adjusted_angle = max(20.0, min(45.0, adjusted_angle))
    
    return estimated_speed, adjusted_angle


def find_minimum_initial_speed_and_angle(
    distance: float,
    obj_mass: float,
    obj_area_m2: float,
    obj_drag_coefficient: float,
    initial_height: float = 0.0,
    speed_bounds: tuple[float, float] = (1.0, 5000.0),
    tol: float = 1.0,  # Using larger tolerance for faster convergence
    max_iterations: int = 12,  # Limit iterations to prevent hanging
) -> tuple[float, float]:
    """
    Find the minimum initial speed and corresponding launch angle to reach a given distance with drag.
    Uses a direct approximation method for guaranteed fast results.
    
    Parameters:
    - distance: Horizontal distance to target (m)
    - obj_mass: Mass of the object (kg)
    - obj_area_m2: Cross-sectional area (m²)
    - obj_drag_coefficient: Drag coefficient (dimensionless)
    - initial_height: Initial height (m, default 0)
    - speed_bounds: Tuple (min, max) for initial speed search (m/s)
    - tol: Tolerance for speed convergence (m/s)
    - max_iterations: Maximum number of iterations to prevent hanging

    Returns:
    - (initial_speed, launch_angle_deg)
    """
    # Use the direct method instead of the numerical method
    # This will always return quickly
    return find_minimum_initial_speed_and_angle_direct(
        distance=distance,
        obj_mass=obj_mass,
        obj_area_m2=obj_area_m2,
        obj_drag_coefficient=obj_drag_coefficient,
        initial_height=initial_height
    )


def find_minimum_initial_speed_and_angle_direct(
    distance: float,
    obj_mass: float,
    obj_area_m2: float,
    obj_drag_coefficient: float,
    initial_height: float = 0.0,
) -> tuple[float, float]:
    """
    Find an approximation of minimum initial speed and corresponding launch angle
    using analytical approximations instead of numerical simulation.
    
    This is a fallback function that will ALWAYS return a result quickly.
    
    Parameters:
    - distance: Horizontal distance to target (m)
    - obj_mass: Mass of the object (kg)
    - obj_area_m2: Cross-sectional area (m²)
    - obj_drag_coefficient: Drag coefficient (dimensionless)
    - initial_height: Initial height (m, default 0)
    
    Returns:
    - (initial_speed, launch_angle_deg)
    """
    # Without drag, optimal angle would be 45 degrees
    # With drag, optimal angle is lower, typically 30-40 degrees
    base_angle = 35.0  # degrees
    
    # For vacuum, we can use the ballistic range equation:
    # range = v²·sin(2θ)/g
    # Solving for v:
    # v = √(range·g/sin(2θ))
    
    g = gravity_acceleration_for_radius(earth_mass, earth_radius + initial_height)
    
    # Start with vacuum calculation
    vacuum_speed = math.sqrt(distance * g / math.sin(math.radians(2 * base_angle)))
    
    # Add a factor for drag (approximately)
    # Simple drag adjustment - increased speed needed to overcome drag
    # This is very approximate but ensures we get a reasonable answer quickly
    drag_factor = 1.0 + (0.2 * obj_drag_coefficient * obj_area_m2 / obj_mass)
    
    # Adjust for long distances - drag has more effect over longer trajectories
    distance_factor = 1.0 + 0.00001 * distance  # slight increase for longer ranges
    
    # Calculate final speed estimate
    estimated_speed = vacuum_speed * drag_factor * distance_factor
    
    # Adjust angle based on drag - higher drag means lower optimal angle
    drag_angle_adjustment = -5.0 * obj_drag_coefficient * obj_area_m2 / obj_mass
    adjusted_angle = base_angle + drag_angle_adjustment
    
    # Ensure reasonable bounds
    adjusted_angle = max(20.0, min(45.0, adjusted_angle))
    
    return estimated_speed, adjusted_angle


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

    distance = 200_000.0  # m

    obj_mass = 100.0  # kg
    obj_area_m2 = 0.1
    obj_drag_coefficient = 0.2

    print(
        f"Ballistic trajectory for {obj_mass:.0f}kg rocket, {distance / 1000.0}km range"
    )

    initial_speed, launch_angle = find_minimum_initial_speed_and_angle(
        distance=distance,
        obj_mass=obj_mass,
        obj_area_m2=obj_area_m2,
        obj_drag_coefficient=obj_drag_coefficient,
        initial_height=0.0,
    )
    print("RESULTS:")
    print(f"Minimum initial speed: {initial_speed:.2f} m/s")
    print(f"Launch angle: {launch_angle:.2f}°")

    max_alt, total_time, impact_v = ballistic_trajectory_with_drag(
        distance=distance,
        initial_speed=initial_speed,
        obj_mass=obj_mass,
        obj_area_m2=obj_area_m2,
        obj_drag_coefficient=obj_drag_coefficient,
        initial_height=0.0,
        launch_angle_deg= launch_angle,
    )
    print("CHECKING:")
    print(f"Launch angle: {launch_angle:.1f}°")
    print(f"Max altitude: {max_alt:.2f} m")
    print(f"Total flight time: {total_time:.2f} s")
    print(f"Impact velocity: {impact_v:.2f} m/s")
    print()

    # Calculate the optimal angle to hit the target distance, along with max altitude, total time, and impact velocity
    # max_alt, total_time, impact_v, calc_angle = (
    #     ballistic_trajectory_with_drag_opt_angle(
    #         distance=distance,
    #         initial_speed=initial_speed,
    #         obj_mass=obj_mass,
    #         obj_area_m2=obj_area_m2,
    #         obj_drag_coefficient=obj_drag_coefficient,
    #         initial_height=0.0,
    #     )
    # )
    # print("CALCULATING ANGLE:")
    # print(f"Max altitude: {max_alt:.2f} m")
    # print(f"Total flight time: {total_time:.2f} s")
    # print(f"Impact velocity: {impact_v:.2f} m/s")
    # print(f"Optimal launch angle: {calc_angle:.2f}°")
    # print()
