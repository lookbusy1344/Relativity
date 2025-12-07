"""
Tests for extra_lib.py - Galactic stellar density estimation.

Uses the same test values as the TypeScript implementation (extra_lib.test.ts)
to verify cross-platform consistency.
"""

import unittest
import extra_lib


class TestEstimateStarsInSphere(unittest.TestCase):
    """Test stellar density estimation against expected values."""

    def test_negative_radius_raises_error(self):
        """Should raise ValueError for negative radius."""
        with self.assertRaises(ValueError) as ctx:
            extra_lib.estimate_stars_in_sphere(-100)
        self.assertIn("must be positive", str(ctx.exception))

    def test_zero_radius_raises_error(self):
        """Should raise ValueError for zero radius."""
        with self.assertRaises(ValueError) as ctx:
            extra_lib.estimate_stars_in_sphere(0)
        self.assertIn("must be positive", str(ctx.exception))

    def test_invalid_shells_raises_error(self):
        """Should raise ValueError for invalid n_shells."""
        with self.assertRaises(ValueError) as ctx:
            extra_lib.estimate_stars_in_sphere(1000, n_shells=-1)
        self.assertIn("must be positive", str(ctx.exception))

    def test_invalid_samples_raises_error(self):
        """Should raise ValueError for invalid samples_per_shell."""
        with self.assertRaises(ValueError) as ctx:
            extra_lib.estimate_stars_in_sphere(1000, samples_per_shell=0)
        self.assertIn("must be positive", str(ctx.exception))

    def test_reproducibility(self):
        """Should produce identical results with same inputs (deterministic seed)."""
        result1 = extra_lib.estimate_stars_in_sphere(1000)
        result2 = extra_lib.estimate_stars_in_sphere(1000)

        self.assertEqual(result1[0], result2[0])
        self.assertEqual(result1[1], result2[1])

    def test_monotonicity(self):
        """Larger radius should always have more stars."""
        small_stars, small_frac = extra_lib.estimate_stars_in_sphere(500)
        large_stars, large_frac = extra_lib.estimate_stars_in_sphere(1000)

        self.assertGreater(large_stars, small_stars)
        self.assertGreater(large_frac, small_frac)

    def test_very_small_radius(self):
        """Should estimate very few stars at 5 light-years."""
        stars, frac = extra_lib.estimate_stars_in_sphere(5)

        self.assertGreater(stars, 0)
        self.assertLess(stars, 10)

    def test_large_radius_approaches_full_galaxy(self):
        """Should be close to 100% of galaxy at 100,000 ly."""
        stars, frac = extra_lib.estimate_stars_in_sphere(100000)

        self.assertGreater(frac, 0.9)
        self.assertLess(frac, 1.1)  # Allow slight over 100% due to model limits

    def test_1000_ly_expected_range(self):
        """Should estimate ~12.5 million stars at 1000 ly."""
        stars, frac = extra_lib.estimate_stars_in_sphere(1000)

        self.assertGreater(stars, 11_000_000)
        self.assertLess(stars, 14_000_000)
        self.assertGreater(frac, 0)
        self.assertLess(frac, 1)

    def test_50000_ly_significant_fraction(self):
        """Should capture ~85% of galaxy at 50,000 ly."""
        stars, frac = extra_lib.estimate_stars_in_sphere(50000)

        self.assertGreater(frac, 0.82)
        self.assertLess(frac, 0.88)


