//#![allow(unused_imports)]
//#![allow(dead_code)]
//#![allow(unused_variables)]
//#![allow(unreachable_code)]

// UNFINISHED
// Strongly typed structs for special relativity calculations
// based on the uom crate for type-safe units of measure
// these all use BigRational for arbitrary precision, so are slow but accurate. Implementation is incomplete

use num_rational::BigRational;
use num_traits::{FromPrimitive, One, Signed, ToPrimitive, Zero};
use once_cell::sync::Lazy;
use std::ops::Add;
use uom::num::BigInt;
use uom::si::acceleration::meter_per_second_squared;
use uom::si::bigrational::{Acceleration, Energy, Length, Mass, Time, Velocity};
use uom::si::energy::joule;
use uom::si::mass::kilogram;
use uom::si::time::second;
use uom::si::velocity::meter_per_second;

const C_INT: u64 = 299_792_458;
//const STANDARD_GRAVITY: f64 = 9.80665;
const STANDARD_GRAVITY_NOM: u64 = 980_665; // 980,665 / 100000
const STANDARD_GRAVITY_DENOM: u64 = 100_000;

// lazy statics for the BigRational speed of light, c^2, and standard gravity
pub static C_BR: Lazy<BigRational> = Lazy::new(|| bigrational_from_int(C_INT));
pub static C_SQUARED_BR: Lazy<BigRational> = Lazy::new(|| &*C_BR * &*C_BR);
pub static STANDARD_GRAVITY_BR: Lazy<BigRational> =
    Lazy::new(|| bigrational_from_ratio(STANDARD_GRAVITY_NOM, STANDARD_GRAVITY_DENOM));

#[derive(Debug, Clone, PartialEq, PartialOrd)]
/// Lorentz factor, 1 or greater, calculated from 1 / sqrt(1 - v^2/c^2)
pub struct LorentzFactor {
    value: BigRational,
}

impl LorentzFactor {
    pub fn new(v: BigRational) -> Self {
        LorentzFactor { value: v }
    }

    /// Get the value of the Lorentz factor
    pub fn get(&self) -> &BigRational {
        &self.value
    }

    /// Get the value as an f64
    pub fn get_f64(&self) -> f64 {
        bigrational_to_f64(&self.value)
    }

    /// Create a new `LorentzFactor` from a `FractionOfC`
    pub fn from_fraction_of_c(config: &BigRationalConfig, f: &FractionOfC) -> Self {
        let v = BigRational::one() / (BigRational::one() - f.get().pow(2));
        LorentzFactor {
            value: config.sqrt(&v),
        }
    }

    /// Create a new `LorentzFactor` from a rapidity
    pub fn from_rapidity(config: &BigRationalConfig, r: &Rapidity) -> Self {
        Self::from_fraction_of_c(config, &FractionOfC::from_rapidity(config, r))
    }

    /// Create a new `LorentzFactor` from a velocity
    pub fn from_velocity(config: &BigRationalConfig, v: &Velocity) -> Self {
        let vel: BigRational = validate_velocity(v).get::<meter_per_second>();
        let vel_over_c = vel / &*C_BR;
        let one_minus = BigRational::one() - vel_over_c.pow(2);
        LorentzFactor {
            value: BigRational::one() / config.sqrt(&one_minus),
        }
    }

    /// Calculate length contraction from a proper length
    pub fn length_contraction(&self, proper_length: Length) -> Length {
        proper_length / self.value.clone()
    }

    /// Calculate the time dilation from a proper time
    pub fn time_dilation(&self, proper_time: Time) -> Time {
        proper_time * self.value.clone()
    }

    /// Calculate the relativistic mass from a rest mass
    pub fn relativistic_mass(&self, rest_mass: Mass) -> Mass {
        rest_mass * self.value.clone()
    }

    /// Calculate the relativistic energy from a rest mass
    pub fn relativistic_energy(&self, rest_mass: &Mass) -> Energy {
        Energy::new::<joule>(rest_mass.get::<kilogram>() * &*C_SQUARED_BR * &self.value)
    }
}

impl std::fmt::Display for LorentzFactor {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:.6}", self.value)
    }
}

// =================================================================================================

#[derive(Debug, Clone, PartialEq, PartialOrd)]
// FractionOfC represents a fraction of the speed of light
pub struct FractionOfC {
    value: BigRational,
}

impl FractionOfC {
    pub fn new(fraction: BigRational, check_c: bool) -> Self {
        if !check_c || fraction.abs() < BigRational::one() {
            FractionOfC { value: fraction }
        } else {
            panic!("Fraction of C must be less than 1")
        }
    }

    /// Helper to turn a fraction of C f64 into a velocity
    pub fn get_velocity_f64(fraction: f64) -> Velocity {
        Self::new(bigrational_from_f64(fraction), true).as_velocity()
    }

