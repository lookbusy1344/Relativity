# Python Special Relativity tools

Python tools for Special Relativity, using `mpmath` for arbitrary precision calculations. A great place to start. Jupyter notebooks are included for playing with the tools.

This Python solution is the easiest to use of the 3 language implementations, but probably the slowest.

https://github.com/lookbusy1344/Relativity/blob/main/Python/Distance_time.ipynb

Library is here:

https://github.com/lookbusy1344/Relativity/blob/main/Python/relativity_lib.py

## Example usage, 1 year at 1g

```python
from relativity import rl

# configure for 100 decimal places
rl.configure(100)

# 1g acceleration for 1 year, calculate coordinate distance travelled
rel_distance = rl.relativistic_distance(rl.g, rl.seconds_per_year)

# simple distance travelled (non-relativistic)
sim_distance = rl.simple_distance(rl.g, rl.seconds_per_year)

# peak velocity
rel_velocity = rl.relativistic_velocity(rl.g, rl.seconds_per_year)

# simple peak velocity (non-relativistic)
# Note this may exceed the speed of light!
sim_velocity = rl.g * rl.seconds_per_year

print("1g acceleration for 1 year (proper time):")
print("Relativistic distance:", rl.format_mpf(rel_distance))
print("Simple distance      :", rl.format_mpf(sim_distance))
print("Difference           :", rl.format_mpf(rel_distance - sim_distance, 4))
print()
print("Peak velocity:")
print(
    f"Relativistic velocity: {rl.format_mpf(rel_velocity)}, c = {rl.format_mpf_significant(rel_velocity / rl.c, 4)}"
)
print(
    f"Simple velocity      : {rl.format_mpf(sim_velocity)}, c = {rl.format_mpf_significant(sim_velocity / rl.c, 4)}"
)

```

## Library functions

### configure(dps: int)
### relativistic_velocity(a, tau)
### relativistic_distance(a, tau)
### relativistic_time_for_distance(a, dist)
### simple_distance(a, t)
### rapidity_from_velocity(velocity)
### velocity_from_rapidity(rapidity)
### add_velocities(v1, v2)
### coordinate_time(a, tau)
### length_contraction_velocity(len, velocity)
### lorentz_factor(velocity)
### relativistic_velocity_coord(a0, t)
### relativistic_distance_coord(a0, t)
### relativistic_momentum(mass, velocity)
### relativistic_energy(mass, velocity)
### doppler_shift(frequency, velocity, source_moving_towards: bool = True)
### invariant_mass_from_energy_momentum(energy, p)
### four_momentum(mass, velocity) -> tuple
### invariant_interval_simplified(event1: tuple, event2: tuple)
### invariant_interval_3d(event1: tuple, event2: tuple)
### format_mpf(number, decimal_places: int = 2, allow_sci: bool = False) -> str:
### format_mpf_significant(number, significant_decimal_places: int = 2, ignore_char: str = "0") -> str