class TestComprehensiveAccuracy(unittest.TestCase):
    """
    Comprehensive validation against TypeScript implementation.

    These expected values come from extra_lib.test.ts and represent
    the output of the TypeScript implementation. Both implementations
    should produce the same results (within 1% tolerance for Monte Carlo variance).
    """

    # Expected values from TypeScript implementation (extra_lib.test.ts:87-103)
    COMPARISON_RESULTS = [
        (5, 1.78, "~1-3 stars (Proxima, α Cen A/B)"),
        (10, 14.23, "~12-15 known stars (incl. Sirius, Barnard's)"),
        (20, 113.7, "~100-130 stars"),
        (50, 1770, "~1700-2000 stars"),
        (100, 14066, "~12,000-15,000 stars (local bubble)"),
        (1000, 12.50e6, "~12 million stars"),
        (5000, 1.007e9, "~1B stars"),
        (10000, 5.37e9, "~5B stars (~3% of galaxy)"),
        (20000, 27.80e9, "~28B stars (~14% of galaxy)"),
        (50000, 170.9e9, "~171B stars (~85% of galaxy)"),
        (60000, 185.5e9, "~186B stars (~93% of galaxy)"),
        (70000, 193.1e9, "~193B stars (~97% of galaxy)"),
        (80000, 196.7e9, "~197B stars (~98% of galaxy)"),
        (85000, 197.7e9, "~198B stars (~99% of galaxy)"),
        (100000, 199.3e9, "~200B stars (full MW extent)"),
    ]

    def test_cross_platform_consistency(self):
        """
        Verify Python implementation matches TypeScript expected values.

        NOTE: Due to different RNG implementations (numpy.random vs seedrandom),
        exact numerical matches are not expected. However, the results should be
        statistically equivalent (within 1-2% for most cases).

        This test uses 1% tolerance as specified in the TypeScript tests.
        """
        print("\n" + "=" * 80)
        print("Cross-Platform Consistency Check (Python vs TypeScript expected values)")
        print("=" * 80)
        print(
            f"{'Radius':<10} {'Expected':<15} {'Python':<15} {'Diff %':<10} {'Status':<10}"
        )
        print("-" * 80)

        max_diff_percent = 0.0
        failures = []

        for radius, expected_stars, notes in self.COMPARISON_RESULTS:
            stars, frac = extra_lib.estimate_stars_in_sphere(radius)

            # Calculate percentage difference
            diff_percent = abs(stars - expected_stars) / expected_stars * 100
            max_diff_percent = max(max_diff_percent, diff_percent)

            # 1% tolerance as in TypeScript tests
            tolerance = expected_stars * 0.01
            passed = (
                (expected_stars - tolerance) <= stars <= (expected_stars + tolerance)
            )

            status = "PASS" if passed else "FAIL"

            # Format numbers for display
            if expected_stars >= 1e9:
                exp_str = f"{expected_stars / 1e9:.2f}B"
                py_str = f"{stars / 1e9:.2f}B"
            elif expected_stars >= 1e6:
                exp_str = f"{expected_stars / 1e6:.2f}M"
                py_str = f"{stars / 1e6:.2f}M"
            elif expected_stars >= 1e3:
                exp_str = f"{expected_stars / 1e3:.2f}K"
                py_str = f"{stars / 1e3:.2f}K"
            else:
                exp_str = f"{expected_stars:.1f}"
                py_str = f"{stars:.1f}"

            print(
                f"{radius:<10,} {exp_str:<15} {py_str:<15} {diff_percent:<10.2f} {status:<10}"
            )

            if not passed:
                failures.append(
                    f"Radius {radius}: expected {expected_stars:.2e}, got {stars:.2e} "
                    f"(diff: {diff_percent:.2f}%)"
                )

        print("-" * 80)
        print(f"Maximum difference: {max_diff_percent:.2f}%")
        print("=" * 80)

        # Report failures if any
        if failures:
            self.fail(
                f"\n{len(failures)} test(s) failed to match expected values:\n"
                + "\n".join(failures)
            )

    def test_galaxy_total_in_reasonable_range(self):
        """
        Verify total galaxy star count is in reasonable range.

        The Milky Way is estimated to contain 100-400 billion stars.
        Our calibrated model produces ~200 billion stars.
        """
        stars, frac = extra_lib.estimate_stars_in_sphere(100000)

        self.assertGreater(stars, 180e9, "Galaxy total should be > 180 billion")
        self.assertLess(stars, 220e9, "Galaxy total should be < 220 billion")


if __name__ == "__main__":
    # Run tests with verbose output
    unittest.main(verbosity=2)
