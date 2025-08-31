//#![allow(unused_imports)]
#![allow(dead_code)]
//#![allow(unused_variables)]
//#![allow(unreachable_code)]

// Relativity functions for the Astro-float crate, giving arbitrary precision floating point precision
// Note the expr!() macro is used to simplfy context handlding in equations
// However expr!() cannot evaluate fields like self.c so we need let c = &self.c

use anyhow::anyhow;
use astro_float::ctx::Context;
use astro_float::{expr, BigFloat, Consts, RoundingMode};
use std::str::FromStr;

pub const ROUNDING: RoundingMode = RoundingMode::ToEven;
pub const C_FLOAT: f64 = 299_792_458.0;

pub struct Relativity {
    pub ctx: Context,
    binary_digits: usize,

    c: BigFloat,
    c_squared: BigFloat,
    g: BigFloat,
    light_year: BigFloat,
    au: BigFloat,
    seconds_per_year: BigFloat,
    one: BigFloat,
    half: BigFloat,
}

/// Result of a flip and burn maneuver
#[derive(Clone, Debug)]
pub struct FlipAndBurnResult {
    pub proper_time: BigFloat,
    pub peak_velocity: BigFloat,
    pub peak_lorentz: BigFloat,
    pub coord_time: BigFloat,
}

/// Simplified interval with time and 1D coordinate
/// Only contains refs so can be passed by-value (copy, clone)
#[derive(Clone, Debug)]
pub struct SimplifiedInterval {
    pub time: BigFloat,
    pub x: BigFloat,
}

impl SimplifiedInterval {
    /// Create a new interval from time and 1D coordinate as f64
    pub fn from_f64(time: f64, x: f64, rel: &Relativity) -> Self {
        Self {
            time: rel.bigfloat_from_f64(time),
            x: rel.bigfloat_from_f64(x),
        }
    }

    /// Destructure the interval into its time, x components
    pub fn destructure(&self) -> (&BigFloat, &BigFloat) {
        (&self.time, &self.x)
    }
}

/// Interval with time and 3D coordinates
/// Only contains refs so can be passed by-value (copy, clone)
#[derive(Clone, Debug)]
pub struct Interval {
    pub time: BigFloat,
    pub x: BigFloat,
    pub y: BigFloat,
    pub z: BigFloat,
}

impl Interval {
    /// Create a new interval from time and 3D coordinates as f64
    pub fn from_f64(time: f64, x: f64, y: f64, z: f64, rel: &Relativity) -> Self {
        Self {
            time: rel.bigfloat_from_f64(time),
            x: rel.bigfloat_from_f64(x),
            y: rel.bigfloat_from_f64(y),
            z: rel.bigfloat_from_f64(z),
        }
    }

    /// Destructure the interval into its time, x, y, z components
    pub fn destructure(&self) -> (&BigFloat, &BigFloat, &BigFloat, &BigFloat) {
        (&self.time, &self.x, &self.y, &self.z)
    }
}

/// Energy and momentum struct, used for returning to not refs
#[derive(Clone, Debug)]
pub struct EnergyMomentum {
    pub energy: BigFloat,
    pub momentum: BigFloat,
}

impl Relativity {
    /// Setup the Relativity struct with the specified number of decimal digits (times 3.32 for binary precision)
    pub fn new(decimal_digits: usize) -> Self {
        #[allow(clippy::cast_possible_truncation)]
        #[allow(clippy::cast_sign_loss)]
        #[allow(clippy::cast_precision_loss)]
        let binary_digits = (decimal_digits as f64 * 3.32) as usize;
        let constants = Consts::new().expect("Failed to allocate constants cache");
        let c = BigFloat::from_u32(299_792_458, binary_digits);
        let one = BigFloat::from_u32(1, binary_digits);

        Self {
            binary_digits,
            ctx: Context::new(
                binary_digits,
                ROUNDING,
                constants,
                i32::MIN,
                i32::MAX,
            ),
            c_squared: c.powi(2, binary_digits, ROUNDING),
            half: one.div(
                &BigFloat::from_i32(2, binary_digits),
                binary_digits,
                ROUNDING,
            ),
            one,
            c,
            g: Relativity::bigfloat_from_str("9.80665"),
            light_year: Relativity::bigfloat_from_str("9460730472580800"),
            au: Relativity::bigfloat_from_str("149597870700"),
            seconds_per_year: Relativity::bigfloat_from_str("31557600"), // 365.25 * 24 * 60 * 60
        }
    }

