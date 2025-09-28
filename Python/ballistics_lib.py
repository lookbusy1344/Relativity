import numpy as np
from scipy.integrate import solve_ivp
import math


def projectile_distance(
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


# =============================================================================
# Example usage and comparison

if __name__ == "__main__":
    # Test case: cannonball
    speed = 100  # m/s
    angle = 45  # degrees
    mass = 5  # kg
    area = 0.05  # m² (roughly 25cm diameter sphere)

    distance_with_drag = projectile_distance(speed, angle, mass, area)

    # Compare with vacuum calculation
    angle_rad = math.radians(angle)
    distance_vacuum = speed**2 * math.sin(2 * angle_rad) / 9.81

    print(f"Distance with air resistance: {distance_with_drag:.1f} m")
    print(f"Distance in vacuum: {distance_vacuum:.1f} m")
    print(
        f"Reduction due to air resistance: {(1 - distance_with_drag / distance_vacuum) * 100:.1f}%"
    )
