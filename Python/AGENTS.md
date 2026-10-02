# Project Overview

This is a Python project for special relativity calculations and educational content, featuring Jupyter notebooks and two main libraries for physics simulations. The project uses arbitrary precision mathematics via mpmath for high-precision relativistic calculations.

## Version control

Run `jj st` at the start of each session — this may be a jj repo on one machine
and plain Git on another.

**IMPORTANT:** if this is a jj repo, manage it with jj, not Git.

**jj repo (`jj st` succeeds):** use jj commands only. Do not run state-modifying
`git` commands (`commit`, `push`, `rebase`, `reset`, `branch`, …) without explicit
permission for that command. Read-only `git log`/`git status` are fine, but prefer
`jj log`/`jj st`. Push with `jj git push` — it forces with lease natively, so no
`git push --force`.

**Plain Git (`jj st` fails):** use normal `git` commands.

A `jj pmain` alias is configured: it sets the `main` bookmark to the parent of
the working copy and pushes it to GitHub. Use it instead of manually moving
the bookmark and running `jj git push` — but only with explicit permission,
same as any other push.

Confirm `jj --version` matches the version the book documents in
`src/hello-world/how-to-install.md` (currently 0.44.0). Flag any mismatch —
behaviour and prose may diverge.

See `jj-reference.md` in the repo root for details of Jujutsu usage

## Environment Setup

### UV Package Manager
This project uses UV for dependency management. Always use UV commands:

```bash
# Install dependencies
uv sync

# Run scripts
uv run "script_name.py"
uv run "Solar system.py"
```

### Python Version
Requires Python >=3.13 as specified in pyproject.toml.

### Key Dependencies
- mpmath: Arbitrary precision mathematics (core dependency)
- matplotlib: Plotting and visualization
- numpy/scipy: Numerical computations
- notebook/ipykernel: Jupyter notebook support

## Architecture

### Core Libraries

**relativity_lib.py** - Main special relativity library
- Uses mpmath for arbitrary precision calculations
- Must call `rl.configure(dps)` to set decimal precision before use (typically 100)
- Contains ~30 functions for relativistic calculations
- Global constants: g, c, light_year, au, etc. are configured dynamically
- Key functions: relativistic_velocity, relativistic_distance, flip_and_burn, add_velocities

**motion_lib.py** - Classical mechanics and orbital calculations  
- Uses numpy/scipy for numerical integration
- Functions for gravitational calculations, falling objects, orbital mechanics
- Constants: earth_radius, earth_mass, G (gravitational constant), c

### Project Structure

- **Jupyter Notebooks** (.ipynb): Educational content exploring special relativity concepts
  - Velocity adding.ipynb, Time dilation.ipynb, Universe.ipynb, Solar system.ipynb, etc.
- **Python Scripts** (.py): Test files and examples
  - IntervalTest.py, TrigTests.py, Falling.py, Solar system.py
- **Configuration**: pyproject.toml defines dependencies and project metadata

### Usage Patterns

1. **High-precision calculations**: Use relativity_lib with mpmath
   ```python
   import relativity_lib as rl
   rl.configure(100)  # 100 decimal places
   ```

2. **Classical mechanics**: Use motion_lib with standard float precision
   ```python
   import motion_lib as ml
   ```

3. **Running examples**: Use UV to execute scripts
   ```bash
   uv run "Solar system.py"
   ```

## Development Commands

```bash
# Sync dependencies
uv sync

# Run any Python script
uv run "script_name.py"

# Format code with ruff (MANDATORY after any changes)
uv run ruff format

# Run tests
uv run python -m unittest test_relativity_lib.py    # Test special relativity functions
uv run python -m unittest test_motion_lib.py        # Test ballistic/orbital mechanics
uv run python -m unittest discover                  # Run all unit tests
uv run IntervalTest.py                              # Legacy interval tests
uv run TrigTests.py                                 # Legacy trigonometry tests

# Start Jupyter notebook server (if needed)
uv run jupyter notebook
```

## Code Standards and Formatting

### **MANDATORY**: Always run `uv run ruff format` after making any code changes
- This command MUST be executed after every modification to Python files
- Ensures consistent code formatting across the entire project
- Never skip this step - it's required for all code contributions

### Line Endings
- **ALL .md and .py files MUST use LF (Unix) line endings**
- Ensure consistent line endings across the codebase
- This prevents git diff issues and maintains cross-platform compatibility

## Important Notes

- Always configure relativity_lib precision before calculations: `rl.configure(dps)`
- The project focuses on educational special relativity content
- mpmath enables calculations to hundreds of decimal places for demonstration purposes
- Test files demonstrate library functionality and verify calculations against other implementations
- **CRITICAL WORKFLOW**: After any code changes → run `uv run ruff format` → verify LF line endings