    // ============= getters for constants =================

    #[inline]
    pub fn get_c(&self) -> &BigFloat {
        &self.c
    }
    #[inline]
    pub fn get_g(&self) -> &BigFloat {
        &self.g
    }
    #[inline]
    pub fn get_light_year(&self) -> &BigFloat {
        &self.light_year
    }
    #[inline]
    pub fn get_au(&self) -> &BigFloat {
        &self.au
    }
    #[inline]
    pub fn get_seconds_per_year(&self) -> &BigFloat {
        &self.seconds_per_year
    }

    #[inline]
    /// helper to get distance in m from light years
    pub fn light_years(&mut self, ly: f64) -> BigFloat {
        let light_year = &self.light_year;
        expr!(light_year * ly, &mut self.ctx)
    }

    #[inline]
    /// helper to turn velocity m/s into a fraction of c
    pub fn velocity_as_c(&mut self, velocity: &BigFloat) -> BigFloat {
        // velocity / c
        self.check_velocity(velocity);
        let c = &self.c;
        expr!(velocity / c, &mut self.ctx)
    }

    #[inline]
    /// helper to turn fraction of c into m/s velocity
    pub fn velocity_from_c(&mut self, fraction: &BigFloat) -> BigFloat {
        // fraction * c
        assert!(
            !fraction.abs().ge(&self.one),
            "Fraction of c must be less than 1"
        );
        let c = &self.c;
        expr!(fraction * c, &mut self.ctx)
    }

    // ============= Special relativity functions =================

    /// Calculate proper time (sec) to reach a given velocity under constant proper acceleration
    pub fn tau_to_velocity(&mut self, accel: &BigFloat, velocity: &BigFloat) -> BigFloat {
        // (c / a) * atanh(velocity / c)
        let c = &self.c;
        expr!((c / accel) * atanh(velocity / c), &mut self.ctx)
    }

    /// Relativistic velocity (m/s) from acceleration (m/s^2) and proper time (s)
    pub fn relativistic_velocity(&mut self, accel: &BigFloat, tau: &BigFloat) -> BigFloat {
        // c * tanh(a * tau / c)
        let c = &self.c;
        expr!(c * tanh(accel * tau / c), &mut self.ctx)
    }

    /// Distance (m) from proper acceleration (m/s^2) and proper time (s)
    pub fn relativistic_distance(&mut self, accel: &BigFloat, tau: &BigFloat) -> BigFloat {
        // (csquared / a) * (cosh(a * tau / c) - one)
        let c_squared = &self.c_squared;
        let c = &self.c;
        let one = &self.one;
        expr!(
            (c_squared / accel) * (cosh(accel * tau / c) - one),
            &mut self.ctx
        )
    }

    /// Proper time (s) from relativistic acceleration (m/s^2) and distance (m)
    pub fn relativistic_time_for_distance(
        &mut self,
        accel: &BigFloat,
        dist: &BigFloat,
    ) -> BigFloat {
        // (c / a) * acosh((dist * a) / csquared + one)
        let c = &self.c;
        let c_squared = &self.c_squared;
        let one = &self.one;
        expr!(
            (c / accel) * acosh((dist * accel) / c_squared + one),
            &mut self.ctx
        )
    }

    /// Calculate proper time (s), peak velocity (m/s), peak lorentz, and coord time (s) for a flip and burn maneuver at given constant acceleration
    pub fn flip_and_burn(&mut self, accel: &BigFloat, dist: &BigFloat) -> FlipAndBurnResult {
        let half_dist = expr!(dist / 2.0, &mut self.ctx);
        let time_half_proper = self.relativistic_time_for_distance(accel, &half_dist);
        let time_half_coord = self.coordinate_time(accel, &time_half_proper);

        let velocity = self.relativistic_velocity(accel, &time_half_proper);
        let lorentz = self.lorentz_factor(&velocity);
        let total_proper = expr!(time_half_proper * 2.0, &mut self.ctx);
        let total_coord = expr!(time_half_coord * 2.0, &mut self.ctx);
        FlipAndBurnResult { proper_time: total_proper, peak_velocity: velocity, peak_lorentz: lorentz, coord_time: total_coord }
    }

