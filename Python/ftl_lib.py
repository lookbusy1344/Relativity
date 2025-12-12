import numpy as np


def lorentz_gamma(v: float) -> float:
    """Calculate the Lorentz factor gamma for a given velocity (as fraction of c)."""
    if v < 0 or v >= 1.0:
        return np.nan
    return 1.0 / np.sqrt(1.0 - v**2)


def calculate_time_travel(
    distance_ly: float,
    boost_speed_c: float,
    outbound_warp_time_years: float = 0.0,
    return_warp_time_years: float = 0.0,
    boost_duration_years: float = 0.0,
) -> dict:
    """
    Calculates the time travel displacement (in years) resulting from an FTL trip
    followed by a reference frame boost.

    The calculation models a complete round-trip:
    1. Outbound FTL trip over the distance 'distance_ly' (in Earth frame).
    2. Boost phase: accelerate to 'boost_speed_c' (time-dilated).
    3. Return FTL trip back to Earth (in the boosted frame).

    Args:
        distance_ly: The distance of the jump in light-years.
        boost_speed_c: The boost speed as a fraction of 'c' (e.g., 0.5 for 0.5c).
                       Must be between 0 and 1.0 (exclusive).
        outbound_warp_time_years: Time for the outbound FTL trip in Earth frame (years).
                                  Use 0.0 for instantaneous warp (default).
        return_warp_time_years: Time for the return FTL trip in the boosted frame (years).
                                Use 0.0 for instantaneous warp (default).
        boost_duration_years: Proper time spent at boost velocity before return (years).
                              This time is dilated in the Earth frame.

    Returns:
        A dict containing:
            - 'time_displacement': Net time displacement in years (negative = past).
            - 'earth_time_elapsed': Total time elapsed on Earth during the trip.
            - 'traveler_time_elapsed': Total proper time experienced by traveler.
            - 'simultaneity_shift': The relativistic simultaneity shift from the boost.
        Returns dict with np.nan values if boost_speed_c is invalid.
    """

    # Check for invalid boost speed
    if boost_speed_c < 0 or boost_speed_c >= 1.0:
        print("Error: Boost speed must be between 0 and 1 (exclusive of 1).")
        return {
            "time_displacement": np.nan,
            "earth_time_elapsed": np.nan,
            "traveler_time_elapsed": np.nan,
            "simultaneity_shift": np.nan,
        }

    # Calculate Lorentz factor for time dilation during boost phase
    gamma = lorentz_gamma(boost_speed_c)

    # I. Calculate the Simultaneity Shift (The Tilted Plane of Simultaneity)
    # When boosting to velocity v, events separated by distance Δx have a time
    # difference of (v * Δx) / c² in the new frame. With c=1: v * Δx
    simultaneity_shift = boost_speed_c * distance_ly

    # II. Calculate time elapsed in Earth frame for each phase
    # Phase 1: Outbound FTL trip (time passes normally in Earth frame)
    earth_time_outbound = outbound_warp_time_years

    # Phase 2: Boost duration (proper time is dilated: Δt_earth = γ * Δt_proper)
    earth_time_boost = gamma * boost_duration_years

    # Phase 3: Return trip - this is where it gets tricky
    # The return trip is instantaneous (or takes return_warp_time_years) in the BOOSTED frame.
    # In the boosted frame's simultaneity, "now" at the destination corresponds to
    # a different Earth time due to the simultaneity shift.
    # The return warp time in the boosted frame maps to the same duration in Earth frame
    # for our simplified model (FTL breaks normal transformations anyway).
    earth_time_return = return_warp_time_years

    # III. Total Earth time that would have elapsed WITHOUT the simultaneity paradox
    total_earth_time_nominal = (
        earth_time_outbound + earth_time_boost + earth_time_return
    )

    # IV. The key insight: the simultaneity shift means the traveler's "now" at the
    # destination (after boosting) corresponds to an EARLIER time on Earth.
    # So arrival time = departure time + elapsed time - simultaneity_shift
    time_displacement = total_earth_time_nominal - simultaneity_shift

    # V. Traveler's proper time (what they experience)
    # Outbound warp: assume same as Earth time (FTL is already non-physical)
    # Boost phase: proper time as given
    # Return warp: same assumption
    traveler_time = (
        outbound_warp_time_years + boost_duration_years + return_warp_time_years
    )

    return {
        "time_displacement": time_displacement,
        "earth_time_elapsed": total_earth_time_nominal,
        "traveler_time_elapsed": traveler_time,
        "simultaneity_shift": simultaneity_shift,
    }


