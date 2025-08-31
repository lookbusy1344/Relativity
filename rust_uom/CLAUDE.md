# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `cargo build` - Compile the project
- **Build (release)**: `cargo build --release` - Optimized release build with aggressive optimizations (LTO, codegen-units=1, stripped)
- **Run**: `cargo run` - Run the main example demonstrating special relativity calculations
- **Check**: `cargo check` - Fast syntax and type checking without building
- **Lint**: `cargo clippy -- -D clippy::all -D clippy::pedantic` - Run Clippy with strict pedantic linting
- **Format**: `cargo fmt` - Format code using rustfmt (run after all code changes)

## Project Architecture

This is a Rust implementation of special relativity calculations using the `uom` (units of measure) crate for type safety. The project demonstrates high-performance physics calculations with strongly-typed units.

### Core Modules

- **`tools.rs`**: Main implementation with f64-based calculations for speed, containing:
  - `LorentzFactor`: Wrapper for Lorentz factor calculations (γ = 1/√(1-v²/c²))
  - `FractionOfC`: Represents velocity as fraction of speed of light (< 1.0)
  - `Rapidity`: Hyperbolic angle representation for easier relativistic velocity addition
  - Velocity addition functions using different approaches
  - Relativistic and non-relativistic acceleration calculations

- **`tools_rational.rs`**: Experimental BigRational implementation for arbitrary precision (incomplete/impractical due to size explosion)

- **`main.rs`**: Example usage demonstrating:
  - 1-year acceleration at 1G (relativistic vs non-relativistic)
  - Velocity addition using rapidity
  - Length contraction and time dilation effects
  - Converting between different velocity representations

### Key Dependencies

- `uom`: Units of measure with compile-time dimensional analysis
- `num-rational` & `num-traits`: For arbitrary precision arithmetic (experimental)
- `once_cell`: For lazy static initialization
- `anyhow`: Error handling

### Physics Constants

- Speed of light: `C_MPS = 299_792_458.0` m/s
- Standard gravity: `STANDARD_GRAVITY = 9.80665` m/s²

The codebase prioritizes performance (f64 hardware floats) over arbitrary precision, making it suitable for real-time physics simulations while maintaining type safety through the `uom` crate's dimensional analysis.