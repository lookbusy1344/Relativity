# Special Relativity with Python

Here we explore relativity with some [Jupyter notebooks](https://en.wikipedia.org/wiki/Project_Jupyter), a type of document that can contain text, images and runnable Python code. You can view them in your web browser, or transfer a copy to *Google Colab* with one click and edit it from your device. They can also be downloaded to your PC for more advanced editing. Everything is open source.

Don't worry about any Python code if you're not a programmer. You can skip over it and just read the results, which are usually tables or graphs. The code is there to help you understand the maths, and to make it easier to experiment with different values.

The maths needed for special relativity is not difficult, there's nothing more complicated than high school algebra.

[Easy intro, adding velocities](https://github.com/lookbusy1344/Relativity/blob/main/Python/Velocity%20adding.ipynb)

[Time dilation and length contraction](https://github.com/lookbusy1344/Relativity/blob/main/Python/Time%20dilation.ipynb)

[Universe tour, 1-47 billion light years](https://github.com/lookbusy1344/Relativity/blob/main/Python/Universe.ipynb)

[Solar system tour, how far can you get in 2 weeks](https://github.com/lookbusy1344/Relativity/blob/main/Python/Solar%20system.ipynb)

[Relativistic mass and constant acceleration](https://github.com/lookbusy1344/Relativity/blob/main/Python/Relativistic%20mass.ipynb)

[Notes on rapidity](https://github.com/lookbusy1344/Relativity/blob/main/Python/Rapidity.ipynb)

[Spacetime intervals, invariant intervals between events](https://github.com/lookbusy1344/Relativity/blob/main/Python/Spacetime%20Interval.ipynb)

## Library

The Python library uses *mpmath* for arbitrary precision calculations, allowing us to calculate velocities to hundreds of decimal places. Other folders in the repository include C# and Rust versions of the library, but they are not as easy to use.

https://github.com/lookbusy1344/Relativity/blob/main/Python/relativity_lib.py

You will need to install the *mpmath* to use this library:

```bash
pip install mpmath
```

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

# UV virtual environment

Run scripts using uv, eg:

```
uv sync
uv run "Solar system.py"
```

# Library functions

* **Proper time/length/acceleration** = time/etc measured by an observer in the accelerating frame. Eg time on the ship.
* **Coordinate time/length/acceleration** = time/etc measured by an observer in a stationary frame. Eg time on the Earth.

`tau` is proper time, `t` is coordinate time.

## Setup

### configure(dps: int) -> None
Configure mpmath for this number of decimal places (base 10 digits). Rebuild constants like `c`. Typically 100 is a good number.

## Special relativity functions

### relativistic_velocity(a, tau) -> mpf
Returns velocity after constant acceleration for tau proper time

### relativistic_distance(a, tau) -> mpf
Returns coord distance travelled after constant acceleration for tau proper time

### relativistic_time_for_distance(a, dist) -> mpf
Given acceleration and required distance, calculate seconds required in proper time to reach that coord distance.

### flip_and_burn(a, dist) -> tuple[mpf]
Given constant proper acceleration and coordinate distance, calculate proper time (s), peak velocity (m/s), and coordinate time (s) for a flip and burn maneuver (accelerating for half the journey, then decelerating for second half).

### simple_distance(a, t) -> mpf
Calculate the distance travelled under constant acceleration. Not relativistic, this may exceed the speed of light! Contrast with `relativistic_distance()`.

### rapidity_from_velocity(velocity) -> mpf
Calculate the *rapidity* from velocity. Rapidity is an alternative to velocity that adds linearly.

### velocity_from_rapidity(rapidity) -> mpf
Calculate the relativistic velocity from rapidity. Checks for precision failure.

### add_velocities(v1, v2) -> mpf
Add two velocities relativistically. The velocities must be less than c.

### coordinate_time(a, tau) -> mpf
Calculate the coordinate time (observer time) elapsed for a stationary observer when accelerating at `a` for proper time `tau`.

### length_contraction_velocity(len, velocity) -> mpf
Calculate the length contraction factor for a given length and velocity.

### lorentz_factor(velocity) -> mpf
Calculate the Lorentz factor from velocity.

### relativistic_velocity_coord(a, t) -> mpf
Calculate the velocity under constant proper acceleration `a` and coordinate time `t`.

### relativistic_distance_coord(a, t) -> mpf
Calculate the distance travelled under constant proper acceleration `a` and coordinate time `t`.

### relativistic_momentum(mass, velocity) -> mpf
Calculate the relativistic momentum.

### relativistic_energy(mass, velocity) -> mpf
Calculate the relativistic energy.

### doppler_shift(frequency, velocity, source_moving_towards: bool = True) -> mpf
Calculate the relativistic Doppler shift for light.

### invariant_mass_from_energy_momentum(energy, p) -> mpf
Calculate the invariant (proper) mass of a system from energy and momentum.

### four_momentum(mass, velocity) -> tuple[mpf]
Calculate the four-momentum of a particle. Returns a tuple of energy and momentum.

### spacetime_interval_1d(event1: tuple, event2: tuple) -> mpf
Calculate the invariant interval between two events in 1D space. Input tuples are `(time, position)`. Returns the invariant interval (*spacetime interval squared*, or *seconds^2 - meters^2 / c^2*)

### spacetime_interval_3d(event1: tuple, event2: tuple) -> mpf
Calculate the invariant interval between two events in 3D space. Input tuples are `(time, x, y, z)`. Returns the invariant interval (*spacetime interval squared*, or *seconds^2 - meters^2 / c^2*)

## Display

### format_mpf(number, decimal_places: int = 2, allow_sci: bool = False) -> str
Format an mpmath number with commas and specified decimal places.
- 1234567.1234567 with 2 decimal places will return `1,234,567.12`

### format_mpf_significant(number, significant_decimal_places: int = 2, ignore_char: str = "0") -> str
Format a number with commas and specified significant decimal places. Ignore any number of leading zeros (or specified eg '9').
- 1234.00001234 with 2 significant decimal places and `ignore_char='0'` will return `1,234.000012`
- 1234.99991234 with 2 significant decimal places and `ignore_char='9'` will return `1,234.999912`
- 1234.1234 with 2 significant decimal places and `ignore_char='9'` will return `1,234.12`
