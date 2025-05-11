from mpmath import mp
import math

"""
    Library providing mpmath functions for special relativity calculations
    11 May 2025
"""

c_float: float = 299792458.0  # speed of light as a float
shortcut_formatting: bool = False
configured_dp = -1  # not yet configured


def configure(dps: int) -> None:
    """
    Rebuild the constants with the required mpmath decimal places

    Parameters:
        dps: The number of decimal places to use for mpmath calculations
    """
    global g, c, light_year, au, half, one, csquared, seconds_per_year, configured_dp
    mp.dps = dps
    g = mp.mpf("9.80665")  # acceleration due to standard gravity
    c = mp.mpf("299792458")  # speed of light
    light_year = mp.mpf("9460730472580800")  # meters in a light year
    au = mp.mpf("149597870700")  # meters in an astronomical unit

    half = mp.mpf("0.5")  # constant 0.5
    one = mp.mpf("1")  # constant 1
    csquared = c**2  # speed of light squared
    seconds_per_year = mp.mpf(60 * 60 * 24) * mp.mpf("365.25")  # seconds in a year
    configured_dp = dps  # record dps used for constants


def ensure(v):
    """
    Convert to mpf if v is not mpf, otherwise return v unchanged.

    Parameters:
        v: The value to check

    Returns:
        The value as an mpmath number
    """

    if configured_dp < mp.dps:
        raise ValueError(
            f"Constants at {configured_dp} dp but current setting {mp.dps}. Run configure() function again"
        )
    if isinstance(v, mp.mpf):
        return v
    else:
        return mp.mpf(v)


def ensure_abs(v):
    """
    Convert to mpf if v is not mpf, otherwise return v unchanged.
    Return the absolute value of v.

    Parameters:
        v: The value to check

    Returns:
        The value as an mpmath number
    """
    v = ensure(v)
    return mp.fabs(v)


def check_velocity(velocity):
    """
    Ensure the velocity is less than c and convert to mpf type. Returns NaN if velocity is c or above.
    This may indicate a precision failure for values very close to c.

    Parameters:
        velocity: The velocity to check

    Returns:
        The velocity as an mpmath number, if valid
    """
    velocity = ensure(velocity)
    if mp.fabs(velocity) < c:
        return velocity
    return mp.nan


def relativistic_velocity(a, tau):
    """
    Calculate the relativistic velocity as a function of proper time tau.

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        tau: Proper time (s) as an mpmath number or float

    Returns:
        The velocity (m/s) as an mpmath number
    """
    a = ensure_abs(a)
    tau = ensure_abs(tau)
    return c * mp.tanh(a * tau / c)


def relativistic_distance(a, tau):
    """
    Calculate the distance travelled under constant proper acceleration. Relativistic.

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        tau: Proper time (s) as an mpmath number or float

    Returns:
        The coordinate distance travelled (m) as an mpmath number
    """
    a = ensure_abs(a)
    tau = ensure_abs(tau)
    return (csquared / a) * (mp.cosh(a * tau / c) - one)


def relativistic_time_for_distance(a, dist):
    """
    Given acceleration and required distance, calculate seconds required in proper time to reach that coord distance.

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        dist: Coordinate distance (m) as an mpmath number or float

    Returns:
        The proper time elapsed (s) as an mpmath number
    """
    a = ensure_abs(a)
    dist = ensure_abs(dist)
    return (c / a) * mp.acosh((dist * a) / csquared + one)


def flip_and_burn(a, dist) -> tuple:
    """
    Calculate 4-tuple of proper time (s), peak velocity (m/s), peak Lorentz, and coord time (s) for a flip and burn maneuver at given constant acceleration

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        dist: Coordinate distance required (m) as an mpmath number or float

    Returns:
        A 4-tuple of proper time (s), peak velocity (m/s), peak Lorentz, and coord time as mpmath numbers
    """
    a = ensure_abs(a)
    dist = ensure_abs(dist)
    half_dist = dist / 2
    half_proper = relativistic_time_for_distance(a, half_dist)
    half_coord = coordinate_time(a, half_proper)
    peak_vel = relativistic_velocity(a, half_proper)
    lorentz = lorentz_factor(peak_vel)
    return (half_proper * 2, peak_vel, lorentz, half_coord * 2)