    /// Helper to turn a fraction of C into a velocity
    pub fn get_velocity(fraction: BigRational) -> Velocity {
        Self::new(fraction, true).as_velocity()
    }

    /// Get the value of the fraction
    pub fn get(&self) -> &BigRational {
        &self.value
    }

    /// Get the value as an f64
    pub fn get_f64(&self) -> f64 {
        bigrational_to_f64(&self.value)
    }

    /// Convert the fraction to a velocity
    pub fn as_velocity(&self) -> Velocity {
        Velocity::new::<meter_per_second>(&self.value * &*C_BR)
    }

    /// Create a new `FractionOfC` from a velocity, optionally checking that the velocity is less than the speed of light
    pub fn from_velocity(v: &Velocity, check_c: bool) -> Self {
        if check_c {
            FractionOfC {
                value: validate_velocity(v).get::<meter_per_second>() / &*C_BR,
            }
        } else {
            FractionOfC {
                value: v.get::<meter_per_second>() / &*C_BR,
            }
        }
    }

    /// Create a new `FractionOfC` from a rapidity
    pub fn from_rapidity(config: &BigRationalConfig, r: &Rapidity) -> Self {
        FractionOfC {
            value: config.tanh(r.get()),
        }
    }
}

impl std::fmt::Display for FractionOfC {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:.6}", self.value)
    }
}

// =================================================================================================

#[derive(Debug, Clone, PartialEq, PartialOrd)]
/// Special relativity rapidity, a measure of the hyperbolic angle between the velocity and the speed of light
pub struct Rapidity {
    value: BigRational,
}

impl Rapidity {
    pub fn new(v: BigRational) -> Self {
        Rapidity { value: v }
    }

    /// Get the value of the rapidity
    pub fn get(&self) -> &BigRational {
        &self.value
    }

    /// Get the value as an f64
    pub fn get_f64(&self) -> f64 {
        bigrational_to_f64(&self.value)
    }

    /// Convert the rapidity to a velocity
    pub fn to_velocity(&self, config: &BigRationalConfig) -> Velocity {
        Velocity::new::<meter_per_second>(&*C_BR * config.tanh(&self.value))
    }

    /// Create a new `Rapidity` from a velocity
    pub fn from_velocity(config: &BigRationalConfig, v: &Velocity) -> Self {
        Rapidity {
            value: config.atanh(&(validate_velocity(v).get::<meter_per_second>() / &*C_BR)),
        }
    }

    /// Create a new `Rapidity` from an acceleration and a time
    pub fn from_acc_and_time(acc: &Acceleration, time: &Time) -> Self {
        Rapidity {
            value: acc.get::<meter_per_second_squared>() * time.get::<second>() / &*C_BR,
        }
    }

    /// Create a new `Rapidity` from a fraction of C
    pub fn from_fraction_of_c(config: &BigRationalConfig, f: &FractionOfC) -> Self {
        Rapidity {
            value: config.atanh(f.get()),
        }
    }
}

impl Add for Rapidity {
    type Output = Self;

    #[inline]
    /// Add two rapidities together
    fn add(self, other: Self) -> Self {
        Rapidity {
            value: self.value + other.value,
        }
    }
}

impl std::fmt::Display for Rapidity {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:.6}", self.value)
    }
}

// =================================================================================================

#[inline]
/// Check the velocity is less than the speed of light
pub fn validate_velocity_result(v: &Velocity) -> anyhow::Result<&Velocity> {
    if v.get::<meter_per_second>().abs() < *C_BR {
        Ok(v)
    } else {
        Err(anyhow::anyhow!(
            "Speed is greater than or equal to the speed of light"
        ))
    }
}

#[inline]
/// Check the velocity is less than the speed of light, panicking if it is not
pub fn validate_velocity(v: &Velocity) -> &Velocity {
    validate_velocity_result(v).unwrap()
}

/// Naive velocity calculation from acceleration and time
pub fn non_relativistic_acceleration(acc: &Acceleration, time: &Time) -> Velocity {
    acc.clone() * time.clone()
}

/// Calculate the relativistic velocity due to constant acceleration, from an acceleration and time
pub fn relativistic_acceleration(
    config: &BigRationalConfig,
    acc: &Acceleration,
    time: &Time,
) -> Velocity {
    let a = (acc.get::<meter_per_second_squared>() * time.get::<second>()) / &*C_BR;
    Velocity::new::<meter_per_second>(&*C_BR * config.tanh(&a))
}

/// Calculate the relativistic velocity due to constant acceleration, as fraction of c
pub fn relativistic_acceleration_as_fraction(
    config: &BigRationalConfig,
    acc: &Acceleration,
    time: &Time,
) -> FractionOfC {
    let rapidity = Rapidity::from_acc_and_time(acc, time);
    FractionOfC::from_rapidity(config, &rapidity)
}

