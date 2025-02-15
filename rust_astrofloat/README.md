# Special Relativity with Rust (astro-float)

This project is compiled and higher performance than the Python tools. The library is here

https://github.com/lookbusy1344/Relativity/blob/main/rust_astrofloat/src/astro_tools.rs

This uses `astrofloat` crate for arbitrary precision calculations. Functionally equivalent to the Python tools.

Note astro-float values are unweildy to work with directly (because of the required context), so the `expr!()` macro is used to simplify context handling in equations, eg instead of..

```rust
let result = a.mul(&b, &mut ctx).add(&c, &mut ctx).div(&d, &mut ctx);
```

..we can write..

```rust
let result = expr!((a * b + c) / d, &mut ctx);
```

## Example usage, flip-and-burn time for 4 light years at 1g

Showing how to calculate the time for a flip-and-burn maneuver to travel 4 light years at 1g acceleration.

See the project for more examples.

```rust
// flip-and-burn 4 light years at 1g

// Create a new Relativity struct with a precision of 300 decimal places
let mut rel = Relativity::new(300);

// initial parameters
let distance = rel.light_years(4.0); // 4 light years
let accel = rel.get_g().clone(); // 1g

// we will accelerate half way before beginning to decelerate
let half_way = expr!(distance / 2, &mut rel.ctx);

// calculate the time to travel half way
let time_half_way = rel.relativistic_time_for_distance(&accel, &half_way);

// calculate the peak velocity, rapidity and Lorentz factor
let peak_velocity = rel.relativistic_velocity(&accel, &time_half_way);
let peak_velocity_c = rel.velocity_as_c(&peak_velocity);
let peak_rapidity = rel.rapidity_from_velocity(&peak_velocity);
let peak_lorentz = rel.lorentz_factor(&peak_velocity);

// calculate the total time to travel 4 light years by doubling the half way time and converting to years
let time_total_years = expr!(time_half_way * 2 / 60 / 60 / 24 / 365.25, &mut rel.ctx);

// print the results
println!();
println!("Flip and burn 4 light years at 1g:");
println!("Distance = {} m", bigfloat_fmt_dp(&distance, 1).unwrap());
println!("Acceleration = {} m/s", bigfloat_fmt_dp(&accel, 4).unwrap());
println!(
    "Time half way = {} s",
    bigfloat_fmt_dp(&time_half_way, 2).unwrap()
);
println!(
    "Peak velocity = {} m/s",
    bigfloat_fmt_sig(&peak_velocity, 2, '9').unwrap()
);
println!(
    "Peak velocity = {} c",
    bigfloat_fmt_sig(&peak_velocity_c, 2, '9').unwrap()
);
println!(
    "Peak rapidity = {}",
    bigfloat_fmt_dp(&peak_rapidity, 5).unwrap()
);
println!(
    "Peak Lorentz factor = {}",
    bigfloat_fmt_dp(&peak_lorentz, 5).unwrap()
);
println!(
    "Total time = {} years",
    bigfloat_fmt_dp(&time_total_years, 2).unwrap()
);
```
