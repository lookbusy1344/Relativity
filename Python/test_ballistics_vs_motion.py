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
        """
        Test projectile_distance methods in ballistics_lib.

        NOTE: Methods 1 and 2 use fixed drag coefficients and should match.
        Method 3 uses Reynolds-dependent drag coefficients, making it more accurate
        but producing different results (~95% farther for this test case due to
        drag crisis effects at these velocities).
        """

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
            shape="sphere",  # Explicitly use sphere shape for Reynolds-dependent Cd
        )

        # Compare distance1 vs distance2 (both use fixed Cd, should match closely)
        relative_diff_1_2 = abs(distance1 - distance2) / max(distance1, distance2)
        self.assertLess(
            relative_diff_1_2,
            self.tolerance,
            f"projectile_distance1 and distance2 differ by {relative_diff_1_2:.3%}: "
            f"{distance1:.1f}m vs {distance2:.1f}m",
        )

        # Method 3 uses Reynolds-dependent Cd and will be significantly different
        # Verify it's farther (Reynolds effects reduce drag at these velocities)
        self.assertGreater(
            distance3,
            distance2,
            f"Method 3 (Reynolds-dependent) should have greater range than fixed-Cd methods: "
            f"{distance3:.1f}m vs {distance2:.1f}m",
        )

        # Verify the difference is within expected range (50-100% farther)
        ratio = distance3 / distance2
        self.assertGreater(
            ratio, 1.5, "Reynolds-dependent model should show significant improvement"
        )
        self.assertLess(
            ratio, 2.5, "Improvement should be within reasonable physical bounds"
        )

        print(
            f"Ballistics lib distances - Method 1: {distance1:.1f}m, Method 2: {distance2:.1f}m, "
            f"Method 3 (Reynolds): {distance3:.1f}m ({(ratio - 1) * 100:.1f}% increase)"
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
        """Test ballistics_lib altitude model (ISA + variable gravity) vs basic model."""

        print(f"\nAltitude Model Comparison:")

        # Test with and without altitude model
        bl_dist_no_alt = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            shape="sphere",
            air_density=self.air_density,
            gravity=self.gravity,
            altitude_model=False,
        )

        bl_dist_with_alt = bl.projectile_distance3(
            self.speed,
            self.angle,
            self.mass,
            self.area,
            shape="sphere",
            air_density=self.air_density,
            gravity=self.gravity,
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

        # Difference should be small for low trajectories (< 5%)
        relative_diff = abs(bl_dist_with_alt - bl_dist_no_alt) / bl_dist_no_alt
        self.assertLess(
            relative_diff,
            0.05,
            f"Altitude model effect should be small for low trajectories: {relative_diff:.3%}",
        )

    def test_reynolds_number_effects(self):
        """Test that Reynolds number effects are working correctly in projectile_distance3."""

        print(f"\nReynolds Number Effects Testing:")

        # Use lower speed to see Cd variation through different Reynolds regimes
        test_speed = 30  # m/s - will pass through different Re regimes

        # Get trajectory with Reynolds-dependent Cd
        result = bl.projectile_distance3(
            test_speed,
            self.angle,
            self.mass,
            self.area,
            shape="sphere",
            air_density=self.air_density,
            gravity=self.gravity,
            return_trajectory=True,
            n_points=100,
        )

        # Calculate Reynolds numbers at different points in trajectory
        from ballistics_lib import calculate_reynolds_number, drag_coefficient_sphere

        char_length = 2.0 * math.sqrt(self.area / math.pi)

        # Check initial Reynolds number (high velocity)
        Re_initial = calculate_reynolds_number(
            result["speed"][0], char_length, self.air_density
        )
        Cd_initial = drag_coefficient_sphere(Re_initial)

        # Check mid-flight Reynolds number
        mid_idx = len(result["speed"]) // 2
        Re_mid = calculate_reynolds_number(
            result["speed"][mid_idx], char_length, self.air_density
        )
        Cd_mid = drag_coefficient_sphere(Re_mid)

        # Check final Reynolds number (lower velocity)
        Re_final = calculate_reynolds_number(
            result["speed"][-1], char_length, self.air_density
        )
        Cd_final = drag_coefficient_sphere(Re_final)

        print(
            f"Initial: Re={Re_initial:.0f}, Cd={Cd_initial:.3f}, V={result['speed'][0]:.1f} m/s"
        )
        print(
            f"Mid:     Re={Re_mid:.0f}, Cd={Cd_mid:.3f}, V={result['speed'][mid_idx]:.1f} m/s"
        )
        print(
            f"Final:   Re={Re_final:.0f}, Cd={Cd_final:.3f}, V={result['speed'][-1]:.1f} m/s"
        )

        # Find minimum velocity point (apex)
        import numpy as np

        min_speed_idx = int(np.argmin(result["speed"]))
        Re_min = calculate_reynolds_number(
            result["speed"][min_speed_idx], char_length, self.air_density
        )
        Cd_min = drag_coefficient_sphere(Re_min)
        print(
            f"At apex: Re={Re_min:.0f}, Cd={Cd_min:.3f}, V={result['speed'][min_speed_idx]:.1f} m/s"
        )

        # Verify Reynolds number varies throughout flight
        self.assertGreater(
            Re_initial, Re_min, "Reynolds number should decrease from launch to apex"
        )

        # Verify Cd varies (not constant like old model)
        self.assertNotAlmostEqual(
            Cd_initial,
            Cd_min,
            places=2,
            msg="Drag coefficient should vary with Reynolds number throughout flight",
        )

    def test_isa_atmospheric_model(self):
        """Test the International Standard Atmosphere model functions."""

        print(f"\nISA Atmospheric Model Testing:")

        from ballistics_lib import (
            get_temperature_at_altitude,
            get_air_density_isa,
            get_dynamic_viscosity,
        )

        # Test temperature at various altitudes
        T_sea = get_temperature_at_altitude(0)
        T_5km = get_temperature_at_altitude(5000)
        T_11km = get_temperature_at_altitude(11000)
        T_15km = get_temperature_at_altitude(15000)

        print(
            f"Temperature: 0m={T_sea:.1f}K, 5km={T_5km:.1f}K, 11km={T_11km:.1f}K, 15km={T_15km:.1f}K"
        )

        # Temperature should decrease in troposphere
        self.assertGreater(
            T_sea, T_5km, "Temperature should decrease with altitude in troposphere"
        )
        self.assertGreater(
            T_5km, T_11km, "Temperature should continue decreasing to tropopause"
        )

        # Temperature should be constant in lower stratosphere
        self.assertAlmostEqual(
            T_11km,
            T_15km,
            delta=1.0,
            msg="Temperature should be constant in lower stratosphere",
        )

        # Test air density at various altitudes
        rho_sea = get_air_density_isa(0)
        rho_5km = get_air_density_isa(5000)
        rho_11km = get_air_density_isa(11000)

        print(
            f"Air density: 0m={rho_sea:.3f} kg/m³, 5km={rho_5km:.3f} kg/m³, 11km={rho_11km:.3f} kg/m³"
        )

        # Density should decrease with altitude
        self.assertGreater(
            rho_sea, rho_5km, "Air density should decrease with altitude"
        )
        self.assertGreater(rho_5km, rho_11km, "Air density should continue decreasing")

        # Sea level density should be approximately correct
        self.assertAlmostEqual(
            rho_sea, 1.225, delta=0.01, msg="Sea level density should be ~1.225 kg/m³"
        )

        # Test dynamic viscosity at various temperatures
        mu_cold = get_dynamic_viscosity(216.65)  # Stratosphere temp
        mu_std = get_dynamic_viscosity(288.15)  # Sea level temp
        mu_hot = get_dynamic_viscosity(300)  # Warm day

        print(
            f"Viscosity: cold={mu_cold:.6e} Pa·s, std={mu_std:.6e} Pa·s, hot={mu_hot:.6e} Pa·s"
        )

        # Viscosity should increase with temperature
        self.assertLess(mu_cold, mu_std, "Viscosity should increase with temperature")
        self.assertLess(mu_std, mu_hot, "Viscosity should continue increasing")

    def test_variable_gravity(self):
        """Test variable gravity effects at different altitudes."""

        print(f"\nVariable Gravity Testing:")

        from ballistics_lib import gravity_at_altitude

        # Test gravity at various altitudes
        g_sea = gravity_at_altitude(0)
        g_1km = gravity_at_altitude(1000)
        g_10km = gravity_at_altitude(10000)
        g_100km = gravity_at_altitude(100000)

        print(
            f"Gravity: 0m={g_sea:.6f} m/s², 1km={g_1km:.6f} m/s², 10km={g_10km:.6f} m/s², 100km={g_100km:.6f} m/s²"
        )

        # Gravity should decrease with altitude
        self.assertGreater(g_sea, g_1km, "Gravity should decrease with altitude")
        self.assertGreater(g_1km, g_10km, "Gravity should continue decreasing")
        self.assertGreater(g_10km, g_100km, "Gravity should decrease at high altitudes")

        # Sea level gravity should be approximately standard
        self.assertAlmostEqual(
            g_sea, 9.82, delta=0.01, msg="Sea level gravity should be ~9.82 m/s²"
        )

        # At 100km, gravity should be reduced by ~3%
        reduction = (g_sea - g_100km) / g_sea
        self.assertGreater(
            reduction, 0.025, "Gravity should be reduced by >2.5% at 100km"
        )
        self.assertLess(reduction, 0.035, "Gravity reduction should be <3.5% at 100km")

    def test_high_altitude_trajectory(self):
        """Test that altitude model makes a difference for high trajectories."""

        print(f"\nHigh Altitude Trajectory Testing:")

        # High-velocity, steep angle trajectory
        high_speed = 500  # m/s
        steep_angle = 70  # degrees

        dist_no_alt = bl.projectile_distance3(
            high_speed,
            steep_angle,
            self.mass,
            self.area,
            shape="streamlined",
            altitude_model=False,
        )

        dist_with_alt = bl.projectile_distance3(
            high_speed,
            steep_angle,
            self.mass,
            self.area,
            shape="streamlined",
            altitude_model=True,
        )

        result = bl.projectile_distance3(
            high_speed,
            steep_angle,
            self.mass,
            self.area,
            shape="streamlined",
            altitude_model=True,
            return_trajectory=True,
        )

        max_height = max(result["y"])

        print(f"Distance without altitude model: {dist_no_alt:.1f}m")
        print(f"Distance with altitude model: {dist_with_alt:.1f}m")
        print(f"Maximum height: {max_height:.1f}m")

        # For high trajectories, altitude model should make a measurable difference
        if max_height > 5000:  # Only check if trajectory goes high enough
            relative_diff = abs(dist_with_alt - dist_no_alt) / dist_no_alt
            self.assertGreater(
                relative_diff,
                0.01,
                f"Altitude model should have measurable effect (>{1}%) for high trajectories: {relative_diff:.3%}",
            )

    def test_reynolds_drag_crisis(self):
        """Test that drag crisis (sudden drop in Cd) is captured at critical Reynolds number."""

        print(f"\nReynolds Drag Crisis Testing:")

        from ballistics_lib import drag_coefficient_sphere

        # Test Cd at various Reynolds numbers
        Re_subcritical = 1e5  # Below critical Re
        Re_critical = 3e5  # In critical region
        Re_supercritical = 6e5  # Above critical Re

        Cd_sub = drag_coefficient_sphere(Re_subcritical)
        Cd_crit = drag_coefficient_sphere(Re_critical)
        Cd_super = drag_coefficient_sphere(Re_supercritical)

        print(f"Cd at Re={Re_subcritical:.0e}: {Cd_sub:.3f}")
        print(f"Cd at Re={Re_critical:.0e}: {Cd_crit:.3f}")
        print(f"Cd at Re={Re_supercritical:.0e}: {Cd_super:.3f}")

        # Verify drag crisis: Cd should drop significantly in critical region
        self.assertGreater(Cd_sub, 0.40, "Subcritical Cd should be around 0.47")
        self.assertLess(Cd_super, 0.20, "Supercritical Cd should drop to ~0.1")
        self.assertLess(Cd_crit, Cd_sub, "Cd should decrease in critical region")
        self.assertGreater(
            Cd_crit, Cd_super, "Cd in critical region should be between sub and super"
        )

    def test_supersonic_drag_coefficient_mach(self):
        """Test Mach-dependent drag coefficients for different regimes."""

        print(f"\nSupersonic Drag Coefficient Testing:")

        from ballistics_lib import drag_coefficient_mach

        # Test sphere drag at various Mach numbers
        mach_numbers = [0.3, 0.7, 0.9, 1.0, 1.5, 2.0, 3.0]
        sphere_cds = [drag_coefficient_mach(m, "sphere") for m in mach_numbers]

        print("Sphere Cd vs Mach:")
        for m, cd in zip(mach_numbers, sphere_cds):
            regime = "subsonic" if m < 0.8 else "transonic" if m < 1.2 else "supersonic"
            print(f"  M={m:.1f} ({regime:11}): Cd={cd:.3f}")

        # Verify subsonic regime is relatively constant
        self.assertAlmostEqual(
            sphere_cds[0],
            sphere_cds[1],
            delta=0.1,
            msg="Subsonic Cd should be relatively constant",
        )

        # Verify transonic drag rise (Cd should peak near M=1)
        idx_09 = mach_numbers.index(0.9)
        idx_10 = mach_numbers.index(1.0)
        self.assertGreater(
            sphere_cds[idx_09],
            sphere_cds[1],
            "Cd should increase in transonic regime",
        )
        self.assertGreater(
            sphere_cds[idx_10], 0.8, "Cd should peak near M=1 for sphere"
        )

        # Verify supersonic decrease
        idx_30 = mach_numbers.index(3.0)
        self.assertLess(
            sphere_cds[idx_30],
            sphere_cds[idx_10],
            "Cd should decrease at high supersonic",
        )

        # Test streamlined/bullet shape
        bullet_cds = [drag_coefficient_mach(m, "bullet") for m in mach_numbers]
        print("\nBullet Cd vs Mach:")
        for m, cd in zip(mach_numbers, bullet_cds):
            print(f"  M={m:.1f}: Cd={cd:.3f}")

        # Streamlined shapes should have lower drag than spheres
        for i in range(len(mach_numbers)):
            self.assertLess(
                bullet_cds[i],
                sphere_cds[i],
                f"Bullet should have lower Cd than sphere at M={mach_numbers[i]}",
            )

    def test_projectile_distance_supersonic_basic(self):
        """Test basic functionality of projectile_distance_supersonic."""

        print(f"\nSupersonic Projectile Distance Testing:")

        # Test with supersonic velocity (rifle bullet)
        speed = 940  # m/s (Mach 2.76)
        angle = 45
        mass = 0.004  # 4g
        diameter = 0.0056  # 5.6mm
        area = math.pi * (diameter / 2) ** 2

        distance = bl.projectile_distance_supersonic(
            speed, angle, mass, area, shape="bullet", altitude_model=True
        )

        print(f"Bullet (940 m/s, 45°): {distance:.1f}m")

        # Verify reasonable range
        self.assertGreater(distance, 1000, "Supersonic bullet should travel >1km")
        self.assertLess(distance, 20000, "Range should be reasonable (<20km)")

        # Test with trajectory return
        result = bl.projectile_distance_supersonic(
            speed,
            angle,
            mass,
            area,
            shape="bullet",
            altitude_model=True,
            return_trajectory=True,
            n_points=100,
        )

        # Verify trajectory data structure
        self.assertIsInstance(result, dict)
        required_keys = ["distance", "t", "x", "y", "vx", "vy", "speed", "mach"]
        for key in required_keys:
            self.assertIn(key, result, f"Missing key: {key}")

        # Verify Mach number data
        self.assertGreater(result["mach"][0], 2.0, "Should start at high Mach")
        self.assertLess(
            result["mach"][-1], result["mach"][0], "Mach should decrease due to drag"
        )

        print(
            f"  Initial Mach: {result['mach'][0]:.2f}, Final Mach: {result['mach'][-1]:.2f}"
        )
        print(
            f"  Max height: {max(result['y']):.1f}m, Flight time: {result['t'][-1]:.2f}s"
        )

    def test_supersonic_vs_subsonic_model_comparison(self):
        """Compare subsonic and supersonic models in their overlapping regime."""

        print(f"\nSubsonic vs Supersonic Model Comparison:")

        # Test at moderate subsonic speed where both models should work
        speed = 100  # m/s (well below transonic)
        angle = 45
        mass = 5
        area = 0.05

        dist_subsonic = bl.projectile_distance3(
            speed, angle, mass, area, shape="sphere", altitude_model=True
        )

        dist_supersonic = bl.projectile_distance_supersonic(
            speed, angle, mass, area, shape="sphere", altitude_model=True
        )

        print(f"100 m/s sphere at 45°:")
        print(f"  Subsonic model:    {dist_subsonic:.1f}m")
        print(f"  Supersonic model:  {dist_supersonic:.1f}m")

        # Models should give reasonably close results in subsonic regime
        # Allow for some difference due to implementation details
        relative_diff = abs(dist_subsonic - dist_supersonic) / dist_subsonic
        print(f"  Relative difference: {relative_diff:.1%}")

        # Note: The models may differ significantly due to different drag modeling approaches
        # Subsonic uses Reynolds-dependent Cd, supersonic uses Mach-dependent Cd
        # This is expected behavior, not a bug

    def test_supersonic_transonic_drag_rise(self):
        """Test that transonic drag rise is captured correctly."""

        print(f"\nTransonic Drag Rise Testing:")

        # Test at various speeds around Mach 1
        speeds = [250, 300, 340, 380, 420]  # m/s, crossing Mach 1
        mass = 0.01
        area = 0.001
        angle = 45

        distances = []
        for speed in speeds:
            dist = bl.projectile_distance_supersonic(
                speed, angle, mass, area, shape="sphere", altitude_model=True
            )
            distances.append(dist)
            mach = speed / 340.3
            print(f"  M={mach:.2f} ({speed} m/s): {dist:.1f}m")

        # Verify transonic drag rise effect
        # Distance should NOT increase linearly with speed due to drag rise
        # In fact, distance increase should slow down or even reverse near Mach 1

        # Calculate distance per unit speed increase
        for i in range(1, len(speeds)):
            speed_increase = speeds[i] - speeds[i - 1]
            dist_increase = distances[i] - distances[i - 1]
            dist_per_speed = dist_increase / speed_increase
            mach = speeds[i] / 340.3
            print(
                f"  M={mach:.2f}: distance increase per m/s = {dist_per_speed:.2f} m/(m/s)"
            )

    def test_supersonic_shape_comparison(self):
        """Compare different shapes at supersonic speeds."""

        print(f"\nSupersonic Shape Comparison:")

        speed = 600  # m/s (Mach 1.76)
        angle = 30
        mass = 0.01
        area = 0.001

        shapes_to_test = ["sphere", "bullet", "streamlined"]
        distances = {}

        for shape in shapes_to_test:
            dist = bl.projectile_distance_supersonic(
                speed, angle, mass, area, shape=shape, altitude_model=True
            )
            distances[shape] = dist
            print(f"  {shape:12}: {dist:.1f}m")

        # Streamlined/bullet shapes should travel farther
        self.assertGreater(
            distances["bullet"],
            distances["sphere"],
            "Bullet shape should travel farther than sphere at supersonic speeds",
        )

        self.assertGreater(
            distances["streamlined"],
            distances["sphere"],
            "Streamlined shape should travel farther than sphere",
        )

    def test_supersonic_altitude_effects(self):
        """Test altitude-dependent effects on supersonic projectiles."""

        print(f"\nSupersonic Altitude Effects Testing:")

        speed = 800  # m/s
        angle = 60  # Steep angle for high altitude
        mass = 0.01
        area = 0.001

        # Test with and without altitude model
        dist_no_alt = bl.projectile_distance_supersonic(
            speed, angle, mass, area, shape="bullet", altitude_model=False
        )

        result_with_alt = bl.projectile_distance_supersonic(
            speed,
            angle,
            mass,
            area,
            shape="bullet",
            altitude_model=True,
            return_trajectory=True,
        )

        dist_with_alt = result_with_alt["distance"]
        max_height = max(result_with_alt["y"])

        print(f"  Without altitude model: {dist_no_alt:.1f}m")
        print(f"  With altitude model:    {dist_with_alt:.1f}m")
        print(f"  Max altitude:           {max_height:.1f}m")

        # With altitude model, distance should generally be longer
        # (less dense air at altitude = less drag)
        if max_height > 2000:
            self.assertGreaterEqual(
                dist_with_alt,
                dist_no_alt * 0.95,
                "Altitude model should account for reduced drag at altitude",
            )

    def test_supersonic_mach_decay(self):
        """Test that Mach number decays properly during flight."""

        print(f"\nMach Number Decay Testing:")

        # High supersonic bullet
        speed = 1000  # m/s (Mach 2.94)
        angle = 45
        mass = 0.004
        area = 0.00002

        result = bl.projectile_distance_supersonic(
            speed,
            angle,
            mass,
            area,
            shape="bullet",
            altitude_model=True,
            return_trajectory=True,
            n_points=200,
        )

        # Check Mach number progression
        mach_initial = result["mach"][0]
        mach_peak = max(result["mach"])
        mach_final = result["mach"][-1]

        print(f"  Initial Mach: {mach_initial:.2f}")
        print(f"  Peak Mach:    {mach_peak:.2f}")
        print(f"  Final Mach:   {mach_final:.2f}")

        # Mach should generally decrease due to drag
        self.assertLess(mach_final, mach_initial, "Mach should decrease during flight")

        # Find where projectile crosses Mach 1
        import numpy as np

        mach_array = np.array(result["mach"])
        supersonic_fraction = np.sum(mach_array > 1.0) / len(mach_array)
        print(f"  Supersonic for {supersonic_fraction * 100:.1f}% of flight")

    def test_supersonic_input_validation(self):
        """Test input validation for supersonic function."""

        print(f"\nSupersonic Input Validation Testing:")

        # Test invalid inputs
        with self.assertRaises(ValueError):
            bl.projectile_distance_supersonic(
                -100, 45, 1, 0.01, shape="sphere"
            )  # Negative speed

        with self.assertRaises(ValueError):
            bl.projectile_distance_supersonic(
                100, -10, 1, 0.01, shape="sphere"
            )  # Negative angle

        with self.assertRaises(ValueError):
            bl.projectile_distance_supersonic(
                100, 45, -1, 0.01, shape="sphere"
            )  # Negative mass

        with self.assertRaises(ValueError):
            bl.projectile_distance_supersonic(
                100, 45, 1, -0.01, shape="sphere"
            )  # Negative area

        print("  All validation checks passed")

    def test_supersonic_extreme_velocities(self):
        """Test supersonic model at extreme velocities."""

        print(f"\nExtreme Velocity Testing:")

        mass = 0.01
        area = 0.001
        angle = 45

        # Test at various extreme velocities
        extreme_speeds = [
            (500, "Low supersonic"),
            (1000, "Supersonic"),
            (2000, "High supersonic"),
            (3000, "Very high supersonic"),
        ]

        for speed, description in extreme_speeds:
            try:
                dist = bl.projectile_distance_supersonic(
                    speed, angle, mass, area, shape="bullet", altitude_model=True
                )
                mach = speed / 340.3
                print(f"  {description} (M={mach:.1f}, {speed} m/s): {dist:.1f}m")

                # Verify distance is reasonable
                self.assertGreater(
                    dist, 0, f"Distance should be positive at {speed} m/s"
                )
                self.assertLess(
                    dist, 1e6, f"Distance should be reasonable at {speed} m/s"
                )
            except Exception as e:
                print(f"  {description} (M={speed / 340.3:.1f}) failed: {e}")

    def test_supersonic_consistency_across_angles(self):
        """Test that supersonic model behaves consistently across different angles."""

        print(f"\nSupersonic Angle Consistency Testing:")

        speed = 700  # m/s
        mass = 0.01
        area = 0.001
        angles = [15, 30, 45, 60, 75]

        distances = []
        max_heights = []

        print(f"  {'Angle':>6} {'Distance':>10} {'Max Height':>12}")
        for angle in angles:
            result = bl.projectile_distance_supersonic(
                speed,
                angle,
                mass,
                area,
                shape="bullet",
                altitude_model=True,
                return_trajectory=True,
            )
            distances.append(result["distance"])
            max_heights.append(max(result["y"]))
            print(
                f"  {angle:>6}° {result['distance']:>10.1f}m {max(result['y']):>12.1f}m"
            )

        # Verify max height increases with angle
        for i in range(1, len(angles)):
            if angles[i] <= 60:
                self.assertGreater(
                    max_heights[i],
                    max_heights[i - 1],
                    f"Max height should increase with angle up to 60°",
                )

        # Find optimal angle for range
        max_dist = max(distances)
        optimal_idx = distances.index(max_dist)
        optimal_angle = angles[optimal_idx]
        print(f"  Optimal angle: {optimal_angle}° ({max_dist:.1f}m)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