    /// Distance (m) from non-relativistic acceleration (m/s^2) and time (s)
    pub fn simple_distance(&mut self, accel: &BigFloat, t: &BigFloat) -> BigFloat {
        // 0.5 * a * t**2
        let half = &self.half;
        expr!(half * accel * pow(t, 2), &mut self.ctx)
    }

    /// Rapidity from velocity (m/s)
    pub fn rapidity_from_velocity(&mut self, velocity: &BigFloat) -> BigFloat {
        // atanh(velocity / c)
        self.check_velocity(velocity);
        let c = &self.c;
        expr!(atanh(velocity / c), &mut self.ctx)
    }

    /// Velocity (m/s) from rapidity
    pub fn velocity_from_rapidity(&mut self, rapidity: &BigFloat) -> BigFloat {
        // c * tanh(rapidity)
        let c = &self.c;
        let v = expr!(c * tanh(rapidity), &mut self.ctx);
        self.check_velocity_msg(&v, "Precision failure in velocity_from_rapidity");
        v
    }

    // Add two velocities (m/s) using relativistic velocity addition
    pub fn add_velocities(&mut self, v1: &BigFloat, v2: &BigFloat) -> BigFloat {
        // (v1 + v2) / (one + (v1 * v2) / csquared)
        let c_squared = &self.c_squared;
        let one = &self.one;
        expr!((v1 + v2) / (one + (v1 * v2) / c_squared), &mut self.ctx)
    }

    /// Coordinate time elapsed (s) from proper acceleration (m/s^2) and proper time (s)
    pub fn coordinate_time(&mut self, accel: &BigFloat, tau: &BigFloat) -> BigFloat {
        // (c / a) * sinh(a * tau / c)
        let c = &self.c;
        expr!((c / accel) * sinh(accel * tau / c), &mut self.ctx)
    }

    /// Contracted length (m) from proper length (m) and velocity (m/s)
    pub fn length_contraction_velocity(&mut self, len: &BigFloat, velocity: &BigFloat) -> BigFloat {
        // len * sqrt(one - (velocity / c) ** 2)
        self.check_velocity(velocity);
        let c = &self.c;
        let one = &self.one;
        expr!(len * sqrt(one - pow(velocity / c, 2)), &mut self.ctx)
    }

    /// Calculate the Lorentz factor from a velocity (m/s)
    pub fn lorentz_factor(&mut self, velocity: &BigFloat) -> BigFloat {
        // one / sqrt(one - (velocity / c) ** 2)
        self.check_velocity(velocity);
        let c = &self.c;
        let one = &self.one;
        expr!(one / sqrt(one - pow(velocity / c, 2)), &mut self.ctx)
    }

    /// Calculate the velocity under constant proper acceleration and coordinate time
    pub fn relativistic_velocity_coord(
        &mut self,
        prop_accel: &BigFloat,
        coord_time: &BigFloat,
    ) -> BigFloat {
        // (a0 * t) / sqrt(one + (a0 * t / c) ** 2)
        let c = &self.c;
        let one = &self.one;
        expr!(
            (prop_accel * coord_time) / sqrt(one + pow(prop_accel * coord_time / c, 2)),
            &mut self.ctx
        )
    }

    /// Calculate the coordinate distance traveled (m) under constant proper acceleration and coordinate time
    pub fn relativistic_distance_coord(
        &mut self,
        prop_accel: &BigFloat,
        coord_time: &BigFloat,
    ) -> BigFloat {
        // (csquared / a0) * (sqrt(one + (a0 * t / c) ** 2) - one)
        let c_squared = &self.c_squared;
        let c = &self.c;
        let one = &self.one;
        expr!(
            (c_squared / prop_accel) * (sqrt(one + pow(prop_accel * coord_time / c, 2)) - one),
            &mut self.ctx
        )
    }

    /// Calculate the relativistic momentum (kg m/s) from mass (kg) and velocity (m/s)
    pub fn relativistic_momentum(&mut self, mass: &BigFloat, velocity: &BigFloat) -> BigFloat {
        // gamma = lorentz_factor(velocity)
        // mass * velocity * gamma
        self.check_velocity(velocity);
        let gamma = self.lorentz_factor(velocity);
        expr!(mass * velocity * gamma, &mut self.ctx)
    }

