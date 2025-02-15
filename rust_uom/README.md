# Special Relativity with Rust (units of measure)

This project is compiled and higher performance than the Python tools. The library is here

https://github.com/lookbusy1344/Relativity/blob/main/rust_uom/src/tools.rs

This uses `uom` crate for strongly typed units of measure. However, `f64` is used internally so the functions will lack precision of Python and `astro-float` projects.

## Example usage, doubling velocity using rapidity

See the project for more examples.

```rust
// doubling velocity using rapidity

// 90% of light speed
let fast = FractionOfC::new(0.9, true);

// get lorentz factor and rapidity
let lorentz = LorentzFactor::from_fraction_of_c(fast);
let rapidity = Rapidity::from_fraction_of_c(fast);

// double the rapidity, just add
let doubled = rapidity + rapidity;

// convert back to velocity
let doubled_vel = doubled.to_velocity();

// turn into m/s
let orig_ms = fast.as_velocity().get::<meter_per_second>();
let vel_ms = doubled_vel.get::<meter_per_second>();

// print results
println!("Fraction of c {fast}");
println!("Velocity {orig_ms} m/s, doubled {vel_ms} m/s");
```
