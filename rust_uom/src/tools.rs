//#![allow(unused_imports)]
//#![allow(dead_code)]
//#![allow(unused_variables)]
//#![allow(unreachable_code)]

// Strongly typed structs for special relativity calculations
// based on the uom crate for type-safe units of measure
// these all use f64 (double) hardware floats, so are fast but lack accuracy

// LorentzFactor = wrapped f64 representing the Lorentz factor
// FractionOfC = wrapped f64 representing a fraction of the speed of light (less that 1.0)
// Rapidity = wrapped f64 representing the rapidity of an object, which allows easier calculations than velocity

use std::ops::Add;
use uom::si::acceleration::meter_per_second_squared;
use uom::si::energy::joule;
use uom::si::f64::{Acceleration, Energy, Length, Mass, Time, Velocity};
use uom::si::mass::kilogram;
use uom::si::time::second;
use uom::si::velocity::meter_per_second;

pub const C_MPS: f64 = 299_792_458.0;
pub const C_SQUARED: f64 = C_MPS * C_MPS;
pub const STANDARD_GRAVITY: f64 = 9.80665;

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
/// Lorentz factor, 1 or greater, calculated from 1 / sqrt(1 - v^2/c^2)
pub struct LorentzFactor {
    value: f64,
}

impl LorentzFactor {
    pub fn new(v: f64) -> Self {
        LorentzFactor { value: v }
    }

    /// Get the value of the Lorentz factor
    pub fn get(self) -> f64 {
        self.value
    }

    /// Create a new `LorentzFactor` from a `FractionOfC`
    pub fn from_fraction_of_c(f: FractionOfC) -> Self {
        LorentzFactor {
            value: 1_f64 / (1_f64 - f.get().powi(2)).sqrt(),
        }
    }

    /// Create a new `LorentzFactor` from a rapidity
    pub fn from_rapidity(r: Rapidity) -> Self {
        Self::from_fraction_of_c(FractionOfC::from_rapidity(r))
    }

    /// Create a new `LorentzFactor` from a velocity
    pub fn from_velocity(v: Velocity) -> Self {
        LorentzFactor {
            value: 1_f64
                / (1_f64 - (validate_velocity(v).get::<meter_per_second>() / C_MPS).powi(2)).sqrt(),
        }
    }

    /// Calculate length contraction from a proper length
    pub fn length_contraction(self, proper_length: Length) -> Length {
        proper_length / self.value
    }

    /// Calculate the time dilation from a proper time
    pub fn time_dilation(self, proper_time: Time) -> Time {
        proper_time * self.value
    }

    /// Calculate the relativistic mass from a rest mass
    pub fn relativistic_mass(self, rest_mass: Mass) -> Mass {
        rest_mass * self.value
    }

    /// Calculate the relativistic energy from a rest mass
    pub fn relativistic_energy(self, rest_mass: Mass) -> Energy {
        Energy::new::<joule>(rest_mass.get::<kilogram>() * C_SQUARED * self.value)
    }
}

impl std::fmt::Display for LorentzFactor {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:.6}", self.value)
    }
}

// =================================================================================================

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
// FractionOfC represents a fraction of the speed of light
pub struct FractionOfC {
    value: f64,
}

impl FractionOfC {
    pub fn new(fraction: f64, check_c: bool) -> Self {
        if !check_c || fraction.abs() < 1_f64 {
            FractionOfC { value: fraction }
        } else {
            panic!("Fraction of C must be less than 1")
        }
    }

    /// Helper to turn a fraction of C into a velocity
    pub fn get_velocity(fraction: f64) -> Velocity {
        Self::new(fraction, true).as_velocity()
    }

    /// Get the value of the fraction
    pub fn get(self) -> f64 {
        self.value
    }

    /// Convert the fraction to a velocity
    pub fn as_velocity(self) -> Velocity {
        Velocity::new::<meter_per_second>(self.value * C_MPS)
    }

    /// Create a new `FractionOfC` from a velocity, optionally checking that the velocity is less than the speed of light
    pub fn from_velocity(v: Velocity, check_c: bool) -> Self {
        if check_c {
            FractionOfC {
                value: validate_velocity(v).get::<meter_per_second>() / C_MPS,
            }
        } else {
            FractionOfC {
                value: v.get::<meter_per_second>() / C_MPS,
            }
        }
    }

    /// Create a new `FractionOfC` from a rapidity
    pub fn from_rapidity(r: Rapidity) -> Self {
        FractionOfC {
            value: r.get().tanh(),
        }
    }
}

impl std::fmt::Display for FractionOfC {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:.6}", self.value)
    }
}