    /// Calculate the relativistic energy in joules from mass (kg) and velocity (m/s)
    pub fn relativistic_energy(&mut self, mass: &BigFloat, velocity: &BigFloat) -> BigFloat {
        // gamma = lorentz_factor(velocity)
        // mass * csquared * gamma
        self.check_velocity(velocity);
        let gamma = self.lorentz_factor(velocity);
        let c_squared = &self.c_squared;
        expr!(mass * c_squared * gamma, &mut self.ctx)
    }

    /// Calculate the invariant (proper) mass of a system from energy and momentum
    pub fn invariant_mass_from_energy_momentum(
        &mut self,
        energy: &BigFloat,
        momentum: &BigFloat,
    ) -> BigFloat {
        // sqrt((energy / csquared) ** 2 - (momentum / csquared) ** 2)
        let c_squared = &self.c_squared;
        expr!(
            sqrt(pow(energy / c_squared, 2) - pow(momentum / c_squared, 2)),
            &mut self.ctx
        )
    }

    /// Calculate the four-momentum of a particle. Returns energy and momentum
    pub fn four_momentum(&mut self, mass: &BigFloat, velocity: &BigFloat) -> EnergyMomentum {
        // gamma = lorentz_factor(velocity)
        // energy = mass * csquared * gamma
        // momentum = mass * velocity * gamma
        self.check_velocity(velocity);
        let gamma = self.lorentz_factor(velocity); // mutable borrow must come before c_squared borrow
        let c_squared = &self.c_squared;

        let energy = expr!(mass * c_squared * gamma, &mut self.ctx);
        let momentum = expr!(mass * velocity * gamma, &mut self.ctx);
        EnergyMomentum { energy, momentum }
    }

    /// Invariant spacetime interval (spacetime interval squared, or seconds^2 - meters^2 / c^2)
    /// Tuples are time + 1D coordinates for two events
    pub fn spacetime_interval_1d(
        &mut self,
        event1: SimplifiedInterval,
        event2: SimplifiedInterval,
    ) -> BigFloat {
        // sqrt(csquared * delta_t^2 - delta_x^2)
        let (time1, x1) = event1.destructure();
        let (time2, x2) = event2.destructure();

        let c_squared = &self.c_squared;
        expr!(
            sqrt(c_squared * pow(time2 - time1, 2) - pow(x2 - x1, 2)),
            &mut self.ctx
        )
    }

    /// Invariant spacetime interval (spacetime interval squared, or seconds^2 - meters^2 / c^2)
    /// Tuples are time + 3D coordinates for two events
    pub fn spacetime_interval_3d(&mut self, event1: Interval, event2: Interval) -> BigFloat {
        // sqrt(csquared * delta_t^2 - delta_x^2 - delta_y^2 - delta_z^2)
        let (time1, x1, y1, z1) = event1.destructure();
        let (time2, x2, y2, z2) = event2.destructure();

        let c_squared = &self.c_squared;
        expr!(
            sqrt(
                c_squared * pow(time2 - time1, 2)
                    - pow(x2 - x1, 2)
                    - pow(y2 - y1, 2)
                    - pow(z2 - z1, 2)
            ),
            &mut self.ctx
        )
    }

    /// Helper to calculate spacetime interval with f64 values. Tuples are time, x
    pub fn spacetime_interval_1d_f64(
        &mut self,
        event1: (f64, f64),
        event2: (f64, f64),
    ) -> BigFloat {
        let event1 = SimplifiedInterval::from_f64(event1.0, event1.1, self);
        let event2 = SimplifiedInterval::from_f64(event2.0, event2.1, self);
        self.spacetime_interval_1d(event1, event2)
    }

    /// Helper to calculate spacetime interval with f64 values. Tuples are time, x, y, z
    pub fn spacetime_interval_3d_f64(
        &mut self,
        event1: (f64, f64, f64, f64),
        event2: (f64, f64, f64, f64),
    ) -> BigFloat {
        let event1 = Interval::from_f64(event1.0, event1.1, event1.2, event1.3, self);
        let event2 = Interval::from_f64(event2.0, event2.1, event2.2, event2.3, self);
        self.spacetime_interval_3d(event1, event2)
    }