def fall(a, dist) -> tuple:
    """
    Calculate the time to fall a given distance under constant acceleration. Returns proper time, coordinate time, and peak velocity (when hitting the ground).
    Does not take into account reduced gravity at altitude, or air resistance.

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        dist: Coord distance (m) as an mpmath number or float

    Returns:
        A 3-tuple of proper time (s), coordinate time (s), and peak velocity (m/s) as mpmath numbers
    """
    tau = relativistic_time_for_distance(a, dist)
    coord = coordinate_time(a, tau)
    velocity = relativistic_velocity(a, tau)
    return (tau, coord, velocity)


def relativistic_distance_float(a: float, tau: float) -> float:
    """
    Just for testing, relativistic_distance using normal floats.

    Parameters:
        a: Proper acceleration (m/s^2) as a float
        tau: Proper time (s) as a float

    Returns:
        The coordinate distance travelled (m) as a float
    """
    if not isinstance(a, float) or not isinstance(tau, float):
        raise TypeError("Both 'a' and 'tau' must be of type float")
    x = a * tau / c_float
    return 2 * (c_float**2 / a) * math.sinh(x / 2) ** 2


def simple_distance(a, t):
    """
    Calculate the distance travelled under constant acceleration. Not relativistic.

    Parameters:
        a: Acceleration (m/s^2) as an mpmath number or float
        t: Time (s) as an mpmath number or float

    Returns:
        The distance travelled (m) as an mpmath number
    """
    a = ensure(a)
    t = ensure(t)
    return half * a * t**2


def rapidity_from_velocity(velocity):
    """
    Calculate the rapidity from velocity. Rapidity is an alternative to velocity that adds linearly.

    Parameters:
        velocity: Velocity (m/s) as an mpmath number or float. Must be less than c.

    Returns:
        The rapidity (m/s) as an mpmath number
    """
    velocity = check_velocity(velocity)
    return mp.atanh(velocity / c)


def velocity_from_rapidity(rapidity):
    """
    Calculate the relativistic velocity from rapidity. Checks for precision failure.

    Parameters:
        rapidity: Rapidity as an mpmath number or float

    Returns:
        The velocity (m/s) as an mpmath number
    """
    velocity = check_velocity(c * mp.tanh(ensure(rapidity)))
    if mp.isnan(velocity):
        # since no finite rapidity should give velocity c or greater, this is a precision failure
        raise ValueError("Precision failure: velocity is c or greater")
    return velocity


def add_velocities(v1, v2):
    """
    Add two velocities relativistically. The velocities must be less than c.
    """
    v1 = check_velocity(v1)
    v2 = check_velocity(v2)
    return (v1 + v2) / (one + (v1 * v2) / csquared)


def coordinate_time(a, tau):
    """
    Calculate the coordinate time (lab time) elapsed for a stationary observer.

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        tau: Proper time (s) as an mpmath number or float

    Returns:
        The coordinate time elapsed (s) as an mpmath number
    """
    a = ensure(a)
    tau = ensure(tau)
    return (c / a) * mp.sinh(a * tau / c)


def length_contraction_velocity(len, velocity):
    """
    Calculate the length contraction factor for a given length and velocity.

    Parameters:
        len: Proper length (m) as an mpmath number or float
        velocity: Velocity (m/s) as an mpmath number or float

    Returns:
        The contracted length (m) as an mpmath number
    """
    len = ensure(len)
    velocity = check_velocity(velocity)
    return len * mp.sqrt(one - (velocity / c) ** 2)


# def length_contraction_lorentz(len, lorentz):
#     """
#     Calculate the length contraction factor for a given length and Lorentz factor.
#     """
#     len = ensure(len)
#     lorentz = ensure(lorentz)
#     if lorentz < one:
#         raise ValueError("Lorentz factor must be at least 1")
#     return len / lorentz


def lorentz_factor(velocity):
    """
    Calculate the Lorentz factor from velocity.

    Parameters:
        velocity: Velocity (m/s) as an mpmath number or float

    Returns:
        The Lorentz factor as an mpmath number
    """
    velocity = check_velocity(velocity)
    return one / mp.sqrt(one - (velocity / c) ** 2)


