"""
Unit tests for relativity_lib.py

Tests the mathematical functions for correctness, consistency, and edge cases.
Uses unittest framework and mpmath for high precision validation.
"""

import unittest
from mpmath import mp
import relativity_lib as rl
import math


class TestRelativityLib(unittest.TestCase):
    """Test suite for relativity_lib module"""

    @classmethod
    def setUpClass(cls):
        """Set up high precision mpmath for all tests"""
        rl.configure(100)  # Configure to 100 decimal places

    def test_configure(self):
        """Test the configure function sets precision correctly"""
        # Test different precision levels
        rl.configure(50)
        self.assertEqual(rl.configured_dp, 50)
        self.assertEqual(mp.dps, 50)

        # Verify constants are mpf types
        self.assertIsInstance(rl.c, mp.mpf)
        self.assertIsInstance(rl.g, mp.mpf)
        self.assertIsInstance(rl.csquared, mp.mpf)

        # Reset to test precision
        rl.configure(100)

    def test_ensure(self):
        """Test the ensure function converts to mpf correctly"""
        # Test with float
        result = rl.ensure(3.14159)
        self.assertIsInstance(result, mp.mpf)
        self.assertAlmostEqual(float(result), 3.14159, places=5)

        # Test with string
        result = rl.ensure("2.718281828")
        self.assertIsInstance(result, mp.mpf)
        self.assertAlmostEqual(float(result), 2.718281828, places=8)

        # Test with existing mpf
        mpf_val = mp.mpf("1.23456789")
        result = rl.ensure(mpf_val)
        self.assertEqual(result, mpf_val)

    def test_ensure_precision_check(self):
        """Test ensure raises error if constants precision is lower than current"""
        # Configure at lower precision
        rl.configure(10)
        # Set higher precision
        mp.dps = 50
        # Should raise ValueError
        with self.assertRaises(ValueError):
            rl.ensure(1.0)
        # Reset
        rl.configure(100)

    def test_ensure_abs(self):
        """Test ensure_abs returns absolute values correctly"""
        self.assertEqual(rl.ensure_abs(-5), rl.ensure_abs(5))
        self.assertEqual(rl.ensure_abs(0), rl.zero)
        self.assertEqual(rl.ensure_abs(-3.14), rl.ensure_abs(3.14))

    def test_check_velocity(self):
        """Test velocity validation function"""
        # Valid velocities
        valid_v = rl.c * mp.mpf("0.5")
        result = rl.check_velocity(valid_v)
        self.assertEqual(result, valid_v)

        # Velocity equal to c should return NaN
        result = rl.check_velocity(rl.c)
        self.assertTrue(mp.isnan(result))

        # Velocity greater than c should return NaN
        result = rl.check_velocity(rl.c * mp.mpf("1.1"))
        self.assertTrue(mp.isnan(result))

        # Test with throw_on_error=True
        with self.assertRaises(ValueError):
            rl.check_velocity(rl.c, throw_on_error=True)

    def test_relativistic_velocity(self):
        """Test relativistic velocity calculation"""
        # Test zero proper time
        result = rl.relativistic_velocity(rl.g, 0)
        self.assertEqual(result, rl.zero)

        # Test known result: after 1 year at 1g
        one_year = rl.seconds_per_year
        velocity = rl.relativistic_velocity(rl.g, one_year)
        self.assertTrue(velocity > rl.zero)
        self.assertTrue(velocity < rl.c)

        # Test symmetry with negative inputs (should be same magnitude)
        v1 = rl.relativistic_velocity(rl.g, one_year)
        v2 = rl.relativistic_velocity(-rl.g, -one_year)
        self.assertAlmostEqual(float(v1), float(v2), places=10)

    def test_relativistic_distance(self):
        """Test relativistic distance calculation"""
        # Test zero proper time
        result = rl.relativistic_distance(rl.g, 0)
        self.assertEqual(result, rl.zero)

        # Test positive values
        one_year = rl.seconds_per_year
        distance = rl.relativistic_distance(rl.g, one_year)
        self.assertTrue(distance > rl.zero)

        # Compare with classical distance (should be larger)
        classical = rl.simple_distance(rl.g, one_year)
        self.assertTrue(distance > classical)

    def test_simple_distance(self):
        """Test classical distance calculation"""
        # Test known formula: d = 0.5 * a * t^2
        a = rl.ensure(10)  # 10 m/s²
        t = rl.ensure(5)   # 5 seconds
        expected = mp.mpf("125")  # 0.5 * 10 * 25
        result = rl.simple_distance(a, t)
        self.assertEqual(result, expected)

    def test_coordinate_time(self):
        """Test coordinate time calculation"""
        # Test zero proper time
        result = rl.coordinate_time(rl.g, 0)
        self.assertEqual(result, rl.zero)

        # Test positive values
        one_year = rl.seconds_per_year
        coord_time = rl.coordinate_time(rl.g, one_year)
        self.assertTrue(coord_time > one_year)  # Should be greater than proper time

    def test_relativistic_time_for_distance(self):
        """Test calculation of time needed for distance"""
        # Test zero distance
        result = rl.relativistic_time_for_distance(rl.g, 0)
        self.assertEqual(result, rl.zero)

        # Test round-trip consistency
        distance = rl.light_year
        time_needed = rl.relativistic_time_for_distance(rl.g, distance)
        actual_distance = rl.relativistic_distance(rl.g, time_needed)
        self.assertAlmostEqual(float(distance), float(actual_distance), places=5)

    def test_flip_and_burn(self):
        """Test flip and burn maneuver calculation"""
        distance = rl.au  # 1 AU
        proper_time, peak_vel, lorentz, coord_time = rl.flip_and_burn(rl.g, distance)

        # All values should be positive
        self.assertTrue(proper_time > rl.zero)
        self.assertTrue(peak_vel > rl.zero)
        self.assertTrue(lorentz >= rl.one)
        self.assertTrue(coord_time > rl.zero)

        # Peak velocity should be less than c
        self.assertTrue(peak_vel < rl.c)

        # Coordinate time should be longer than proper time
        self.assertTrue(coord_time > proper_time)

    def test_fall(self):
        """Test falling calculation"""
        height = rl.ensure(1000)  # 1000 meters
        proper_time, coord_time, velocity = rl.fall(rl.g, height)

        # All values should be positive
        self.assertTrue(proper_time > rl.zero)
        self.assertTrue(coord_time > rl.zero)
        self.assertTrue(velocity > rl.zero)

        # For small distances, should approximate classical physics
        # v = sqrt(2*g*h) = sqrt(2*9.8*1000) ≈ 140 m/s
        classical_v = mp.sqrt(2 * rl.g * height)
        self.assertAlmostEqual(float(velocity), float(classical_v), places=0)

    def test_lorentz_factor(self):
        """Test Lorentz factor calculation"""
        # Test zero velocity
        result = rl.lorentz_factor(0)
        self.assertEqual(result, rl.one)

        # Test half light speed
        half_c = rl.c / 2
        gamma = rl.lorentz_factor(half_c)
        expected = rl.one / mp.sqrt(rl.one - mp.mpf("0.25"))
        self.assertAlmostEqual(float(gamma), float(expected), places=10)

        # Test approaching light speed
        near_c = rl.c * mp.mpf("0.9")
        gamma = rl.lorentz_factor(near_c)
        self.assertTrue(gamma > rl.ensure(2))  # Should be > 2 for 0.9c

    def test_rapidity_functions(self):
        """Test rapidity conversion functions"""
        # Test round-trip conversion
        velocity = rl.c * mp.mpf("0.5")
        rapidity = rl.rapidity_from_velocity(velocity)
        velocity_back = rl.velocity_from_rapidity(rapidity)
        self.assertAlmostEqual(float(velocity), float(velocity_back), places=10)

        # Test zero velocity
        zero_rapidity = rl.rapidity_from_velocity(0)
        self.assertEqual(zero_rapidity, rl.zero)
        zero_velocity = rl.velocity_from_rapidity(0)
        self.assertEqual(zero_velocity, rl.zero)

    def test_add_velocities(self):
        """Test relativistic velocity addition"""
        # Test adding zero
        v1 = rl.c * mp.mpf("0.5")
        result = rl.add_velocities(v1, 0)
        self.assertEqual(result, v1)

        # Test adding small velocities (should approximate classical)
        small_v = rl.ensure(100)  # 100 m/s
        result = rl.add_velocities(small_v, small_v)
        classical = small_v + small_v
        self.assertAlmostEqual(float(result), float(classical), places=0)

        # Test adding large velocities (should be < c)
        large_v = rl.c * mp.mpf("0.8")
        result = rl.add_velocities(large_v, large_v)
        self.assertTrue(result < rl.c)

    def test_relativistic_momentum(self):
        """Test relativistic momentum calculation"""
        mass = rl.ensure(1.0)  # 1 kg
        velocity = rl.c * mp.mpf("0.5")
        
        momentum = rl.relativistic_momentum(mass, velocity)
        gamma = rl.lorentz_factor(velocity)
        expected = mass * velocity * gamma
        
        self.assertAlmostEqual(float(momentum), float(expected), places=10)

    def test_relativistic_energy(self):
        """Test relativistic energy calculation"""
        mass = rl.ensure(1.0)  # 1 kg
        velocity = rl.c * mp.mpf("0.5")
        
        energy = rl.relativistic_energy(mass, velocity)
        gamma = rl.lorentz_factor(velocity)
        expected = mass * rl.csquared * gamma
        
        self.assertAlmostEqual(float(energy), float(expected), places=10)
        
        # Test rest energy (v=0)
        rest_energy = rl.relativistic_energy(mass, 0)
        self.assertAlmostEqual(float(rest_energy), float(mass * rl.csquared), places=10)

    def test_four_momentum(self):
        """Test four-momentum calculation"""
        mass = rl.ensure(1.0)
        velocity = rl.c * mp.mpf("0.3")
        
        energy, momentum = rl.four_momentum(mass, velocity)
        
        # Check energy-momentum relation: E² - (pc)² = (mc²)²
        invariant = energy**2 - (momentum * rl.c)**2
        rest_energy_sq = (mass * rl.csquared)**2
        
        self.assertAlmostEqual(float(invariant), float(rest_energy_sq), places=8)

    def test_spacetime_interval_1d(self):
        """Test 1D spacetime interval calculation"""
        # Light-like interval: Δs² = 0
        event1 = (0, 0)
        event2 = (1, rl.c)  # 1 second, c meters
        interval = rl.spacetime_interval_1d(event1, event2)
        self.assertAlmostEqual(float(interval), 0, places=5)

        # Time-like interval: Δs² > 0
        event2_timelike = (2, 0)  # 2 seconds, same position
        interval_timelike = rl.spacetime_interval_1d(event1, event2_timelike)
        self.assertTrue(interval_timelike > 0)

        # Space-like interval: Δs² < 0
        event2_spacelike = (1, 2 * rl.c)  # 1 second, 2c meters
        interval_spacelike = rl.spacetime_interval_1d(event1, event2_spacelike)
        self.assertTrue(interval_spacelike < 0)

    def test_spacetime_interval_3d(self):
        """Test 3D spacetime interval calculation"""
        # Light-like interval in 3D
        event1 = (0, 0, 0, 0)
        event2 = (1, rl.c/mp.sqrt(3), rl.c/mp.sqrt(3), rl.c/mp.sqrt(3))
        interval = rl.spacetime_interval_3d(event1, event2)
        self.assertAlmostEqual(float(interval), 0, places=5)

    def test_lorentz_transform_1d(self):
        """Test 1D Lorentz transformation"""
        # Test identity transformation (v=0)
        t, x = 1, 1000
        t_prime, x_prime = rl.lorentz_transform_1d(t, x, 0)
        self.assertEqual(float(t_prime), t)
        self.assertEqual(float(x_prime), x)

        # Test symmetry: transforming back should give original
        v = rl.c * mp.mpf("0.5")
        t_prime, x_prime = rl.lorentz_transform_1d(t, x, v)
        t_back, x_back = rl.lorentz_transform_1d(t_prime, x_prime, -v)
        
        self.assertAlmostEqual(float(t_back), t, places=10)
        self.assertAlmostEqual(float(x_back), x, places=10)

    def test_lorentz_transform_3d(self):
        """Test 3D Lorentz transformation"""
        # Test that y and z coordinates are unchanged
        t, x, y, z = 1, 1000, 500, 200
        v = rl.c * mp.mpf("0.3")
        
        t_prime, x_prime, y_prime, z_prime = rl.lorentz_transform_3d(t, x, y, z, v)
        
        self.assertEqual(float(y_prime), y)
        self.assertEqual(float(z_prime), z)
        self.assertNotEqual(float(t_prime), t)
        self.assertNotEqual(float(x_prime), x)

    def test_doppler_shift(self):
        """Test relativistic Doppler shift"""
        frequency = rl.ensure(1e9)  # 1 GHz
        velocity = rl.c * mp.mpf("0.1")  # 10% of c
        
        # Moving towards observer (blue shift)
        freq_blue = rl.doppler_shift(frequency, velocity, source_moving_towards=True)
        self.assertTrue(freq_blue > frequency)
        
        # Moving away from observer (red shift)
        freq_red = rl.doppler_shift(frequency, velocity, source_moving_towards=False)
        self.assertTrue(freq_red < frequency)

    def test_length_contraction_velocity(self):
        """Test length contraction calculation"""
        proper_length = rl.ensure(100)  # 100 meters
        velocity = rl.c * mp.mpf("0.6")  # 60% of c
        
        contracted = rl.length_contraction_velocity(proper_length, velocity)
        self.assertTrue(contracted < proper_length)
        
        # Test zero velocity (no contraction)
        no_contraction = rl.length_contraction_velocity(proper_length, 0)
        self.assertEqual(no_contraction, proper_length)

    def test_min_separation(self):
        """Test minimum separation calculation"""
        # Time-like interval
        timelike_interval = rl.ensure(100)  # positive
        sep_type, time_sep, dist_sep = rl.min_separation(timelike_interval)
        self.assertEqual(sep_type, "time-like")
        self.assertIsNotNone(time_sep)
        self.assertIsNone(dist_sep)

        # Space-like interval
        spacelike_interval = rl.ensure(-100)  # negative
        sep_type, time_sep, dist_sep = rl.min_separation(spacelike_interval)
        self.assertEqual(sep_type, "space-like")
        self.assertIsNone(time_sep)
        self.assertIsNotNone(dist_sep)

        # Light-like interval
        lightlike_interval = rl.zero
        sep_type, time_sep, dist_sep = rl.min_separation(lightlike_interval)
        self.assertEqual(sep_type, "light-like")
        self.assertIsNone(time_sep)
        self.assertIsNone(dist_sep)

    def test_relativistic_distance_float(self):
        """Test float version of relativistic distance"""
        # Compare with mpmath version for small values
        a_float = 9.8
        tau_float = 1000.0
        
        result_float = rl.relativistic_distance_float(a_float, tau_float)
        result_mpmath = rl.relativistic_distance(rl.ensure(a_float), rl.ensure(tau_float))
        
        # Should be approximately equal for reasonable values
        self.assertAlmostEqual(result_float, float(result_mpmath), places=3)

    def test_coordinate_time_functions(self):
        """Test coordinate time-based functions"""
        a = rl.g
        coord_time = rl.ensure(1000)  # 1000 seconds coordinate time
        
        # Test relativistic velocity from coordinate time
        velocity = rl.relativistic_velocity_coord(a, coord_time)
        self.assertTrue(velocity > rl.zero)
        self.assertTrue(velocity < rl.c)
        
        # Test relativistic distance from coordinate time
        distance = rl.relativistic_distance_coord(a, coord_time)
        self.assertTrue(distance > rl.zero)

    def test_formatting_functions(self):
        """Test number formatting functions"""
        number = rl.ensure("123456.789123")
        
        # Test basic formatting
        formatted = rl.format_mpf(number, 2)
        self.assertIn("123,456.78", formatted)
        
        # Test significant figures
        small_number = rl.ensure("0.000012345")
        sig_formatted = rl.format_mpf_significant(small_number, 3)
        self.assertIn("0.000012", sig_formatted)

    def test_math_consistency(self):
        """Test mathematical consistency between functions"""
        # Test that tau_to_velocity and relativistic_velocity are inverse operations
        a = rl.g
        target_velocity = rl.c * mp.mpf("0.5")
        
        # Calculate time needed to reach velocity
        tau_needed = rl.tau_to_velocity(a, target_velocity)
        # Calculate velocity at that time
        velocity_achieved = rl.relativistic_velocity(a, tau_needed)
        
        self.assertAlmostEqual(float(target_velocity), float(velocity_achieved), places=8)

    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        # Test with very small accelerations
        tiny_a = rl.ensure("1e-10")
        result = rl.relativistic_velocity(tiny_a, rl.ensure(1))
        self.assertTrue(result > rl.zero)
        
        # Test with very small times
        tiny_tau = rl.ensure("1e-10")
        result = rl.relativistic_distance(rl.g, tiny_tau)
        self.assertTrue(result >= rl.zero)


if __name__ == "__main__":
    # Run with verbose output
    unittest.main(verbosity=2)