/// Calculate the relativistic velocity due to constant acceleration, from an initial velocity, acceleration, and time
pub fn relativistic_acceleration_add(
    config: &BigRationalConfig,
    initial_vel: &Velocity,
    acc: &Acceleration,
    time: &Time,
) -> Velocity {
    // Calculate the rapidity corresponding to the initial velocity
    let initial_rapidity = Rapidity::from_velocity(config, initial_vel);

    // Calculate the rapidity gained due to constant acceleration
    let acceleration_rapidity = Rapidity::from_acc_and_time(acc, time);

    // Add the two rapidities together to get the total rapidity
    let total_rapidity = initial_rapidity + acceleration_rapidity;

    total_rapidity.to_velocity(config)
}

/// Add two velocities together using rapidity
pub fn add_velocities_using_rapidity(
    config: &BigRationalConfig,
    v1: &Velocity,
    v2: &Velocity,
) -> Velocity {
    // *** VERY SLOW, rationals blow up in size ***
    let rapidity1 = Rapidity::from_velocity(config, v1);
    let rapidity2 = Rapidity::from_velocity(config, v2);
    let total_rapidity = rapidity1 + rapidity2;

    total_rapidity.to_velocity(config)
}

/// Add two velocities together using fractions of the speed of light
pub fn add_velocities2(v1: &Velocity, v2: &Velocity) -> Velocity {
    let fraction1 = FractionOfC::from_velocity(v1, true);
    let fraction2 = FractionOfC::from_velocity(v2, true);

    Velocity::new::<meter_per_second>(
        &*C_BR * (fraction1.get() + fraction2.get())
            / (BigRational::one() + (fraction1.get() * fraction2.get())),
    )
}

/// Add two velocities together using the relativistic velocity addition formula
pub fn add_velocities3(v1: &Velocity, v2: &Velocity) -> Velocity {
    let u = validate_velocity(v1).get::<meter_per_second>();
    let v = validate_velocity(v2).get::<meter_per_second>();
    let added = u.clone() + v.clone();

    let resulting_velocity = added / (BigRational::one() + (u * v / &*C_SQUARED_BR));
    Velocity::new::<meter_per_second>(resulting_velocity)
}

// ========== Conversion functions ==========

#[inline]
/// Convert a f64 to a `BigRational`
pub fn bigrational_from_f64(n: f64) -> BigRational {
    BigRational::from_f64(n).unwrap()
}

#[inline]
/// Convert any integer to a `BigRational`, by using x/1
pub fn bigrational_from_int(n: impl Into<BigInt>) -> BigRational {
    BigRational::from_integer(n.into())
}

#[inline]
/// Convert int ratios to a `BigRational`, eg 1/3
pub fn bigrational_from_ratio<N, D>(n: N, d: D) -> BigRational
where
    N: Into<BigInt>,
    D: Into<BigInt>,
{
    BigRational::new(n.into(), d.into())
}

#[inline]
/// Convert a `BigRational` to an f64
pub fn bigrational_to_f64(n: &BigRational) -> f64 {
    n.to_f64().unwrap()
}

// =================================================================================================

pub struct BigRationalConfig {
    pub max_iterations: u32,
    pub precision: u32,
}

impl BigRationalConfig {
    /// Setup a new config object
    pub fn new() -> Self {
        BigRationalConfig {
            max_iterations: 500,
            precision: 100,
        }
    }

    /// Setup with specified precision
    pub fn new_with_precision(precision: u32) -> Self {
        BigRationalConfig {
            max_iterations: 500,
            precision,
        }
    }

    // See https://github.com/AdamWhiteHat/BigRational/blob/master/BigRational/Fraction.cs

    /// Calculate the exponential of a `BigRational` using the Taylor series with a maximum number of iterations
    fn exp(&self, x: &BigRational) -> BigRational {
        let mut sum = BigRational::from_integer(1.into());
        let mut term = BigRational::from_integer(1.into());
        let eps = BigRational::new(BigInt::one(), BigInt::from(10).pow(self.precision));

        for i in 1..self.max_iterations {
            term = term * x / BigRational::from_integer(i.into());
            sum += term.clone();
            if term.abs() < eps {
                break;
            }
        }
        sum
    }