def relativistic_velocity_coord(a, t):
    """
    Calculate the velocity under constant proper acceleration and coordinate time using mpmath.

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        t: Coordinate time (s) as an mpmath number or float

    Returns:
        The velocity (m/s) as an mpmath number
    """
    a = ensure(a)
    t = ensure(t)
    return (a * t) / mp.sqrt(one + (a * t / c) ** 2)


def relativistic_distance_coord(a, t):
    """
    Calculate the distance traveled under constant proper acceleration and coordinate time using mpmath.

    Parameters:
        a: Proper acceleration (m/s^2) as an mpmath number or float
        t: Coordinate time (s) as an mpmath number or float

    Returns:
        The coordinate distance traveled (m) as an mpmath number
    """
    a = ensure(a)
    t = ensure(t)
    return (csquared / a) * (mp.sqrt(one + (a * t / c) ** 2) - one)


def relativistic_momentum(mass, velocity):
    """
    Calculate the relativistic momentum.

    Parameters:
        mass: The rest mass (kg) as an mpmath floating point number
        velocity: The velocity (m/s) as an mpmath floating point number

    Returns:
        The relativistic momentum (kg m/s)
    """
    mass = ensure(mass)
    velocity = check_velocity(velocity)
    gamma = lorentz_factor(velocity)
    return mass * velocity * gamma


def relativistic_energy(mass, velocity):
    """
    Calculate the relativistic energy.

    Parameters:
        mass: The rest mass (kg) as an mpmath floating point number
        velocity: The velocity (m/s) as an mpmath floating point number

    Returns:
        The total relativistic energy (joules)
    """
    mass = ensure(mass)
    gamma = lorentz_factor(velocity)
    return mass * csquared * gamma


def doppler_shift(frequency, velocity, source_moving_towards: bool = True):
    """
    Calculate the relativistic Doppler shift for light.

    Parameters:
        frequency: The emitted frequency (Hz) as an mpmath floating point number
        velocity: The relative velocity (m/s) as an mpmath floating point number
        source_moving_towards: Boolean indicating if the source is moving towards the observer, default True

    Returns:
        The observed frequency (Hz)
    """
    frequency = ensure(frequency)
    beta = check_velocity(velocity) / c
    if source_moving_towards:
        return frequency * mp.sqrt((one + beta) / (one - beta))
    else:
        return frequency * mp.sqrt((one - beta) / (one + beta))


def invariant_mass_from_energy_momentum(energy, p):
    """
    Calculate the invariant (proper) mass of a system from energy and momentum.

    Parameters:
        energy: The total energy (J) as an mpmath floating point number
        p: The total momentum (kg m/s) as an mpmath floating point number

    Returns:
        The rest mass (kg)
    """
    return mp.sqrt((energy / csquared) ** 2 - (p / csquared) ** 2)


def four_momentum(mass, velocity) -> tuple:
    """
    Calculate the four-momentum of a particle.

    Parameters:
        mass: The rest mass (kg) as an mpmath floating point number
        velocity: The velocity (m/s) as an mpmath floating point number

    Returns:
        A tuple containing energy (j), momentum (kg·m/s) as mpmath floating point numbers
    """
    mass = ensure(mass)
    velocity = check_velocity(velocity)
    gamma = lorentz_factor(velocity)
    energy = mass * csquared * gamma
    momentum = mass * velocity * gamma
    return (energy, momentum)


def spacetime_interval_1d(event1: tuple, event2: tuple):
    """
    Calculate the invariant spacetime interval between two events in 1D space.

    Parameters:
        event1: A tuple (time, position) of the first event
        event2: A tuple (time, position) of the second event

    Returns:
        The invariant interval (spacetime interval squared, or seconds^2 - meters^2 / c^2)
    """
    # Δs = sqrt((cΔt)^2 - (Δx)^2)
    # normal intervals are time-like
    # zero is light-like
    # imaginary is space-like, not causally connected, mp.im(res) != 0

    time1, x1 = event1
    time2, x2 = event2

    delta_ts = (ensure(time2) - ensure(time1)) ** 2
    delta_xs = (ensure(x2) - ensure(x1)) ** 2
    return mp.sqrt(csquared * delta_ts - delta_xs)