// =================================================================================================

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
/// Special relativity rapidity, a measure of the hyperbolic angle between the velocity and the speed of light
pub struct Rapidity {
    value: f64,
}

impl Rapidity {
    pub fn new(v: f64) -> Self {
        Rapidity { value: v }
    }

    /// Get the value of the rapidity
    pub fn get(self) -> f64 {
        self.value
    }

    /// Convert the rapidity to a velocity
    pub fn to_velocity(self) -> Velocity {
        Velocity::new::<meter_per_second>(C_MPS * self.value.tanh())
    }

    /// Create a new `Rapidity` from a velocity
    pub fn from_velocity(v: Velocity) -> Self {
        Rapidity {
            value: (validate_velocity(v).get::<meter_per_second>() / C_MPS).atanh(),
        }
    }

    /// Create a new `Rapidity` from an acceleration and a time
    pub fn from_acc_and_time(acc: Acceleration, time: Time) -> Self {
        Rapidity {
            value: acc.get::<meter_per_second_squared>() * time.get::<second>() / C_MPS,
        }
    }

    /// Create a new `Rapidity` from a fraction of C
    pub fn from_fraction_of_c(f: FractionOfC) -> Self {
        Rapidity {
            value: f.get().atanh(),
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
pub fn validate_velocity_result(v: Velocity) -> anyhow::Result<Velocity> {
    if v.get::<meter_per_second>().abs() < C_MPS {
        Ok(v)
    } else {
        Err(anyhow::anyhow!(
            "Speed is greater than or equal to the speed of light"
        ))
    }
}

#[inline]
/// Check the velocity is less than the speed of light, panicking if it is not
pub fn validate_velocity(v: Velocity) -> Velocity {
    validate_velocity_result(v).unwrap()
}

/// Naive velocity calculation from acceleration and time
pub fn non_relativistic_acceleration(acc: Acceleration, time: Time) -> Velocity {
    acc * time
}

/// Calculate the relativistic velocity due to constant acceleration, from an acceleration and time
pub fn relativistic_acceleration(acc: Acceleration, time: Time) -> Velocity {
    Velocity::new::<meter_per_second>(
        C_MPS * ((acc.get::<meter_per_second_squared>() * time.get::<second>()) / C_MPS).tanh(),
    )
}

/// Calculate the relativistic velocity due to constant acceleration, as fraction of c
pub fn relativistic_acceleration_as_fraction(acc: Acceleration, time: Time) -> FractionOfC {
    let rapidity = Rapidity::from_acc_and_time(acc, time);
    FractionOfC::from_rapidity(rapidity)
}

/// Calculate the relativistic velocity due to constant acceleration, from an initial velocity, acceleration, and time
pub fn relativistic_acceleration_add(
    initial_vel: Velocity,
    acc: Acceleration,
    time: Time,
) -> Velocity {
    // Calculate the rapidity corresponding to the initial velocity
    let initial_rapidity = Rapidity::from_velocity(initial_vel);

    // Calculate the rapidity gained due to constant acceleration
    let acceleration_rapidity = Rapidity::from_acc_and_time(acc, time);

    // Add the two rapidities together to get the total rapidity
    let total_rapidity = initial_rapidity + acceleration_rapidity;

    total_rapidity.to_velocity()
}

/// Add two velocities together using rapidity
pub fn add_velocities_using_rapidity(v1: Velocity, v2: Velocity) -> Velocity {
    let rapidity1 = Rapidity::from_velocity(v1);
    let rapidity2 = Rapidity::from_velocity(v2);
    let total_rapidity = rapidity1 + rapidity2;

    total_rapidity.to_velocity()
}

/// Add two velocities together using fractions of the speed of light
pub fn add_velocities2(v1: Velocity, v2: Velocity) -> Velocity {
    let fraction1 = FractionOfC::from_velocity(v1, true);
    let fraction2 = FractionOfC::from_velocity(v2, true);

    Velocity::new::<meter_per_second>(
        C_MPS * (fraction1.get() + fraction2.get()) / (1_f64 + (fraction1.get() * fraction2.get())),
    )
}

/// Add two velocities together using the relativistic velocity addition formula
pub fn add_velocities3(v1: Velocity, v2: Velocity) -> Velocity {
    let u = validate_velocity(v1).get::<meter_per_second>();
    let v = validate_velocity(v2).get::<meter_per_second>();

    let resulting_velocity = (u + v) / (1_f64 + (u * v / C_SQUARED));
    Velocity::new::<meter_per_second>(resulting_velocity)
}
