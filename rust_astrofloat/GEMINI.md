# Project Overview

This is a high-precision special relativity calculation library written in Rust, using the `astro-float` crate for arbitrary precision arithmetic. The project provides relativistic physics calculations including Lorentz factors, relativistic velocities, time dilation, length contraction, and spacetime intervals.

## Common Development Commands

- **Build**: `cargo build`
- **Build optimized**: `cargo build --release`
- **Run**: `cargo run`
- **Test**: `cargo test`
- **Format**: `cargo fmt`
- **Lint**: `cargo clippy`

## Key Architecture Components

### Core Module Structure

- `src/main.rs`: Contains demonstration code showing various relativity calculations including:
  - Lorentz factor calculations for near-light speeds
  - Rapidity calculations and velocity transformations
  - Flip-and-burn maneuver calculations (4 light years at 1g)
  - Spacetime interval calculations
  
- `src/astro_tools.rs`: The main library containing the `Relativity` struct and all physics calculations

### Primary Data Structures

- **`Relativity`**: Main struct containing physics constants and context for arbitrary precision calculations
  - Uses `astro_float::BigFloat` for all calculations
  - Configurable precision (300 decimal digits by default)
  - Contains physical constants: c, g, light_year, AU, etc.

- **Support structs**:
  - `FlipAndBurnResult`: Results from flip-and-burn maneuver calculations
  - `SimplifiedInterval`/`Interval`: Spacetime event representations (1D/3D)
  - `EnergyMomentum`: Four-momentum calculations

### Expression Handling with `expr!()` Macro

The codebase heavily uses the `expr!()` macro from `astro-float` to simplify context handling in mathematical expressions:

```rust
// Instead of: a.mul(&b, &mut ctx).add(&c, &mut ctx).div(&d, &mut ctx)
let result = expr!((a * b + c) / d, &mut ctx);
```

### Key Physics Functions

- Relativistic velocity/time/distance calculations
- Lorentz factor and rapidity transformations
- Velocity addition using relativistic formula
- Four-momentum and invariant mass calculations
- Spacetime interval calculations (1D and 3D)
- Flip-and-burn maneuver modeling

### String Formatting Functions

The module provides specialized formatting functions for `BigFloat` values:
- `bigfloat_fmt()`: Default 2 decimal places
- `bigfloat_fmt_dp()`: Specified decimal places  
- `bigfloat_fmt_sig()`: Significant digit formatting
- `bigfloat_to_string()`: Scientific notation conversion

### Dependencies

- `astro-float`: Arbitrary precision floating point arithmetic (v0.9.4+)
- `anyhow`: Error handling (v1.0.95+)

## Development Notes

- All velocity calculations include bounds checking (velocity < c)
- The codebase uses Rust 2024 edition
- Release profile is optimized for size and performance (LTO, single codegen unit)
- Extensive unit tests in `src/astro_tools.rs` validate string conversion functions
- The project maintains compatibility with equivalent Python tools for cross-validation
- **IMPORTANT**: Always run `cargo fmt` after making code changes to ensure consistent formatting