def spacetime_interval_3d(event1: tuple, event2: tuple):
    """
    Calculate the invariant spacetime interval between two events in 3D space.

    Parameters:
        event1: A tuple (time, x, y, z) of the first event
        event2: A tuple (time, x, y, z) of the second event

    Returns:
        The invariant interval (spacetime interval squared)
    """
    # sqrt((cΔt)^2 - (Δx)^2 - (Δy)^2 - (Δz)^2)
    # normal intervals are time-like
    # zero is light-like
    # imaginary is space-like, not causally connected, mp.im(res) != 0

    time1, x1, y1, z1 = event1
    time2, x2, y2, z2 = event2

    delta_ts = (ensure(time2) - ensure(time1)) ** 2
    delta_xs = (ensure(x2) - ensure(x1)) ** 2
    delta_ys = (ensure(y2) - ensure(y1)) ** 2
    delta_zs = (ensure(z2) - ensure(z1)) ** 2
    return mp.sqrt(csquared * delta_ts - delta_xs - delta_ys - delta_zs)


def format_mpf(number, decimal_places: int = 2, allow_sci: bool = False) -> str:
    """
    Format an mpmath number with commas and specified decimal places.

    Parameters:
        number: The number to format as mpmath number
        decimal_places: The number of decimal places to show. -1 to show all decimal places
        allow_sci: Allow scientific notation if True, default False

    Returns:
        The formatted number as a string
    """
    if allow_sci:
        number_str = str(ensure(number))
    else:
        number_str: str = mp.nstr(
            ensure(number), configured_dp, min_fixed=-9999, max_fixed=9999
        )  # type: ignore

    if shortcut_formatting or number_str == "nan" or "e" in number_str:
        return number_str  # bypass any formatting

    if "." in number_str:
        integer_part, decimal_part = number_str.split(".")
        # if decimal_places is -1, show all decimal places
        if decimal_places == 0:
            decimal_part = ""
        if decimal_places > 0:
            decimal_part = decimal_part[:decimal_places]
            if len(decimal_part) < decimal_places:
                extra = decimal_places - len(decimal_part)
                extrastr = "0" * extra
                decimal_part += extrastr
    else:
        # no decimal part
        integer_part = number_str
        if decimal_places > 0:
            decimal_part = "0" * decimal_places
        else:
            decimal_part = ""

    # Add commas to the integer part, by converting to int and using built-in formatting
    n = int(integer_part)
    integer_part = f"{n:,}"

    # Reconstruct the formatted number
    formatted_number = integer_part + ("." + decimal_part if decimal_part else "")

    return formatted_number


def format_mpf_significant(
    number, significant_decimal_places: int = 2, ignore_char: str = "0"
) -> str:
    """
    Format a number with commas and specified significant decimal places. Ignore any number of leading zeros (or specified eg '9').
    Eg 0.00001234 with 2 significant decimal places and ignore_char='0' will return '0.000012'

    Parameters:
        number: The number to format as mpmath number
        significant_decimal_places: The number of significant decimal places to show, -1 to show all decimal places
        ignore_char: The character to ignore when counting significant decimal places, default '0'

    Returns:
        The formatted number as a string
    """
    # number_str = str(number)
    number_str: str = mp.nstr(
        ensure(number), configured_dp, min_fixed=-9999, max_fixed=9999
    )  # type: ignore

    if shortcut_formatting or number_str == "nan" or "e" in number_str:
        return number_str  # bypass any formatting

    if len(ignore_char) != 1:
        raise ValueError("ignore_char must be a single character")

    if "." in number_str:
        integer_part, decimal_part = number_str.split(".")
        # if decimal_places is -1, show all decimal places
        if significant_decimal_places == 0:
            decimal_part = ""
        if significant_decimal_places > 0:
            # take significant_decimal_places including ignore_chars
            count = 0
            significant = False
            for i, char in enumerate(decimal_part):
                if significant or char != ignore_char:
                    count += 1  # count significant digits
                    significant = True  # we've reached the first significant digit
                if count == significant_decimal_places:
                    decimal_part = decimal_part[
                        : i + 1
                    ]  # we've reached the significant decimal places limit
                    break
    else:
        # no decimal part
        integer_part = number_str
        if significant_decimal_places > 0:
            decimal_part = "0" * significant_decimal_places
        else:
            decimal_part = ""

    # Add commas to the integer part, by converting to int and using built-in formatting
    n = int(integer_part)
    integer_part = f"{n:,}"

    # Reconstruct the formatted number
    formatted_number = integer_part + ("." + decimal_part if decimal_part else "")

    return formatted_number


