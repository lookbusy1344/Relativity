//#![allow(unused_imports)]
#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unreachable_code)]

// Using strongly typed structs for special relativity calculations
// based on the uom crate for type-safe units of measure
// these all use f64 (double) hardware floats, so are fast but lack accuracy

mod tools;

use tools::{
    FractionOfC, LorentzFactor, Rapidity, STANDARD_GRAVITY, add_velocities_using_rapidity,
    add_velocities2, add_velocities3, non_relativistic_acceleration, relativistic_acceleration,
};
use uom::si::SI;
use uom::si::acceleration::{Acceleration, meter_per_second_squared};
use uom::si::f64::{Length, Velocity};
use uom::si::length::meter;
use uom::si::time::{Time, day, second};
use uom::si::velocity::{meter_per_second, mile_per_hour};

fn main() {
    // its sometimes necessary to specify the type of the unit, eg Time<Un, _>
    type Un = SI<f64>;

    // create a 1G acceleration and a 1 year time period
    let one_g: Acceleration<Un, _> =
        Acceleration::new::<meter_per_second_squared>(STANDARD_GRAVITY);
    let one_year: Time<Un, _> = Time::new::<day>(365.0);

    // 1 year at 1g, both relativistic and non-relativistic
    let final_velocity = relativistic_acceleration(one_g, one_year);
    let naively = non_relativistic_acceleration(one_g, one_year);

    // as a fraction of c
    let as_fraction = FractionOfC::from_velocity(final_velocity, true);
    let naive_as_fraction = FractionOfC::from_velocity(naively, false);
    println!("Velocity after 1 year at 1G is {as_fraction}");
    println!("Non-relativistic naive calc would be {naive_as_fraction}");

    let acc = Acceleration::new::<meter_per_second_squared>(9.8);
    let time = Time::new::<second>(10.0);
    let vel = relativistic_acceleration(acc, time);

    let lorentz = tools::LorentzFactor::from_fraction_of_c(FractionOfC::new(0.9, true));
    let length = lorentz
        .length_contraction(Length::new::<meter>(1.0))
        .get::<meter>();
    let time = lorentz
        .time_dilation(Time::new::<second>(1.0))
        .get::<second>();
    println!("Length contraction: {length} m, time dilation: {time} s");

    let initial_vel = Velocity::new::<meter_per_second>(0.0);

    println!("Calculated velocity: {} m/s", vel.get::<meter_per_second>());
    println!("Calculated velocity: {} mph", vel.get::<mile_per_hour>());

    let vel2 = FractionOfC::get_velocity(0.9);
    let v1 = add_velocities_using_rapidity(vel2, vel2);
    let v2 = add_velocities2(vel2, vel2);
    let v3 = add_velocities3(vel2, vel2);

    let x1 = v1.get::<meter_per_second>();
    let x2 = v2.get::<meter_per_second>();
    let x3 = v3.get::<meter_per_second>();
    println!("Calculated velocity: {x1} m/s");
    println!("Calculated velocity: {x2} m/s");
    println!("Calculated velocity: {x3} m/s");

    // doubling velocity using rapidity

    // 90% c
    let fast = FractionOfC::new(0.9, true);
    // get lorentz factor and rapidity
    let lorentz = LorentzFactor::from_fraction_of_c(fast);
    let rapidity = Rapidity::from_fraction_of_c(fast);
    // double the rapidity
    let doubled = rapidity + rapidity;
    // convert back to velocity
    let doubled_vel = doubled.to_velocity();
    // turn into m/s and display
    let orig_ms = fast.as_velocity().get::<meter_per_second>();
    let vel_ms = doubled_vel.get::<meter_per_second>();
    println!("Fraction of c {fast}");
    println!("Velocity {orig_ms} m/s, doubled {vel_ms} m/s");
}
