import numpy as np
from scipy.integrate import solve_ivp
import math


def projectile_distance1(
    speed,
    angle_deg,
    mass,
    surface_area,
    drag_coeff=0.47,
    air_density=1.225,
    gravity=9.81,
):
    """
    Calculate projectile distance with air resistance using numerical integration.

    ```
    Args:
        speed (float): Initial velocity (m/s)
        angle_deg (float): Launch angle (degrees)
        mass (float): Projectile mass (kg)
        surface_area (float): Cross-sectional area (m²)
        drag_coeff (float): Drag coefficient (default 0.47 for sphere)
        air_density (float): Air density (kg/m³, default sea level)
        gravity (float): Gravitational acceleration (m/s²)

    Returns:
        float: Horizontal distance traveled (m)
    """

    # Convert angle to radians
    angle_rad = math.radians(angle_deg)

    # Initial conditions: [x, y, vx, vy]
    y0 = [0, 0, speed * math.cos(angle_rad), speed * math.sin(angle_rad)]

    # Drag coefficient factor
    k = 0.5 * air_density * drag_coeff * surface_area / mass

    def equations_of_motion(t, state):
        """
        System of differential equations for projectile motion with air resistance.
        state = [x, y, vx, vy]
        """
        x, y, vx, vy = state

        # Current speed
        v = math.sqrt(vx**2 + vy**2)

        # Air resistance accelerations (opposing velocity)
        ax_drag = -k * v * vx
        ay_drag = -k * v * vy

        # Total accelerations
        ax = ax_drag
        ay = ay_drag - gravity

        return [vx, vy, ax, ay]

    def hit_ground(t, state):
        """Event function to detect when projectile hits ground (y = 0)"""
        return state[1]  # y coordinate

    hit_ground.terminal = True
    hit_ground.direction = -1

    # Integrate until projectile hits ground
    # Use generous time span - integration will stop at ground impact
    t_span = (0, 2 * speed * math.sin(angle_rad) / gravity)  # Rough estimate

    sol = solve_ivp(
        equations_of_motion,
        t_span,
        y0,
        events=hit_ground,
        dense_output=True,
        rtol=1e-8,
        atol=1e-10,
    )

    if sol.t_events[0].size > 0:
        # Get final state when projectile hits ground
        t_final = sol.t_events[0][0]
        final_state = sol.sol(t_final)
        return final_state[0]  # x coordinate (distance)
    else:
        # Fallback: return distance at end of integration
        return sol.y[0][-1]


def projectile_distance2(
    speed,
    angle_deg,
    mass,
    surface_area,
    drag_coeff=0.47,
    air_density=1.225,
    gravity=9.81,
    altitude_model=False,
    rtol=1e-6,
):
    """
    Calculate projectile distance with air resistance using numerical integration.
    This is more accurate compared to projectile_distance1:
        It can model varying air density with altitude, which is physically realistic
        It has better numerical stability with edge case handling
        It uses an 8th-order integration method with configurable precision
        The adaptive time span estimation better handles high-drag scenarios
        The altitude-dependent air density model is particularly important for long-range or high-altitude projectiles, as the assumption of constant air density becomes increasingly inaccurate with height.

    Args:
        speed (float): Initial velocity (m/s)
        angle_deg (float): Launch angle (degrees)
        mass (float): Projectile mass (kg)
        surface_area (float): Cross-sectional area (m²)
        drag_coeff (float): Drag coefficient (default 0.47 for sphere)
        air_density (float): Air density at launch (kg/m³, default sea level)
        gravity (float): Gravitational acceleration (m/s²)
        altitude_model (bool): Include altitude-dependent air density
        rtol (float): Relative tolerance for integration

    Returns:
        float: Horizontal distance traveled (m)

    Raises:
        ValueError: If input parameters are invalid
    """

    # Input validation
    if speed <= 0:
        raise ValueError("Speed must be positive")
    if not 0 <= angle_deg <= 90:
        raise ValueError("Angle must be between 0 and 90 degrees")
    if mass <= 0:
        raise ValueError("Mass must be positive")
    if surface_area <= 0:
        raise ValueError("Surface area must be positive")

    # Convert angle to radians
    angle_rad = math.radians(angle_deg)

    # Initial conditions: [x, y, vx, vy]
    y0 = [0, 0, speed * math.cos(angle_rad), speed * math.sin(angle_rad)]

    # Base drag coefficient factor
    k_base = 0.5 * drag_coeff * surface_area / mass

    def get_air_density(altitude):
        """Calculate air density at given altitude using exponential model"""
        if not altitude_model:
            return air_density
        # Exponential atmosphere model
        scale_height = 8400  # meters
        return air_density * math.exp(-altitude / scale_height)

    def equations_of_motion(t, state):
        """
        System of differential equations for projectile motion with air resistance.
        state = [x, y, vx, vy]
        """
        x, y, vx, vy = state

        # Handle near-zero velocity to avoid numerical issues
        v = math.sqrt(vx**2 + vy**2)
        if v < 1e-10:
            return [0, 0, 0, -gravity]

        # Air density at current altitude
        rho = get_air_density(max(0, y))
        k = k_base * rho

        # Air resistance accelerations (opposing velocity)
        ax_drag = -k * v * vx
        ay_drag = -k * v * vy

        # Total accelerations
        ax = ax_drag
        ay = ay_drag - gravity

        return [vx, vy, ax, ay]

    def hit_ground(t, state):
        """Event function to detect when projectile hits ground (y <= 0)"""
        return state[1]  # y coordinate

    hit_ground.terminal = True
    hit_ground.direction = -1

    # Adaptive time span estimation
    # Start with vacuum estimate, then scale by drag factor
    t_vacuum = 2 * speed * math.sin(angle_rad) / gravity
    drag_factor = k_base * air_density * speed
    t_estimate = t_vacuum * (1 + 2 * drag_factor)  # Heuristic scaling
    t_span = (0, min(t_estimate, 1000))  # Cap at reasonable maximum

    sol = solve_ivp(
        equations_of_motion,
        t_span,
        y0,
        events=hit_ground,
        dense_output=True,
        rtol=rtol,
        atol=1e-10,
        method="DOP853",
    )

    if sol.t_events[0].size > 0:
        # Get final state when projectile hits ground
        t_final = sol.t_events[0][0]
        final_state = sol.sol(t_final)
        return final_state[0]  # x coordinate (distance)
    else:
        # Fallback: return distance at end of integration
        return sol.y[0][-1]


