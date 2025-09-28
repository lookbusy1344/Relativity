import unittest
import math
import motion_lib as ml


class TestMotionLib(unittest.TestCase):
    def setUp(self):
        self.earth_g = 9.80665
        self.tolerance = 0.001

    def test_gravity_acceleration_for_radius(self):
        calculated_g = ml.gravity_acceleration_for_radius(
            ml.earth_mass, ml.earth_radius
        )
        self.assertAlmostEqual(
            calculated_g,
            self.earth_g,
            places=3,
            msg="Earth surface gravity calculation",
        )

        gravity_at_400km = ml.gravity_acceleration_for_radius(
            ml.earth_mass, ml.earth_radius + 400_000
        )
        expected_400km = (
            self.earth_g * (ml.earth_radius / (ml.earth_radius + 400_000)) ** 2
        )
        self.assertAlmostEqual(
            gravity_at_400km,
            expected_400km,
            places=4,
            msg="Gravity at ISS altitude (400km)",
        )

    def test_atmospheric_density(self):
        sea_level_density = ml.atmospheric_density(0)
        self.assertAlmostEqual(
            sea_level_density, 1.225, places=3, msg="Sea level atmospheric density"
        )

        high_altitude_density = ml.atmospheric_density(8500)
        expected_8500m = 1.225 * math.exp(-1)
        self.assertAlmostEqual(
            high_altitude_density,
            expected_8500m,
            places=3,
            msg="Density at scale height (8500m)",
        )

        space_density = ml.atmospheric_density(100_000)
        self.assertLess(
            space_density, 0.001, msg="Near-vacuum density at 100km altitude"
        )

    def test_fall_time_from_altitude_low_height(self):
        h = 1000
        fall_time = ml.fall_time_from_altitude(ml.earth_mass, ml.earth_radius, h)
        expected_time = math.sqrt(2 * h / self.earth_g)
        relative_error = abs(fall_time - expected_time) / expected_time
        self.assertLess(
            relative_error,
            0.01,
            msg="Fall time from 1km should be close to constant gravity approximation",
        )

    def test_fall_time_and_velocity_basic(self):
        h = 100
        time, velocity = ml.fall_time_and_velocity(ml.earth_mass, ml.earth_radius, h)

        expected_time = math.sqrt(2 * h / self.earth_g)
        expected_velocity = math.sqrt(2 * self.earth_g * h)

        self.assertAlmostEqual(time, expected_time, places=1, msg="Fall time from 100m")
        self.assertAlmostEqual(
            velocity, expected_velocity, places=1, msg="Impact velocity from 100m"
        )

    def test_fall_time_with_drag_terminal_velocity(self):
        large_height = 10000
        mass = 70
        area = 0.7
        cd = 1.2

        time, velocity = ml.fall_time_with_drag(large_height, mass, area, cd)

        terminal_velocity = math.sqrt(2 * mass * self.earth_g / (1.225 * cd * area))
        self.assertLess(
            velocity,
            terminal_velocity * 1.1,
            msg="Impact velocity should not significantly exceed terminal velocity",
        )
        self.assertGreater(
            velocity,
            terminal_velocity * 0.8,
            msg="Impact velocity should approach terminal velocity",
        )

    def test_ballistic_trajectory_vacuum_vs_theory(self):
        distance = 1000
        angle = 45
        speed = 100
        mass = 1
        area = 0.001
        cd = 0.01

        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            distance, angle, speed, mass, area, cd, 0.0
        )

        theoretical_range = speed**2 * math.sin(math.radians(2 * angle)) / self.earth_g
        self.assertAlmostEqual(
            distance,
            theoretical_range,
            delta=100,
            msg="45-degree trajectory should be close to theoretical range",
        )

    def test_ballistic_trajectory_known_cases(self):
        angle = 30
        speed = 50
        mass = 0.145
        area = 0.004
        cd = 0.47

        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            100, angle, speed, mass, area, cd, 0.0
        )

        theoretical_max_height = (speed * math.sin(math.radians(angle))) ** 2 / (
            2 * self.earth_g
        )
        self.assertLess(
            max_alt,
            theoretical_max_height,
            msg="Max altitude with drag should be less than theoretical",
        )
        self.assertGreater(
            max_alt,
            theoretical_max_height * 0.6,
            msg="Max altitude should be reasonably close to theoretical",
        )

    def test_ballistic_trajectory_projectile_motion_baseball(self):
        initial_speed = 44.7
        angle = 35
        mass = 0.145
        area = 0.004185
        cd = 0.47

        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            120, angle, initial_speed, mass, area, cd, 0.0
        )

        self.assertGreater(
            max_alt, 15, msg="Baseball trajectory should reach reasonable height"
        )
        self.assertLess(
            max_alt, 40, msg="Baseball trajectory height should be realistic"
        )
        self.assertGreater(
            flight_time, 3, msg="Baseball flight time should be reasonable"
        )
        self.assertLess(flight_time, 8, msg="Baseball flight time should be realistic")

    def test_ballistic_trajectory_cannonball(self):
        initial_speed = 300
        angle = 45
        mass = 6
        area = 0.05
        cd = 0.47
        distance = 5000

        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            distance, angle, initial_speed, mass, area, cd, 0.0
        )

        self.assertGreater(
            max_alt, 300, msg="Cannonball should reach significant altitude"
        )
        self.assertLess(max_alt, 1500, msg="Cannonball altitude should be realistic")
        self.assertGreater(
            flight_time, 15, msg="Cannonball flight time should be substantial"
        )

    def test_ballistic_trajectory_different_masses(self):
        angle = 45
        speed = 100
        area = 0.01
        cd = 0.5
        distance = 800

        light_mass = 0.1
        heavy_mass = 10.0

        light_max_alt, light_time, light_vel = ml.ballistic_trajectory_with_drag(
            distance, angle, speed, light_mass, area, cd, 0.0
        )

        heavy_max_alt, heavy_time, heavy_vel = ml.ballistic_trajectory_with_drag(
            distance, angle, speed, heavy_mass, area, cd, 0.0
        )

        self.assertGreater(
            heavy_max_alt,
            light_max_alt,
            msg="Heavier object should reach higher altitude (less drag effect)",
        )
        self.assertGreater(
            heavy_time, light_time, msg="Heavier object should have longer flight time"
        )

    def test_ballistic_trajectory_different_drag_coefficients(self):
        angle = 45
        speed = 100
        mass = 1
        area = 0.01
        distance = 800

        low_cd = 0.1
        high_cd = 1.5

        low_drag_max_alt, low_drag_time, low_drag_vel = (
            ml.ballistic_trajectory_with_drag(
                distance, angle, speed, mass, area, low_cd, 0.0
            )
        )

        high_drag_max_alt, high_drag_time, high_drag_vel = (
            ml.ballistic_trajectory_with_drag(
                distance, angle, speed, mass, area, high_cd, 0.0
            )
        )

        self.assertGreater(
            low_drag_max_alt,
            high_drag_max_alt,
            msg="Lower drag coefficient should result in higher altitude",
        )
        self.assertGreater(
            low_drag_time,
            high_drag_time,
            msg="Lower drag coefficient should result in longer flight time",
        )

    def test_find_minimum_initial_speed_reasonable_results(self):
        distance = 1000
        mass = 1
        area = 0.01
        cd = 0.5

        speed, angle = ml.find_minimum_initial_speed_and_angle(
            distance, mass, area, cd, 0.0
        )

        self.assertGreater(
            speed, 50, msg="Minimum speed should be reasonable for 1km range"
        )
        self.assertLess(speed, 500, msg="Minimum speed should not be excessive")
        self.assertGreater(angle, 20, msg="Launch angle should be above 20 degrees")
        self.assertLess(
            angle, 45, msg="Launch angle should be below 45 degrees with drag"
        )

    def test_relativistic_fall_time_small_height(self):
        h = 100
        tau, coord_time, velocity = ml.relativistic_fall_time_and_velocity(
            ml.earth_mass, ml.earth_radius, h
        )

        classical_time, classical_velocity = ml.fall_time_and_velocity(
            ml.earth_mass, ml.earth_radius, h
        )

        relative_time_diff = abs(tau - classical_time) / classical_time
        relative_vel_diff = abs(velocity - classical_velocity) / classical_velocity

        self.assertLess(
            relative_time_diff,
            0.001,
            msg="Relativistic effects should be negligible for 100m fall",
        )
        self.assertLess(
            relative_vel_diff,
            0.001,
            msg="Relativistic velocity should be close to classical for 100m fall",
        )

    def test_atmospheric_density_exponential_decay(self):
        h1 = 5000
        h2 = 10000

        rho1 = ml.atmospheric_density(h1)
        rho2 = ml.atmospheric_density(h2)

        expected_ratio = math.exp(-(h2 - h1) / 8500)
        actual_ratio = rho2 / rho1

        self.assertAlmostEqual(
            actual_ratio,
            expected_ratio,
            places=3,
            msg="Atmospheric density should follow exponential decay",
        )

    def test_gravity_inverse_square_law(self):
        r1 = ml.earth_radius
        r2 = ml.earth_radius * 2

        g1 = ml.gravity_acceleration_for_radius(ml.earth_mass, r1)
        g2 = ml.gravity_acceleration_for_radius(ml.earth_mass, r2)

        expected_ratio = (r2 / r1) ** 2
        actual_ratio = g1 / g2

        self.assertAlmostEqual(
            actual_ratio,
            expected_ratio,
            places=6,
            msg="Gravity should follow inverse square law",
        )

    def test_ballistic_trajectory_energy_conservation_vacuum(self):
        speed = 100
        angle = 60
        mass = 1
        area = 0.00001
        cd = 0.01

        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            500, angle, speed, mass, area, cd, 0.0
        )

        initial_ke = 0.5 * mass * speed**2
        final_ke = 0.5 * mass * impact_vel**2
        potential_energy_gained = mass * self.earth_g * max_alt

        energy_difference = abs(initial_ke - (final_ke + potential_energy_gained))
        relative_error = energy_difference / initial_ke

        self.assertLess(
            relative_error,
            0.1,
            msg="Energy should be approximately conserved in low-drag case",
        )


if __name__ == "__main__":
    unittest.main()
