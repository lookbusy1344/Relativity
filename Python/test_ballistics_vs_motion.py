import unittest
import math
import ballistics_lib as bl
import motion_lib as ml


class TestBallisticsVsMotion(unittest.TestCase):
    """
    Test to compare overlapping functions between ballistics_lib and motion_lib
    to identify any inconsistencies in their results.
    """

    def setUp(self):
        self.tolerance = 0.05  # 5% tolerance for comparisons

        # Standard test parameters
        self.speed = 100  # m/s
        self.angle = 45  # degrees
        self.mass = 5  # kg
        self.area = 0.05  # m²
        self.drag_coeff = 0.47  # sphere
        self.air_density = 1.225  # kg/m³
        self.gravity = 9.81  # m/s²

    def test_projectile_distance_consistency_ballistics_methods(self):
        """Test that the three projectile_distance methods in ballistics_lib give consistent results."""

        distance1 = bl.projectile_distance1(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            self.drag_coeff,
            self.air_density,
            self.gravity,
        )

        distance2 = bl.projectile_distance2(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            self.drag_coeff,
            self.air_density,
            self.gravity,
        )

        distance3 = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            self.drag_coeff,
            self.air_density,
            self.gravity,
        )

        # Compare distance1 vs distance2
        relative_diff_1_2 = abs(distance1 - distance2) / max(distance1, distance2)
        self.assertLess(
            relative_diff_1_2,
            self.tolerance,
            f"projectile_distance1 and distance2 differ by {relative_diff_1_2:.3%}: "
            f"{distance1:.1f}m vs {distance2:.1f}m",
        )

        # Compare distance2 vs distance3
        relative_diff_2_3 = abs(distance2 - distance3) / max(distance2, distance3)
        self.assertLess(
            relative_diff_2_3,
            self.tolerance,
            f"projectile_distance2 and distance3 differ by {relative_diff_2_3:.3%}: "
            f"{distance2:.1f}m vs {distance3:.1f}m",
        )

        print(
            f"Ballistics lib distances - Method 1: {distance1:.1f}m, Method 2: {distance2:.1f}m, Method 3: {distance3:.1f}m"
        )

    def test_ballistics_vs_motion_projectile_distance(self):
        """
        Compare projectile distance calculations between ballistics_lib and motion_lib.

        ballistics_lib returns distance directly.
        motion_lib ballistic_trajectory_with_drag simulates to a target distance.
        We'll use motion_lib to simulate and see how close it gets to the theoretical distance.
        """

        # Get distance from ballistics_lib
        bl_distance = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            self.drag_coeff,
            self.air_density,
            self.gravity,
        )

        # Use motion_lib to simulate trajectory to that distance
        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            distance=bl_distance,
            launch_angle_deg=self.angle,
            initial_speed=self.speed,
            obj_mass=self.mass,
            obj_area_m2=self.area,
            obj_drag_coefficient=self.drag_coeff,
            initial_height=0.0,
        )

        # Both libraries should give similar trajectory characteristics
        # We can't directly compare distances, but we can verify physics consistency

        # Check that flight time is reasonable (ballistic formula gives rough estimate)
        theoretical_time = (
            2 * self.speed * math.sin(math.radians(self.angle)) / self.gravity
        )
        self.assertLess(
            flight_time,
            theoretical_time * 1.2,
            f"Motion lib flight time {flight_time:.1f}s seems too long vs theoretical {theoretical_time:.1f}s",
        )
        self.assertGreater(
            flight_time,
            theoretical_time * 0.5,
            f"Motion lib flight time {flight_time:.1f}s seems too short vs theoretical {theoretical_time:.1f}s",
        )

        print(f"Ballistics distance: {bl_distance:.1f}m")
        print(
            f"Motion lib trajectory - Max alt: {max_alt:.1f}m, Flight time: {flight_time:.1f}s, Impact vel: {impact_vel:.1f}m/s"
        )

    def test_vacuum_case_comparison(self):
        """
        Test both libraries in near-vacuum conditions and compare to analytical solution.
        """

        # Use very small drag coefficients to approximate vacuum
        low_drag = 0.001
        small_area = 0.001

        # Ballistics lib - use projectile_distance3 as it's the most advanced
        bl_distance = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            small_area,
            low_drag,
            self.air_density,
            self.gravity,
        )

        # Analytical vacuum solution
        vacuum_distance = (
            self.speed**2 * math.sin(math.radians(2 * self.angle)) / self.gravity
        )

        # Motion lib trajectory
        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            distance=vacuum_distance,  # Use theoretical distance as target
            launch_angle_deg=self.angle,
            initial_speed=self.speed,
            obj_mass=self.mass,
            obj_area_m2=small_area,
            obj_drag_coefficient=low_drag,
            initial_height=0.0,
        )

        # Both should be close to vacuum solution
        bl_relative_error = abs(bl_distance - vacuum_distance) / vacuum_distance
        self.assertLess(
            bl_relative_error,
            0.1,
            f"Ballistics lib vacuum case error: {bl_relative_error:.3%}",
        )

        print(f"Vacuum comparison:")
        print(f"  Analytical: {vacuum_distance:.1f}m")
        print(f"  Ballistics lib: {bl_distance:.1f}m (error: {bl_relative_error:.2%})")
        print(
            f"  Motion lib trajectory to target: max_alt={max_alt:.1f}m, time={flight_time:.1f}s"
        )

    def test_different_angles_consistency(self):
        """Test that both libraries show consistent behavior across different launch angles."""

        angles = [15, 30, 45, 60, 75]
        bl_distances = []
        ml_max_alts = []

        for angle in angles:
            # Ballistics lib distance
            bl_dist = bl.projectile_distance3(
                self.speed,
                angle,
                self.mass,
                self.area,
                self.drag_coeff,
                self.air_density,
                self.gravity,
            )
            bl_distances.append(bl_dist)

            # Motion lib trajectory characteristics
            max_alt, _, _ = ml.ballistic_trajectory_with_drag(
                distance=bl_dist,
                launch_angle_deg=angle,
                initial_speed=self.speed,
                obj_mass=self.mass,
                obj_area_m2=self.area,
                obj_drag_coefficient=self.drag_coeff,
                initial_height=0.0,
            )
            ml_max_alts.append(max_alt)

        # Check that 45 degrees gives maximum or near-maximum range (with drag, optimal is usually less)
        max_bl_distance = max(bl_distances)
        bl_45_index = angles.index(45)
        bl_45_distance = bl_distances[bl_45_index]

        # With drag, optimal angle is typically 35-40 degrees, so 45 degrees should be close to optimal
        self.assertGreater(
            bl_45_distance / max_bl_distance,
            0.9,
            f"45-degree trajectory should be close to optimal range",
        )

        # Check that maximum altitude increases with angle (basic physics)
        for i in range(1, len(angles)):
            if angles[i] <= 60:  # Up to reasonable angles
                self.assertGreater(
                    ml_max_alts[i],
                    ml_max_alts[i - 1],
                    f"Max altitude should increase with angle: {angles[i]}° vs {angles[i - 1]}°",
                )

        print(
            f"Angle comparison (distances): {list(zip(angles, [f'{d:.0f}m' for d in bl_distances]))}"
        )
        print(
            f"Angle comparison (max alts): {list(zip(angles, [f'{h:.0f}m' for h in ml_max_alts]))}"
        )

    def test_mass_effect_consistency(self):
        """Test that both libraries show consistent mass effects on trajectories."""

        masses = [1, 5, 10, 20]  # kg
        bl_distances = []
        ml_flight_times = []

        for mass in masses:
            # Ballistics lib
            bl_dist = bl.projectile_distance3(
                self.speed,
                self.angle,
                mass,
                self.area,
                self.drag_coeff,
                self.air_density,
                self.gravity,
            )
            bl_distances.append(bl_dist)

            # Motion lib
            _, flight_time, _ = ml.ballistic_trajectory_with_drag(
                distance=bl_dist,
                launch_angle_deg=self.angle,
                initial_speed=self.speed,
                obj_mass=mass,
                obj_area_m2=self.area,
                obj_drag_coefficient=self.drag_coeff,
                initial_height=0.0,
            )
            ml_flight_times.append(flight_time)

        # Heavier objects should travel farther (less affected by drag)
        for i in range(1, len(masses)):
            self.assertGreaterEqual(
                bl_distances[i],
                bl_distances[i - 1],
                f"Heavier object should travel farther or equal: {masses[i]}kg vs {masses[i - 1]}kg",
            )

            self.assertGreaterEqual(
                ml_flight_times[i],
                ml_flight_times[i - 1],
                f"Heavier object should have longer or equal flight time: {masses[i]}kg vs {masses[i - 1]}kg",
            )

        print(
            f"Mass effect on distance: {list(zip(masses, [f'{d:.0f}m' for d in bl_distances]))}"
        )
        print(
            f"Mass effect on flight time: {list(zip(masses, [f'{t:.1f}s' for t in ml_flight_times]))}"
        )

    def test_drag_coefficient_effect_consistency(self):
        """Test that both libraries show consistent drag coefficient effects."""

        drag_coeffs = [0.1, 0.47, 1.0, 1.5]  # Low to high drag
        bl_distances = []
        ml_impact_vels = []

        for cd in drag_coeffs:
            # Ballistics lib
            bl_dist = bl.projectile_distance3(
                self.speed,
                self.angle,
                self.mass,
                self.area,
                cd,
                self.air_density,
                self.gravity,
            )
            bl_distances.append(bl_dist)

            # Motion lib
            _, _, impact_vel = ml.ballistic_trajectory_with_drag(
                distance=bl_dist,
                launch_angle_deg=self.angle,
                initial_speed=self.speed,
                obj_mass=self.mass,
                obj_area_m2=self.area,
                obj_drag_coefficient=cd,
                initial_height=0.0,
            )
            ml_impact_vels.append(impact_vel)

        # Higher drag should result in shorter distances and lower impact velocities
        for i in range(1, len(drag_coeffs)):
            self.assertLessEqual(
                bl_distances[i],
                bl_distances[i - 1],
                f"Higher drag should reduce or maintain distance: Cd={drag_coeffs[i]} vs {drag_coeffs[i - 1]}",
            )

            self.assertLessEqual(
                ml_impact_vels[i],
                ml_impact_vels[i - 1],
                f"Higher drag should reduce or maintain impact velocity: Cd={drag_coeffs[i]} vs {drag_coeffs[i - 1]}",
            )

        print(
            f"Drag effect on distance: {list(zip(drag_coeffs, [f'{d:.0f}m' for d in bl_distances]))}"
        )
        print(
            f"Drag effect on impact velocity: {list(zip(drag_coeffs, [f'{v:.1f}m/s' for v in ml_impact_vels]))}"
        )

    def test_trajectory_return_feature(self):
        """Test the trajectory return feature of ballistics_lib projectile_distance3."""

        # Get full trajectory data
        result = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            self.drag_coeff,
            self.air_density,
            self.gravity,
            return_trajectory=True,
            n_points=100,
        )

        self.assertIsInstance(
            result, dict, "Should return dictionary when return_trajectory=True"
        )

        required_keys = ["distance", "t", "x", "y", "vx", "vy", "speed"]
        for key in required_keys:
            self.assertIn(key, result, f"Missing key: {key}")

        # Verify trajectory physics
        self.assertEqual(
            len(result["t"]), 100, "Should have requested number of points"
        )
        self.assertAlmostEqual(result["x"][0], 0, places=1, msg="Should start at x=0")
        self.assertAlmostEqual(result["y"][0], 0, places=1, msg="Should start at y=0")
        self.assertAlmostEqual(
            result["y"][-1], 0, places=1, msg="Should end at ground level"
        )

        # Check that trajectory reaches a maximum height
        max_height = max(result["y"])
        self.assertGreater(max_height, 10, "Should reach reasonable height")

        # Verify energy decreases due to drag (speed should generally decrease)
        initial_speed = result["speed"][0]
        final_speed = result["speed"][-1]
        self.assertLess(final_speed, initial_speed, "Speed should decrease due to drag")

        print(
            f"Trajectory data - Distance: {result['distance']:.1f}m, Max height: {max_height:.1f}m"
        )
        print(
            f"Initial speed: {initial_speed:.1f}m/s, Final speed: {final_speed:.1f}m/s"
        )

    def test_comprehensive_mass_range(self):
        """Test with comprehensive range of masses from very light to very heavy objects."""

        # Comprehensive mass range: from bullet to cannonball to boulder
        masses = [0.01, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 500]  # kg
        bl_distances = []
        ml_flight_times = []
        ml_max_alts = []

        print(f"\nComprehensive Mass Testing:")
        print(
            f"{'Mass (kg)':<10} {'BL Dist (m)':<12} {'ML Time (s)':<12} {'ML Alt (m)':<12}"
        )
        print("-" * 50)

        for mass in masses:
            try:
                # Ballistics lib
                bl_dist = bl.projectile_distance3(
                    self.speed,
                    self.angle,
                    mass,
                    self.area,
                    self.drag_coeff,
                    self.air_density,
                    self.gravity,
                )
                bl_distances.append(bl_dist)

                # Motion lib
                max_alt, flight_time, _ = ml.ballistic_trajectory_with_drag(
                    distance=bl_dist,
                    launch_angle_deg=self.angle,
                    initial_speed=self.speed,
                    obj_mass=mass,
                    obj_area_m2=self.area,
                    obj_drag_coefficient=self.drag_coeff,
                    initial_height=0.0,
                )
                ml_flight_times.append(flight_time)
                ml_max_alts.append(max_alt)

                print(
                    f"{mass:<10.2f} {bl_dist:<12.1f} {flight_time:<12.1f} {max_alt:<12.1f}"
                )

            except Exception as e:
                print(f"Mass {mass}kg failed: {e}")
                bl_distances.append(None)
                ml_flight_times.append(None)
                ml_max_alts.append(None)

        # Verify general trend: heavier objects should generally travel farther
        valid_indices = [i for i, d in enumerate(bl_distances) if d is not None]
        for i in range(1, len(valid_indices)):
            idx_prev = valid_indices[i - 1]
            idx_curr = valid_indices[i]
            if (
                masses[idx_curr] > masses[idx_prev] * 2
            ):  # Only check significant mass increases
                self.assertGreaterEqual(
                    bl_distances[idx_curr],
                    bl_distances[idx_prev] * 0.9,
                    f"Heavier object should travel similar or farther: {masses[idx_curr]}kg vs {masses[idx_prev]}kg",
                )

    def test_comprehensive_angle_range(self):
        """Test with comprehensive range of launch angles."""

        # Comprehensive angle range from low to high
        angles = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
        bl_distances = []
        ml_max_alts = []
        ml_flight_times = []

        print(f"\nComprehensive Angle Testing:")
        print(
            f"{'Angle (°)':<10} {'BL Dist (m)':<12} {'ML Alt (m)':<12} {'ML Time (s)':<12}"
        )
        print("-" * 50)

        for angle in angles:
            try:
                # Ballistics lib
                bl_dist = bl.projectile_distance3(
                    self.speed,
                    angle,
                    self.mass,
                    self.area,
                    self.drag_coeff,
                    self.air_density,
                    self.gravity,
                )
                bl_distances.append(bl_dist)

                # Motion lib
                max_alt, flight_time, _ = ml.ballistic_trajectory_with_drag(
                    distance=bl_dist,
                    launch_angle_deg=angle,
                    initial_speed=self.speed,
                    obj_mass=self.mass,
                    obj_area_m2=self.area,
                    obj_drag_coefficient=self.drag_coeff,
                    initial_height=0.0,
                )
                ml_max_alts.append(max_alt)
                ml_flight_times.append(flight_time)

                print(
                    f"{angle:<10} {bl_dist:<12.1f} {max_alt:<12.1f} {flight_time:<12.1f}"
                )

            except Exception as e:
                print(f"Angle {angle}° failed: {e}")
                bl_distances.append(None)
                ml_max_alts.append(None)
                ml_flight_times.append(None)

        # Find optimal angle for maximum range
        max_distance = max(d for d in bl_distances if d is not None)
        optimal_angle_idx = bl_distances.index(max_distance)
        optimal_angle = angles[optimal_angle_idx]

        print(
            f"Optimal angle for max range: {optimal_angle}° with distance {max_distance:.1f}m"
        )

        # With drag, optimal angle should be less than 45°
        self.assertLess(
            optimal_angle, 45, "Optimal angle with drag should be less than 45°"
        )

        # Verify altitude increases with angle (up to ~60°)
        for i in range(1, len(angles)):
            if (
                angles[i] <= 60
                and ml_max_alts[i] is not None
                and ml_max_alts[i - 1] is not None
            ):
                self.assertGreater(
                    ml_max_alts[i],
                    ml_max_alts[i - 1],
                    f"Max altitude should increase with angle up to 60°: {angles[i]}° vs {angles[i - 1]}°",
                )

    def test_different_shapes_ballistics_lib(self):
        """Test different predefined shapes in ballistics_lib and compare with motion_lib."""

        # Test different shapes available in ballistics_lib
        shapes_to_test = [
            ("sphere", 0.47),
            ("human_standing", 1.2),
            ("human_prone", 0.7),
            ("streamlined", 0.04),
            ("flat_plate", 1.28),
            ("cube", 1.05),
            ("disk", 1.17),
            ("parachute", 1.3),
        ]

        print(f"\nShape Comparison Testing:")
        print(f"{'Shape':<15} {'Cd':<6} {'BL Dist (m)':<12} {'ML Impact V (m/s)':<15}")
        print("-" * 60)

        for shape_name, expected_cd in shapes_to_test:
            try:
                # Ballistics lib with shape
                bl_dist = bl.projectile_distance3(
                    self.speed,
                    self.angle,
                    self.mass,
                    self.area,
                    shape=shape_name,
                    air_density=self.air_density,
                    gravity=self.gravity,
                )

                # Motion lib with equivalent drag coefficient
                _, _, impact_vel = ml.ballistic_trajectory_with_drag(
                    distance=bl_dist,
                    launch_angle_deg=self.angle,
                    initial_speed=self.speed,
                    obj_mass=self.mass,
                    obj_area_m2=self.area,
                    obj_drag_coefficient=expected_cd,
                    initial_height=0.0,
                )

                print(
                    f"{shape_name:<15} {expected_cd:<6.2f} {bl_dist:<12.1f} {impact_vel:<15.1f}"
                )

                # Verify reasonable ranges
                self.assertGreater(
                    bl_dist, 10, f"Distance should be reasonable for {shape_name}"
                )
                self.assertLess(
                    bl_dist, 2000, f"Distance should not be excessive for {shape_name}"
                )

            except Exception as e:
                print(f"Shape {shape_name} failed: {e}")

        # Test that streamlined shapes travel farther than blunt shapes
        streamlined_dist = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            shape="streamlined",
            air_density=self.air_density,
            gravity=self.gravity,
        )

        flat_plate_dist = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            shape="flat_plate",
            air_density=self.air_density,
            gravity=self.gravity,
        )

        self.assertGreater(
            streamlined_dist,
            flat_plate_dist,
            "Streamlined shapes should travel farther than flat plates",
        )

    def test_extreme_parameter_combinations(self):
        """Test extreme combinations of parameters to find edge cases."""

        extreme_cases = [
            ("Very light + high drag", 0.01, 2.0, 0.1),  # mass, cd, area
            ("Very heavy + low drag", 1000, 0.01, 0.001),
            ("Normal mass + extreme drag", 5, 3.0, 0.5),
            ("Tiny projectile", 0.001, 0.47, 0.0001),
            ("Massive projectile", 10000, 0.47, 10.0),
        ]

        print(f"\nExtreme Parameter Testing:")
        print(
            f"{'Case':<25} {'Mass':<8} {'Cd':<6} {'Area':<8} {'BL Dist':<10} {'Status':<10}"
        )
        print("-" * 75)

        for case_name, mass, cd, area in extreme_cases:
            try:
                # Test with ballistics lib
                bl_dist = bl.projectile_distance3(
                    self.speed,
                    self.angle,
                    mass,
                    area,
                    cd,
                    self.air_density,
                    self.gravity,
                )

                # Test with motion lib
                max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
                    distance=min(bl_dist, 50000),  # Cap distance for motion lib
                    launch_angle_deg=self.angle,
                    initial_speed=self.speed,
                    obj_mass=mass,
                    obj_area_m2=area,
                    obj_drag_coefficient=cd,
                    initial_height=0.0,
                )

                status = "PASS"
                print(
                    f"{case_name:<25} {mass:<8.3f} {cd:<6.2f} {area:<8.4f} {bl_dist:<10.1f} {status:<10}"
                )

                # Basic sanity checks
                self.assertGreater(
                    bl_dist, 0, f"Distance should be positive for {case_name}"
                )
                self.assertLess(
                    bl_dist, 1e6, f"Distance should be reasonable for {case_name}"
                )

            except Exception as e:
                status = f"FAIL: {str(e)[:20]}"
                print(
                    f"{case_name:<25} {mass:<8.3f} {cd:<6.2f} {area:<8.4f} {'N/A':<10} {status:<10}"
                )

    def test_parameter_matrix_consistency(self):
        """Test combinations of parameters in a matrix to find inconsistencies."""

        # Parameter matrices
        speeds = [50, 100, 200]  # m/s
        angles = [30, 45, 60]  # degrees
        masses = [1, 5, 20]  # kg

        inconsistencies = []

        print(f"\nParameter Matrix Testing:")
        print("Testing all combinations of speeds, angles, and masses...")

        total_tests = len(speeds) * len(angles) * len(masses)
        test_count = 0

        for speed in speeds:
            for angle in angles:
                for mass in masses:
                    test_count += 1
                    try:
                        # Test with both libraries
                        bl_dist = bl.projectile_distance3(
                            speed,
                            angle,
                            mass,
                            self.area,
                            self.drag_coeff,
                            self.air_density,
                            self.gravity,
                        )

                        # Check if motion_lib can handle this trajectory
                        max_alt, flight_time, impact_vel = (
                            ml.ballistic_trajectory_with_drag(
                                distance=min(bl_dist, 20000),  # Cap for stability
                                launch_angle_deg=angle,
                                initial_speed=speed,
                                obj_mass=mass,
                                obj_area_m2=self.area,
                                obj_drag_coefficient=self.drag_coeff,
                                initial_height=0.0,
                            )
                        )

                        # Physics consistency checks
                        theoretical_time = (
                            2 * speed * math.sin(math.radians(angle)) / self.gravity
                        )

                        if flight_time > theoretical_time * 2:
                            inconsistencies.append(
                                f"Speed={speed}, Angle={angle}, Mass={mass}: "
                                f"Flight time too long ({flight_time:.1f}s vs theoretical {theoretical_time:.1f}s)"
                            )

                        if (
                            impact_vel > speed * 1.1
                        ):  # Should not exceed initial speed by much
                            inconsistencies.append(
                                f"Speed={speed}, Angle={angle}, Mass={mass}: "
                                f"Impact velocity too high ({impact_vel:.1f} vs initial {speed})"
                            )

                    except Exception as e:
                        inconsistencies.append(
                            f"Speed={speed}, Angle={angle}, Mass={mass}: Exception {str(e)[:50]}"
                        )

        print(f"Completed {test_count}/{total_tests} parameter combinations")

        if inconsistencies:
            print(f"Found {len(inconsistencies)} inconsistencies:")
            for inc in inconsistencies[:10]:  # Show first 10
                print(f"  - {inc}")
            if len(inconsistencies) > 10:
                print(f"  ... and {len(inconsistencies) - 10} more")
        else:
            print("No significant inconsistencies found!")

        # Allow some inconsistencies for extreme cases, but not too many
        self.assertLess(
            len(inconsistencies),
            total_tests * 0.1,
            f"Too many inconsistencies found: {len(inconsistencies)}/{total_tests}",
        )

    def test_altitude_model_comparison(self):
        """Test ballistics_lib altitude model vs motion_lib atmospheric density."""

        print(f"\nAltitude Model Comparison:")

        # Test with and without altitude model
        bl_dist_no_alt = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            self.drag_coeff,
            self.air_density,
            self.gravity,
            altitude_model=False,
        )

        bl_dist_with_alt = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            self.drag_coeff,
            self.air_density,
            self.gravity,
            altitude_model=True,
        )

        # Motion lib uses altitude-dependent density by default
        max_alt, flight_time, impact_vel = ml.ballistic_trajectory_with_drag(
            distance=bl_dist_with_alt,
            launch_angle_deg=self.angle,
            initial_speed=self.speed,
            obj_mass=self.mass,
            obj_area_m2=self.area,
            obj_drag_coefficient=self.drag_coeff,
            initial_height=0.0,
        )

        print(f"BL without altitude model: {bl_dist_no_alt:.1f}m")
        print(f"BL with altitude model: {bl_dist_with_alt:.1f}m")
        print(f"ML trajectory max altitude: {max_alt:.1f}m")

        # With altitude model, projectile should travel farther (less dense air at altitude)
        self.assertGreaterEqual(
            bl_dist_with_alt,
            bl_dist_no_alt,
            "Altitude model should increase or maintain range due to thinner air at height",
        )

        # Difference should be reasonable (not extreme)
        relative_diff = abs(bl_dist_with_alt - bl_dist_no_alt) / bl_dist_no_alt
        self.assertLess(
            relative_diff,
            0.2,
            f"Altitude model effect should be reasonable: {relative_diff:.3%}",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