def projectile_distance3(
    speed,
    angle_deg,
    mass,
    surface_area,
    drag_coeff=0.47,
    air_density=1.225,
    gravity=9.81,
    altitude_model=False,
    rtol=1e-6,
    shape="sphere",
):
    """
    Calculate projectile distance with air resistance using numerical integration.

    Args:
        speed (float): Initial velocity (m/s)
        angle_deg (float): Launch angle (degrees)
        mass (float): Projectile mass (kg)
        surface_area (float): Cross-sectional area (m²)
        drag_coeff (float): Drag coefficient (auto-set if shape specified)
        air_density (float): Air density at launch (kg/m³, default sea level)
        gravity (float): Gravitational acceleration (m/s²)
        altitude_model (bool): Include altitude-dependent air density
        rtol (float): Relative tolerance for integration
        shape (str): Predefined shape for automatic Cd selection

    Returns:
        float: Horizontal distance traveled (m)

    Raises:
        ValueError: If input parameters are invalid
    """

    # Shape-specific drag coefficients (at typical Reynolds numbers)
    shape_coefficients = {
        "sphere": 0.47,
        "human_standing": 1.2,  # Person upright, frontal area
        "human_prone": 0.7,  # Person lying flat
        "cylinder_side": 1.0,  # Cylinder, side-on
        "cylinder_end": 0.8,  # Cylinder, end-on
        "flat_plate": 1.28,  # Flat plate perpendicular to flow
        "streamlined": 0.04,  # Teardrop/airfoil shape
        "cube": 1.05,  # Cube face-on
        "disk": 1.17,  # Thin circular disk
        "cone_base": 0.5,  # Cone, base facing flow
        "parachute": 1.3,  # Open parachute (approximate)
    }

    # Auto-select drag coefficient based on shape
    if shape in shape_coefficients:
        drag_coeff = shape_coefficients[shape]

    # Input validation
    if speed <= 0:
        raise ValueError("Speed must be positive")
    if not 0 <= angle_deg <= 90:
        raise ValueError("Angle must be between 0 and 90 degrees")
    if mass <= 0:
        raise ValueError("Mass must be positive")
    if surface_area <= 0:
        raise ValueError("Surface area must be positive")

    # Convert angle to radians
    angle_rad = math.radians(angle_deg)

    # Initial conditions: [x, y, vx, vy]
    y0 = [0, 0, speed * math.cos(angle_rad), speed * math.sin(angle_rad)]

    # Base drag coefficient factor
    k_base = 0.5 * drag_coeff * surface_area / mass

    def get_air_density(altitude):
        """Calculate air density at given altitude using exponential model"""
        if not altitude_model:
            return air_density
        # Exponential atmosphere model
        scale_height = 8400  # meters
        return air_density * math.exp(-altitude / scale_height)

    def equations_of_motion(t, state):
        """
        System of differential equations for projectile motion with air resistance.
        state = [x, y, vx, vy]
        """
        x, y, vx, vy = state

        # Handle near-zero velocity to avoid numerical issues
        v = math.sqrt(vx**2 + vy**2)
        if v < 1e-10:
            return [0, 0, 0, -gravity]

        # Air density at current altitude
        rho = get_air_density(max(0, y))
        k = k_base * rho

        # Air resistance accelerations (opposing velocity)
        ax_drag = -k * v * vx
        ay_drag = -k * v * vy

        # Total accelerations
        ax = ax_drag
        ay = ay_drag - gravity

        return [vx, vy, ax, ay]

    def hit_ground(t, state):
        """Event function to detect when projectile hits ground (y <= 0)"""
        return state[1]  # y coordinate

    hit_ground.terminal = True
    hit_ground.direction = -1

    # Adaptive time span estimation
    # Start with vacuum estimate, then scale by drag factor
    t_vacuum = 2 * speed * math.sin(angle_rad) / gravity
    drag_factor = k_base * air_density * speed
    t_estimate = t_vacuum * (1 + 2 * drag_factor)  # Heuristic scaling
    t_span = (0, min(t_estimate, 1000))  # Cap at reasonable maximum

    sol = solve_ivp(
        equations_of_motion,
        t_span,
        y0,
        events=hit_ground,
        dense_output=True,
        rtol=rtol,
        atol=1e-10,
        method="DOP853",
    )

    if sol.t_events[0].size > 0:
        # Get final state when projectile hits ground
        t_final = sol.t_events[0][0]
        final_state = sol.sol(t_final)
        return final_state[0]  # x coordinate (distance)
    else:
        # Fallback: return distance at end of integration
        return sol.y[0][-1]