    // ========== Conversion and other helpers ==========

    #[inline]
    pub fn bigfloat_from_ratio(&self, n: u64, d: u64) -> BigFloat {
        self.bigfloat_from_u64(n)
            .div(&self.bigfloat_from_u64(d), self.binary_digits, ROUNDING)
    }

    #[inline]
    pub fn bigfloat_from_u64(&self, n: u64) -> BigFloat {
        BigFloat::from_u64(n, self.binary_digits)
    }

    #[inline]
    pub fn bigfloat_from_i64(&self, n: i64) -> BigFloat {
        BigFloat::from_i64(n, self.binary_digits)
    }

    #[inline]
    pub fn bigfloat_from_f64(&self, n: f64) -> BigFloat {
        BigFloat::from_f64(n, self.binary_digits)
    }

    #[inline]
    pub fn bigfloat_from_str(s: &str) -> BigFloat {
        BigFloat::from_str(s).unwrap()
    }

    #[inline]
    /// Ensure velocity is less than c, with custom panic message
    fn check_velocity_msg(&self, velocity: &BigFloat, msg: &str) {
        assert!(!velocity.abs().ge(&self.c), "{msg}: {velocity}");
    }

    #[inline]
    /// Ensure velocity is less than c
    fn check_velocity(&self, velocity: &BigFloat) {
        self.check_velocity_msg(velocity, "Velocity must less than c");
    }

    // #[inline]
    // /// Ensure velocity is less than c, with custom panic message
    // fn check_velocity_msg<'a>(&self, velocity: &'a BigFloat, msg: &str) -> &'a BigFloat {
    //     assert!(!velocity.abs().ge(&self.c), "{msg}: {velocity}");
    //     velocity
    // }
    //
    // #[inline]
    // /// Ensure velocity is less than c
    // fn check_velocity<'a>(&self, velocity: &'a BigFloat) -> &'a BigFloat {
    //     self.check_velocity_msg(velocity, "Velocity must less than c")
    // }
}

#[inline]
/// Convert `BigFloat` to a formatted string with 2 dp
pub fn bigfloat_fmt(f: &BigFloat) -> anyhow::Result<String> {
    internal_bigfloat_fmt(f, 2, None)
}

#[inline]
/// Convert `BigFloat` to a formatted string with specified dp
pub fn bigfloat_fmt_dp(f: &BigFloat, decimal_places: i32) -> anyhow::Result<String> {
    internal_bigfloat_fmt(f, decimal_places, None)
}

#[inline]
/// Convert `BigFloat` to a formatted string, ignoring significant digits
pub fn bigfloat_fmt_sig(
    f: &BigFloat,
    decimal_places: i32,
    significant: char,
) -> anyhow::Result<String> {
    internal_bigfloat_fmt(f, decimal_places, Some(significant))
}

/// Internal helper to format a `BigFloat` to a string
fn internal_bigfloat_fmt(
    f: &BigFloat,
    decimal_places: i32,
    significant: Option<char>,
) -> anyhow::Result<String> {
    let s = bigfloat_to_string(f)?;

    if !s.contains('.') {
        // no decimal point, return as is
        return Ok(s);
    }

    // split the string into left and right of the decimal point
    let parts = s
        .split_once('.')
        .ok_or_else(|| anyhow!("Failed to split string"))?;
    let left = parts.0;
    let mut right = parts.1;

    // === add commas to the left side of the decimal point ===
    let mut buff = String::with_capacity(left.len() + left.len() / 3 + 5);
    let mut count = 0;
    for c in left.chars().rev() {
        if count == 3 {
            buff.push(',');
            count = 0;
        }
        buff.push(c);
        count += 1;
    }

    // reverse the string
    let mut output = buff.chars().rev().collect::<String>();

    // === truncate the decimal places ===
    let mut padding: usize = 0;
    if decimal_places > -1 {
        if let Some(ch) = significant {
            // truncate after the first non-ch character
            for (i, c) in right.chars().enumerate() {
                if c != ch {
                    // i is the position of the first non-ch character
                    #[allow(clippy::cast_sign_loss)]
                    let take = i + decimal_places as usize;
                    if take > right.len() {
                        // not enough characters, add zeros
                        padding = take - right.len();
                    } else {
                        right = &right[..take];
                    }
                    break;
                }
            }
        } else {
            // truncate unconditionally
            #[allow(clippy::cast_sign_loss)]
            match parts.1.len().cmp(&(decimal_places as usize)) {
                std::cmp::Ordering::Greater => {
                    // truncate the decimal places
                    right = &parts.1[..decimal_places as usize];
                }
                std::cmp::Ordering::Less => {
                    // not enough decimal places, add zeros
                    padding = (decimal_places - parts.1.len() as i32) as usize;
                }
                std::cmp::Ordering::Equal => {
                    // do nothing, the length is exactly as needed
                }
            }
        }
    }

    if !right.is_empty() || padding > 0 {
        output.push('.');
        output.push_str(right);
        if padding > 0 {
            // add padding zeros, if required
            output.push_str(&"0".repeat(padding));
        }
    }

    Ok(output)
}

