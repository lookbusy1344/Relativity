# Notes for agents

## Version control (read first)

Before the first VCS command, run `jj --ignore-working-copy root`. This may be a jj repo on one machine and plain Git on another.

**IMPORTANT:** if it succeeds, use `jj` for all VCS commands, including `log`, `show`, `status` and `diff`. Do not run `git` on jj repos. The `gitStatus` snapshot in the session context is not a reason to use git.

jj has no commit hooks. Run the pre-commit checks before `jj commit`, `jj describe` (when finalising a change) and `jj squash`.
If a change touches only non-code files (`*.md`), skip the cargo steps.

## Privacy & Security
- No PII in commits — use placeholders (`your@email.com`, `YOUR_TEAM_ID`, etc.)
- Test files use synthetic/mock data only

See `jj-reference.md` in the repo root for details of Jujutsu usage

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

**Security:**
- Run `cargo audit` once a day when working on this project to check for security vulnerabilities in dependencies