# =============================================================================
# Example usage and comparison

if __name__ == "__main__":
    # Test case: cannonball
    speed = 100  # m/s
    angle = 45  # degrees
    mass = 5  # kg
    area = 0.05  # m² (roughly 25cm diameter sphere)

    distance_with_drag = projectile_distance1(speed, angle, mass, area)

    # Compare with vacuum calculation
    angle_rad = math.radians(angle)
    distance_vacuum = speed**2 * math.sin(2 * angle_rad) / 9.81

    print(f"Distance with air resistance: {distance_with_drag:.1f} m")
    print(f"Distance in vacuum: {distance_vacuum:.1f} m")
    print(
        f"Reduction due to air resistance: {(1 - distance_with_drag / distance_vacuum) * 100:.1f}%"
    )

    # =============================================================================

    # second test with improved method
    print("Method 2 (improved):")
    distance_with_drag = projectile_distance2(speed, angle, mass, area)

    # Compare with vacuum calculation
    angle_rad = math.radians(angle)
    distance_vacuum = speed**2 * math.sin(2 * angle_rad) / 9.81

    print(f"Distance with air resistance: {distance_with_drag:.1f} m")
    print(f"Distance in vacuum: {distance_vacuum:.1f} m")
    print(
        f"Reduction due to air resistance: {(1 - distance_with_drag / distance_vacuum) * 100:.1f}%"
    )

    # =============================================================================

    print("Method 3 (shape-based):")
    # Test case: Human projectile (extreme example for demonstration)
    speed = 100  # m/s
    angle = 45  # degrees
    mass = 70  # kg (average person)

    # Human frontal area standing ~0.7 m² (height×width ≈ 1.7m × 0.4m)
    area_human = 0.7  # m²

    print("Comparison of different shapes at same launch conditions:")
    print(
        f"Speed: {speed} m/s, Angle: {angle}°, Mass: {mass} kg, Area: {area_human} m²\n"
    )

    shapes_to_test = ["sphere", "human_standing", "streamlined", "flat_plate"]

    for shape in shapes_to_test:
        distance = projectile_distance3(speed, angle, mass, area_human, shape=shape)
        print(f"{shape:15}: {distance:6.1f} m")

    # Compare with vacuum
    angle_rad = math.radians(angle)
    distance_vacuum = speed**2 * math.sin(2 * angle_rad) / 9.81
    print(f"{'vacuum':15}: {distance_vacuum:6.1f} m")

    print("\n" + "=" * 50)
    print("Human vs. cannonball comparison:")

    # Human
    human_dist = projectile_distance3(100, 45, 70, 0.7, shape="human_standing")

    # Cannonball (same kinetic energy)
    cannon_speed = math.sqrt(0.5 * 70 * 100**2 / (0.5 * 5))  # Same KE, 5kg ball
    cannon_dist = projectile_distance3(cannon_speed, 45, 5, 0.05, shape="sphere")

    print(f"Human (70kg, 100 m/s):     {human_dist:.1f} m")
    print(f"Cannonball (5kg, {cannon_speed:.1f} m/s): {cannon_dist:.1f} m")