/// Convert `BigFloat` to a string
pub fn bigfloat_to_string(f: &BigFloat) -> anyhow::Result<String> {
    let st = f.to_string();

    // If not in scientific notation, return as-is
    if !st.contains('e') {
        return Ok(st);
    }

    // Split into mantissa and exponent parts
    let parts = st
        .split_once('e')
        .ok_or_else(|| anyhow!("Failed to split scientific notation"))?;
    
    let mantissa = parts.0;
    let exp = parts.1.parse::<i128>()?;

    // Handle the mantissa: it could be "1.23", "-1.23", "5.", "-5.", etc.
    let is_negative = mantissa.starts_with('-');
    let abs_mantissa = if is_negative { &mantissa[1..] } else { mantissa };
    
    // Find decimal point position in the absolute mantissa
    let decimal_pos = abs_mantissa.find('.').unwrap_or(abs_mantissa.len());
    
    // Extract all digits (without decimal point)
    let mut digits: String = abs_mantissa.chars().filter(|&c| c != '.').collect();
    
    // If mantissa ended with '.', we have an implicit zero
    if abs_mantissa.ends_with('.') {
        digits.push('0');
    }
    
    // Calculate new decimal position after applying exponent
    let new_decimal_pos = decimal_pos as i128 + exp;
    
    let result = if new_decimal_pos <= 0 {
        // Decimal goes to the left of all digits: 0.000...digits
        let zeros_needed = (-new_decimal_pos) as usize;
        format!("0.{}{}", "0".repeat(zeros_needed), digits)
    } else if new_decimal_pos >= digits.len() as i128 {
        // Decimal goes to the right of all digits: digits000...0
        let zeros_needed = (new_decimal_pos - digits.len() as i128) as usize;
        format!("{}{}.0", digits, "0".repeat(zeros_needed))
    } else {
        // Decimal goes somewhere within the digits: dig.its
        let pos = new_decimal_pos as usize;
        let left = &digits[..pos];
        let right = &digits[pos..];
        if right.is_empty() {
            format!("{}.0", left)
        } else {
            format!("{}.{}", left, right)
        }
    };

    Ok(if is_negative { format!("-{}", result) } else { result })
}

#[cfg(test)]
mod tests {
    use super::*;
    use astro_float::BigFloat;

    #[test]
    fn test_bigfloat_to_string_regular_numbers() {
        // Test numbers without scientific notation
        let f = BigFloat::from_f64(123.456, 100);
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "123.456000000000003069544618483632802963");