def calculate_time_travel_simple(
    distance_ly: float, boost_speed_c: float, warp_time_years: float = 0.0
) -> float:
    """
    Simplified calculation for backwards compatibility.

    This is the original function behavior: assumes instantaneous return trip
    and no boost duration. Returns just the time displacement value.

    Args:
        distance_ly: The distance of the jump in light-years.
        boost_speed_c: The boost speed as a fraction of 'c'.
        warp_time_years: Time for the outbound FTL trip in Earth frame (years).

    Returns:
        The time displacement in years. Negative = travel to the past.
    """
    result = calculate_time_travel(
        distance_ly=distance_ly,
        boost_speed_c=boost_speed_c,
        outbound_warp_time_years=warp_time_years,
    )
    return result["time_displacement"]


if __name__ == "__main__":
    # --- Examples ---

    ## Example 1: Your Confirmed Scenario (Maximal Paradox)
    # 10 light-years, boost 0.5c, instant warp (0 years)
    distance_1 = 10.0
    boost_1 = 0.5
    time_travel_1 = calculate_time_travel(distance_1, boost_1)
    print(
        f"Scenario 1: {distance_1} ly, {boost_1}c, Instant Warp -> {time_travel_1['time_displacement']:.3f} years (5 years back)"
    )

    ## Example 2: The Original Scenario
    # 4.2 light-years, boost 0.99c, instant warp
    distance_2 = 4.2
    boost_2 = 0.99
    time_travel_2 = calculate_time_travel(distance_2, boost_2)
    print(
        f"Scenario 2: {distance_2} ly, {boost_2}c, Instant Warp -> {time_travel_2['time_displacement']:.3f} years (4.158 years back)"
    )

    ## Example 3: FTL is "Slow"
    # 10 light-years, boost 0.9c, but the warp trip takes 1 year in Earth time.
    # The Time Shift is 9.0 years back, but 1.0 year has passed on Earth, resulting in 8 years back.
    distance_3 = 10.0
    boost_3 = 0.9
    warp_time_3 = 1.0
    time_travel_3 = calculate_time_travel(distance_3, boost_3, warp_time_3)
    print(
        f"Scenario 3: {distance_3} ly, {boost_3}c, 1 Year Warp -> {time_travel_3['time_displacement']:.3f} years (8 years back)"
    )

    ## Example 4: No Time Travel (FTL is too slow)
    # 10 light-years, boost 0.5c, but the warp trip takes 6 years (i.e., less than 5 years back).
    # Time Shift is 5 years back, but 6 years have passed, resulting in 1 year forward.
    distance_4 = 10.0
    boost_4 = 0.5
    warp_time_4 = 6.0
    time_travel_4 = calculate_time_travel(distance_4, boost_4, warp_time_4)
    print(
        f"Scenario 4: {distance_4} ly, {boost_4}c, 6 Year Warp -> {time_travel_4['time_displacement']:.3f} years (1 year forward)"
    )

    ## Example 5: Full round trip with boost duration
    # Shows complete model: outbound warp, time at destination, return warp
    print("\n--- Full Model Example ---")
    result = calculate_time_travel(
        distance_ly=10.0,
        boost_speed_c=0.8,
        outbound_warp_time_years=0.5,  # Half year outbound trip
        return_warp_time_years=0.5,  # Half year return trip
        boost_duration_years=1.0,  # 1 year proper time at destination
    )
    print(f"Distance: 10 ly, Boost: 0.8c")
    print(f"  Outbound warp: 0.5 years, Return warp: 0.5 years, Boost duration: 1 year")
    print(f"  Simultaneity shift: {result['simultaneity_shift']:.3f} years")
    print(f"  Earth time elapsed: {result['earth_time_elapsed']:.3f} years")
    print(f"  Traveler time elapsed: {result['traveler_time_elapsed']:.3f} years")
    print(f"  Net time displacement: {result['time_displacement']:.3f} years")