    /// Convert a `BigRational` to a decimal string with a specified number of digits after the decimal.
    /// This approach avoids floating-point conversion and relies on `BigInt` arithmetic.
    pub fn to_decimal_string(r: &BigRational, display_precision: u32) -> String {
        // Handle sign first, and work with absolute value for fractional manipulation.
        let sign_str = if r.is_negative() { "-" } else { "" };
        let abs_value = r.abs();

        // Extract integer and fraction parts (abs_value = integer_part + fraction_part).
        let integer_part = abs_value.to_integer(); // BigInt
        let fraction_part = &abs_value - BigRational::from_integer(integer_part.clone());

        // If no decimal digits requested, just return integer_part (with sign).
        if display_precision == 0 {
            return format!("{sign_str}{integer_part}");
        }

        // Scale fraction_part by 10^decimal_digits.
        // fraction_part * 10^digits -> (scaled_numer / scaled_denom)
        let scale = BigInt::from(10).pow(display_precision);
        let scaled_fraction = fraction_part * BigRational::from_integer(scale.clone());
        let scaled_numer = scaled_fraction.numer();
        let scaled_denom = scaled_fraction.denom();

        // Integer division to get quotient and remainder for rounding.
        let quotient = scaled_numer / scaled_denom;
        let remainder = scaled_numer % scaled_denom;

        // Round if remainder * 2 >= scaled_denom.
        let mut fraction_digits = quotient;
        if remainder * 2 >= *scaled_denom {
            fraction_digits += 1;
        }

        // Convert fraction_digits to string; it might need left-padding with zeroes.
        let mut fraction_str = fraction_digits.to_string();
        if fraction_str.len() < display_precision as usize {
            let pad_zeros = display_precision as usize - fraction_str.len();
            fraction_str = format!("{}{}", "0".repeat(pad_zeros), fraction_str);
        }

        // Construct final string: sign + integer_part + '.' + fraction_str
        format!(
            "{}{}.{}",
            sign_str,
            integer_part,
            &fraction_str[..display_precision as usize]
        )
    }

    /// Square root of a `BigRational` using the Newton-Raphson method with a tolerance level
    pub fn sqrt(&self, n: &BigRational) -> BigRational {
        if n.is_zero() {
            return BigRational::zero();
        }

        let two = BigRational::new(BigInt::from(2), BigInt::one());
        let mut x = n.clone();
        let mut last_x = BigRational::zero();
        let tolerance = BigRational::new(BigInt::one(), BigInt::from(10).pow(self.precision));
        let mut c = 0;

        while c < self.max_iterations && (&x - &last_x).abs() > tolerance {
            last_x = x.clone();
            x = (&x + n / &x) / &two;
            c += 1;
        }

        x
    }

    /// Calculate the hyperbolic tangent of a `BigRational` with a maximum of 100 iterations
    pub fn tanh(&self, x: &BigRational) -> BigRational {
        // For large values, return ±1
        if x.abs() > BigRational::from_integer(20.into()) {
            return if x.is_positive() {
                BigRational::from_integer(1.into())
            } else {
                BigRational::from_integer((-1).into())
            };
        }

        let two = BigRational::from_integer(2.into());
        let exp_x = self.exp(&(two.clone() * x));
        let one = BigRational::from_integer(1.into());

        // tanh(x) = (e^(2x) - 1)/(e^(2x) + 1)
        (exp_x.clone() - one.clone()) / (exp_x + one)
    }

    /// Calculate the hyperbolic arctangent of a `BigRational` with a maximum of 100 iterations
    pub fn atanh(&self, x: &BigRational) -> BigRational {
        // Check domain validity
        let one = BigRational::from_integer(1.into());
        assert!(x.abs() < one, "atanh(x) is only defined for |x| < 1");

        let eps = BigRational::new(BigInt::one(), BigInt::from(10).pow(self.precision));
        let mut result = BigRational::new(0.into(), 1.into());
        let mut term = x.clone();
        let x_squared = x * x;
        let mut n_power = x.clone();

        // Taylor series: x + x³/3 + x⁵/5 + x⁷/7 + ...
        for n in 0..self.max_iterations {
            result += term.clone();

            n_power *= &x_squared;
            term = n_power.clone() / BigRational::from_integer((2 * n + 3).into());

            if term.abs() < eps {
                break;
            }
        }

        result
    }
}

// ========== Math functions unsupported on BigRational ==========

// Square root of a BigRational by converting to a f64. Bodge for now
// pub fn bigrational_squareroot_f64(n: &BigRational) -> BigRational {
//     let v = bigrational_to_f64(n).sqrt();
//     bigrational_from_f64(v)
// }

// Calculate the hyperbolic tangent of a BigRational, bodge using f64
// pub fn bigrational_tanh_f64(n: &BigRational) -> BigRational {
//     let n = bigrational_to_f64(n);
//     bigrational_from_f64(n.tanh())
// }

// Calculate the hyperbolic arctangent of a BigRational, bodge using f64
// pub fn bigrational_atanh_f64(n: &BigRational) -> BigRational {
//     let n = bigrational_to_f64(n);
//     bigrational_from_f64(n.atanh())
// }