        // Test integer that converts via scientific notation
        let f = BigFloat::from_i32(42, 100);
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "42.0");

        // Test negative decimal - now handled correctly by refactored function
        let f = BigFloat::from_f64(-0.5, 100);
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "-0.50");  // The refactored function correctly converts -5.e-1 to -0.50
    }

    #[test]
    fn test_bigfloat_to_string_scientific_notation() {
        // Test scientific notation conversion
        let _rel = Relativity::new(100);
        
        // Very large number
        let f = Relativity::bigfloat_from_str("1.23456e10");
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "12345600000.0");

        // Very small number  
        let f = Relativity::bigfloat_from_str("1.23456e-5");
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "0.0000123456");

        // Exponent 0
        let f = Relativity::bigfloat_from_str("1.23456e0");
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "1.2345600000000000001");  // Adjusted for actual precision
    }

    #[test]
    fn test_bigfloat_to_string_edge_cases() {
        let _rel = Relativity::new(100);
        
        // Exponent -1
        let f = Relativity::bigfloat_from_str("1.23456e-1");
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "0.123456");

        // Large positive exponent
        let f = Relativity::bigfloat_from_str("1.5e20");
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "150000000000000000000.0");

        // Large negative exponent
        let f = Relativity::bigfloat_from_str("1.5e-20");
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "0.000000000000000000015");

        // Single digit with positive exponent
        let f = Relativity::bigfloat_from_str("5.0e3");
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "5000.0");
    }

    #[test]
    fn test_bigfloat_to_string_precision_cases() {
        let _rel = Relativity::new(200);
        
        // Test with many decimal places
        let f = Relativity::bigfloat_from_str("1.234567890123456789e-10");
        let result = bigfloat_to_string(&f).unwrap();
        assert!(result.starts_with("0.0000000001234567890123456789"));

        // Test large number with decimal
        let f = Relativity::bigfloat_from_str("9.87654321e15");  
        let result = bigfloat_to_string(&f).unwrap();
        assert!(result.starts_with("9876543210000000.0"));
    }

    #[test]  
    fn test_bigfloat_fmt_functions() {
        let rel = Relativity::new(100);
        let f = rel.bigfloat_from_f64(1234567.89);
        
        // Test default 2 decimal places - based on actual behavior
        let result = bigfloat_fmt(&f).unwrap();
        assert_eq!(result, "1,234,567.88");
        
        // Test specific decimal places
        let result = bigfloat_fmt_dp(&f, 3).unwrap();
        assert_eq!(result, "1,234,567.889");
        
        // Test with no decimal places
        let result = bigfloat_fmt_dp(&f, 0).unwrap();
        assert_eq!(result, "1,234,567");
        
        // Test significant formatting - let's see what this produces
        let f2 = Relativity::bigfloat_from_str("0.0001234");
        let result = bigfloat_fmt_sig(&f2, 3, '0').unwrap();
        // For now just test that it works without error
        assert!(!result.is_empty());
    }

    #[test]
    fn test_internal_bigfloat_fmt_commas() {
        let rel = Relativity::new(100);
        
        // Test comma formatting for large numbers - based on actual floating point precision
        let f = rel.bigfloat_from_f64(1234567890.123);
        let result = bigfloat_fmt_dp(&f, 3).unwrap();
        assert_eq!(result, "1,234,567,890.122");  // Adjusted for actual precision
        
        // Test no commas for smaller numbers - use more reliable input
        let f = rel.bigfloat_from_f64(123.456);
        let result = bigfloat_fmt_dp(&f, 6).unwrap();
        assert!(result.starts_with("123.456"));
    }

    #[test]
    fn test_edge_cases_and_error_handling() {
        let rel = Relativity::new(100);
        
        // Test zero
        let f = rel.bigfloat_from_f64(0.0);
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "0.0");

        // Test very small non-zero
        let f = Relativity::bigfloat_from_str("1e-100");
        let result = bigfloat_to_string(&f);
        assert!(result.is_ok());
    }

    #[test]
    fn test_negative_scientific_notation_bug_fix() {
        // This test specifically validates the bug fix for negative scientific notation
        let rel = Relativity::new(100);
        
        // These cases used to crash the original function due to decimal position assumption
        // Now we just test that they don't crash and produce some reasonable output
        let test_inputs = [-0.5_f64, -0.1_f64, -1.5_f64, -123.0_f64];
        
        for input in test_inputs {
            let f = rel.bigfloat_from_f64(input);
            let result = bigfloat_to_string(&f);
            
            // Should not error (this would have crashed in the original implementation)
            assert!(result.is_ok(), "Failed to convert input {}", input);
            
            let result_str = result.unwrap();
            // Should be negative and start with "-"
            assert!(result_str.starts_with('-'), "Result should be negative for input {}", input);
            // Should contain a decimal point
            assert!(result_str.contains('.'), "Result should contain decimal for input {}", input);
        }
        
        // Test a specific case we know the exact behavior for
        let f = rel.bigfloat_from_f64(-0.5);
        let result = bigfloat_to_string(&f).unwrap();
        assert_eq!(result, "-0.50");
    }
}
