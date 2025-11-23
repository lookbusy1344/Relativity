"""
Unit tests for propulsion.py

Tests the antimatter propulsion functions for correctness and mpmath integration.
Uses unittest framework and mpmath for high precision validation.
"""

import unittest
from mpmath import mp
import relativity_lib as rl
import propulsion


class TestPropulsion(unittest.TestCase):
    """Test suite for propulsion module"""

    @classmethod
    def setUpClass(cls):
        """Set up high precision mpmath for all tests"""
        rl.configure(100)  # Configure to 100 decimal places

    def test_photon_rocket_accel_time_basic(self):
        """Test photon rocket acceleration time with basic inputs"""
        fuel_mass = 1000.0
        dry_mass = 500.0
        efficiency = 1.0

        result = propulsion.photon_rocket_accel_time(fuel_mass, dry_mass, efficiency)

        # Result should be mpmath type
        self.assertIsInstance(result, mp.mpf)

        # Result should be positive
        self.assertGreater(result, 0)

        # With perfect efficiency (1.0), the time should be substantial
        # Formula: t = (η c / g) * ln(M0/Mf) = (1 * c / g) * ln(1500/500) = (c/g) * ln(3)
        expected = (rl.c / rl.g) * mp.log(rl.ensure("3"))
        self.assertAlmostEqual(float(result), float(expected), places=5)

    def test_photon_rocket_accel_time_with_efficiency(self):
        """Test photon rocket acceleration time with reduced efficiency"""
        fuel_mass = 1000.0
        dry_mass = 500.0
        efficiency = 0.5

        result = propulsion.photon_rocket_accel_time(fuel_mass, dry_mass, efficiency)

        # With 50% efficiency, time should be half of perfect efficiency
        perfect_result = propulsion.photon_rocket_accel_time(fuel_mass, dry_mass, 1.0)
        self.assertAlmostEqual(float(result), float(perfect_result) * 0.5, places=5)

    def test_photon_rocket_accel_time_zero_fuel(self):
        """Test photon rocket with zero fuel returns zero"""
        result = propulsion.photon_rocket_accel_time(0, 500, 1.0)
        self.assertEqual(result, rl.zero)

    def test_photon_rocket_accel_time_custom_g(self):
        """Test photon rocket with custom acceleration"""
        fuel_mass = 1000.0
        dry_mass = 500.0
        custom_g = 19.6133  # 2g

        result = propulsion.photon_rocket_accel_time(fuel_mass, dry_mass, 1.0, custom_g)

        # With double acceleration, time should be half
        normal_result = propulsion.photon_rocket_accel_time(fuel_mass, dry_mass, 1.0)
        self.assertAlmostEqual(float(result), float(normal_result) * 0.5, places=5)

    def test_pion_rocket_accel_time_basic(self):
        """Test pion rocket acceleration time with basic inputs"""
        fuel_mass = 1000.0
        dry_mass = 500.0
        nozzle_efficiency = 0.85

        result = propulsion.pion_rocket_accel_time(
            fuel_mass, dry_mass, nozzle_efficiency
        )

        # Result should be mpmath type
        self.assertIsInstance(result, mp.mpf)

        # Result should be positive
        self.assertGreater(result, 0)

        # Convert to years for sanity check
        years = result / (60 * 60 * 24 * 365.25)
        # Should be around 0.57 years with 85% nozzle efficiency
        self.assertAlmostEqual(float(years), 0.57, places=1)

    def test_pion_rocket_accel_time_zero_efficiency(self):
        """Test pion rocket with zero nozzle efficiency returns zero"""
        result = propulsion.pion_rocket_accel_time(1000, 500, 0)
        self.assertEqual(result, rl.zero)

    def test_pion_rocket_accel_time_mpmath_inputs(self):
        """Test pion rocket with mpmath inputs"""
        fuel_mass = rl.ensure("1000")
        dry_mass = rl.ensure("500")
        nozzle_efficiency = rl.ensure("0.85")

        result = propulsion.pion_rocket_accel_time(
            fuel_mass, dry_mass, nozzle_efficiency
        )

        # Result should be mpmath type
        self.assertIsInstance(result, mp.mpf)
        self.assertGreater(result, 0)

    def test_photon_rocket_fuel_fraction_basic(self):
        """Test photon rocket fuel fraction calculation"""
        thrust_time = 365.25 * 86400  # 1 year in seconds
        efficiency = 0.4

        result = propulsion.photon_rocket_fuel_fraction(thrust_time, None, efficiency)

        # Result should be mpmath type
        self.assertIsInstance(result, mp.mpf)

        # Result should be between 0 and 1
        self.assertGreater(result, 0)
        self.assertLess(result, 1)

    def test_photon_rocket_fuel_fraction_long_time(self):
        """Test photon rocket fuel fraction for long thrust time"""
        # 3.52 years at 60% efficiency
        years = 3.52
        thrust_time = years * 365.25 * 86400
        efficiency = 0.4

        result = propulsion.photon_rocket_fuel_fraction(thrust_time, None, efficiency)

        # For long thrust times, fuel fraction should be high (approaching 1)
        self.assertGreater(float(result), 0.9)

    def test_pion_rocket_fuel_fraction_basic(self):
        """Test pion rocket fuel fraction calculation"""
        thrust_time = 365.25 * 86400  # 1 year in seconds
        nozzle_efficiency = 0.85

        result = propulsion.pion_rocket_fuel_fraction(
            thrust_time, None, nozzle_efficiency
        )

        # Result should be mpmath type
        self.assertIsInstance(result, mp.mpf)

        # Result should be between 0 and 1
        self.assertGreater(result, 0)
        self.assertLess(result, 1)

    def test_pion_rocket_fuel_fraction_example(self):
        """Test pion rocket fuel fraction with known example"""
        # 3.52 years at 85% nozzle efficiency
        years = 3.52
        thrust_time = years * 365.25 * 86400
        nozzle_efficiency = 0.85

        result = propulsion.pion_rocket_fuel_fraction(
            thrust_time, None, nozzle_efficiency
        )

        # Should be approximately 99.8910% with new physics model
        self.assertAlmostEqual(float(result) * 100, 99.8910, places=3)

    def test_pion_rocket_fuel_fraction_zero_efficiency(self):
        """Test pion rocket fuel fraction with zero nozzle efficiency returns zero"""
        thrust_time = 365.25 * 86400
        result = propulsion.pion_rocket_fuel_fraction(thrust_time, None, 0)
        self.assertEqual(result, rl.zero)

    def test_pion_rocket_fuel_fraction_mpmath_inputs(self):
        """Test pion rocket fuel fraction with mpmath inputs"""
        thrust_time = rl.ensure("31557600")  # 1 year in seconds
        nozzle_efficiency = rl.ensure("0.85")

        result = propulsion.pion_rocket_fuel_fraction(
            thrust_time, None, nozzle_efficiency
        )

        # Result should be mpmath type
        self.assertIsInstance(result, mp.mpf)
        self.assertGreater(result, 0)

    def test_consistency_accel_time_and_fuel_fraction(self):
        """Test that accel_time and fuel_fraction functions are consistent"""
        # If we know the time for a given fuel mass, we should be able to
        # calculate the fuel fraction for that time

        fuel_mass = 1000.0
        dry_mass = 500.0
        nozzle_efficiency = 0.85

        # Calculate time for pion rocket
        accel_time = propulsion.pion_rocket_accel_time(
            fuel_mass, dry_mass, nozzle_efficiency
        )

        # Calculate fuel fraction for that time
        fuel_fraction = propulsion.pion_rocket_fuel_fraction(
            accel_time, None, nozzle_efficiency
        )

        # The fuel fraction should match fuel_mass / (fuel_mass + dry_mass)
        expected_fraction = fuel_mass / (fuel_mass + dry_mass)
        self.assertAlmostEqual(float(fuel_fraction), expected_fraction, places=5)

    def test_custom_acceleration_all_functions(self):
        """Test all functions accept custom acceleration parameter"""
        fuel_mass = 1000.0
        dry_mass = 500.0
        thrust_time = 365.25 * 86400
        custom_g = 19.6133  # 2g

        # All functions should work with custom acceleration
        result1 = propulsion.photon_rocket_accel_time(
            fuel_mass, dry_mass, 1.0, custom_g
        )
        result2 = propulsion.pion_rocket_accel_time(fuel_mass, dry_mass, 0.85, custom_g)
        result3 = propulsion.photon_rocket_fuel_fraction(thrust_time, custom_g, 0.4)
        result4 = propulsion.pion_rocket_fuel_fraction(thrust_time, custom_g, 0.85)

        # All results should be positive mpmath numbers
        for result in [result1, result2, result3, result4]:
            self.assertIsInstance(result, mp.mpf)
            self.assertGreater(result, 0)

    def test_mpmath_precision_maintained(self):
        """Test that high precision is maintained in calculations"""
        # Use very precise input values
        fuel_mass = rl.ensure("1000.123456789012345")
        dry_mass = rl.ensure("500.987654321098765")
        nozzle_efficiency = rl.ensure("0.8567890123456789")

        result = propulsion.pion_rocket_accel_time(
            fuel_mass, dry_mass, nozzle_efficiency
        )

        # Result should be mpmath type with high precision
        self.assertIsInstance(result, mp.mpf)

        # The result should not lose precision (check it's not rounded to float)
        # Convert back and forth should maintain precision
        result_str = str(result)
        self.assertGreater(len(result_str), 10)  # Should have many digits

    def test_pion_rocket_charged_fraction_effect(self):
        """Test that charged fraction (2/3) is properly accounted for"""
        fuel_mass = 1000.0
        dry_mass = 500.0
        nozzle_efficiency = 1.0  # Perfect nozzle to isolate charged fraction effect

        # With perfect nozzle, effective efficiency should be 2/3
        result = propulsion.pion_rocket_accel_time(
            fuel_mass, dry_mass, nozzle_efficiency
        )

        # Expected time with 2/3 charged fraction
        # ve = 0.94c * (2/3) * 1.0
        # Should be 2/3 of what it would be without the charged fraction limitation
        charged_fraction = 2.0 / 3.0
        ve_effective = rl.ensure("0.94") * rl.c * charged_fraction
        M0 = dry_mass + fuel_mass
        Mf = dry_mass
        expected_time = (ve_effective / rl.g) * mp.log(M0 / Mf)

        self.assertAlmostEqual(float(result), float(expected_time), places=5)

    def test_pion_rocket_total_system_efficiency(self):
        """Test that total system efficiency is (2/3) × nozzle_efficiency"""
        fuel_mass = 1000.0
        dry_mass = 500.0
        nozzle_efficiency = 0.85

        # Calculate time with new model
        result = propulsion.pion_rocket_accel_time(
            fuel_mass, dry_mass, nozzle_efficiency
        )

        # Total system efficiency should be approximately (2/3) × 0.85 ≈ 0.5667
        total_efficiency = (2.0 / 3.0) * 0.85

        # Verify by calculating what the time would be with the old model (no charged fraction)
        # and checking it's proportionally reduced
        ve_old_model = rl.ensure("0.94") * rl.c * rl.ensure(str(total_efficiency))
        M0 = dry_mass + fuel_mass
        Mf = dry_mass
        expected_time = (ve_old_model / rl.g) * mp.log(M0 / Mf)

        self.assertAlmostEqual(float(result), float(expected_time), places=5)


if __name__ == "__main__":
    unittest.main()