def printfmt(
    items: list, decimal_places: int = 2, allow_sci: bool = False, new_line: bool = True
) -> None:
    """
    Print a list of items with specified decimal places and formatting.
    """
    for item in items:
        if isinstance(item, mp.mpf) or isinstance(item, float):
            print(format_mpf(item, decimal_places, allow_sci), end="")
        else:
            print(item, end="")
    if new_line:
        print()


def printfmt_sig(
    items: list,
    significant_decimal_places: int = 2,
    ignore_char: str = "0",
    new_line: bool = True,
) -> None:
    """
    Print a list of items with specified significant decimal places and formatting.
    """
    for item in items:
        if isinstance(item, mp.mpf) or isinstance(item, float):
            print(
                format_mpf_significant(item, significant_decimal_places, ignore_char),
                end="",
            )
        else:
            print(item, end="")
    if new_line:
        print()


## =================================================================================================

# configure constants with default 50 decimal places
configure(50)

## =================================================================================================

# Sample calculations if we run this file directly
if __name__ == "__main__":
    mp.dps = 100
    configure(100)
    rel_distance = relativistic_distance(g, seconds_per_year)
    sim_distance = simple_distance(g, seconds_per_year)
    rel_velocity = relativistic_velocity(g, seconds_per_year)
    sim_velocity = g * seconds_per_year

    print("1g acceleration for 1 year (proper time):")
    print("Relativistic distance:", format_mpf(rel_distance))
    print("Simple distance      :", format_mpf(sim_distance))
    print("Difference           :", format_mpf(rel_distance - sim_distance, 4))
    print()
    print("Peak velocity:")
    print(
        f"Relativistic velocity: {format_mpf(rel_velocity)}, c = {format_mpf(rel_velocity / c, 4)}"
    )
    print(
        f"Simple velocity      : {format_mpf(sim_velocity)}, c = {format_mpf(sim_velocity / c, 4)}"
    )

    print()
    print("format_mpf tests:")
    print(format_mpf(mp.mpf("123456789012345678901234567890.123456789"), 4))
    print(format_mpf(mp.mpf("123456789012345678901234567890.123456789"), 0))
    print(format_mpf(mp.mpf("123456789012345678901234567890.1"), 4))
    print(format_mpf(mp.mpf("123456789012345678901234567890.1"), -1))
    print(format_mpf(mp.mpf("123456789012345678901234567890"), 2))

    print()
    print("format_mpf_significant tests:")
    print(
        format_mpf_significant(mp.mpf("123456789012345678901234567890.00001234567"), 4)
    )
    print(
        format_mpf_significant(mp.mpf("123456789012345678901234567890.00001234567"), 2)
    )
    print(format_mpf_significant(mp.mpf("0.000000001234567"), 2))
    print(format_mpf_significant(mp.mpf("0.000000000001234567"), 3))
    print(format_mpf_significant(mp.mpf("0.99999999999999999991234567"), 3, "0"))
    print(format_mpf_significant(mp.mpf("0.99999999999999999991234567"), 3, "9"))
    print(format_mpf_significant(mp.mpf("0.999999999999999999919293949567"), 3, "9"))
    print(format_mpf_significant(mp.mpf("0.999999999999999999919"), 4, "9"))
    print(format_mpf_significant(mp.mpf("0.99999999999999999991"), 4, "9"))
    print(format_mpf_significant(mp.mpf("0.9999999999999999999"), 4, "9"))

    daystoneptune = relativistic_time_for_distance(g, "4600000000000") / 60 / 60 / 24
    print(f"Days to Neptune full burn {format_mpf(daystoneptune, 4)}")
    # daystoneptune2 = relativistic_time_for_distance2(g, "4600000000000") / 60 / 60 / 24
    # print(f"Days to Neptune flip and burn {format_mpf(daystoneptune2, 4)}")

    # distant halved, gives days to half way. Them * 2 for total days
    halfwaydays = (
        relativistic_time_for_distance(g, mp.mpf("4600000000000") / 2) / 60 / 60 / 24
    )
    print(f"Days to Neptune flip half way {format_mpf(halfwaydays * 2, 4)}")
