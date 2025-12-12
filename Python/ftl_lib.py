import numpy as np


def calculate_time_travel(
    distance_ly: float, boost_speed_c: float, warp_time_years: float = 0.0
) -> float:
    """
    Calculates the time travel displacement (in years) resulting from an FTL trip
    followed by a reference frame boost.

    The calculation assumes the trip consists of two FTL legs:
    1. Outbound FTL trip over the distance 'distance_ly'.
    2. Inbound FTL trip in a frame boosted at 'boost_speed_c'.

    Args:
        distance_ly: The distance of the jump in light-years.
        boost_speed_c: The boost speed as a fraction of 'c' (e.g., 0.5 for 0.5c).
                       Must be less than 1.0.
        warp_time_years: The time taken for the *outbound* FTL trip in the Earth frame
                         (in years). Use 0.0 for an instantaneous warp (the default).

    Returns:
        The time displacement in years. A negative value indicates travel to the past.
        Returns np.nan if boost_speed_c is invalid (>= 1.0).
    """

    # Check for invalid boost speed
    if boost_speed_c >= 1.0:
        print("Error: Boost speed must be less than c (1.0).")
        return np.nan

    # For simplicity, we set c = 1 year/light-year
    c_squared = 1.0

    # I. Calculate the Time Shift (The Tilted Plane of Simultaneity)
    # This is the effect of the boost, which is independent of the warp time.
    # This is the term you calculated: (v * delta_x) / c^2
    time_shift = (boost_speed_c * distance_ly) / c_squared

    # II. Account for the FTL Trip Time
    # The instantaneous FTL scenario (warp_time_years = 0) is what creates the maximal paradox.
    # If the outbound FTL trip takes some time (warp_time_years > 0), this is the time
    # the Earth clock advances, partially cancelling the backwards time travel.
    time_elapsed = warp_time_years

    # The total time travel displacement (delta t_final) is:
    # (Time Shift into the Past) + (Time Elapsed on Earth)
    # The negative sign indicates travel to the past
    time_travel_backwards = time_elapsed - time_shift

    return time_travel_backwards


if __name__ == "__main__":
    # --- Examples ---

    ## Example 1: Your Confirmed Scenario (Maximal Paradox)
    # 10 light-years, boost 0.5c, instant warp (0 years)
    distance_1 = 10.0
    boost_1 = 0.5
    time_travel_1 = calculate_time_travel(distance_1, boost_1)
    print(
        f"Scenario 1: {distance_1} ly, {boost_1}c, Instant Warp -> {time_travel_1:.3f} years (5 years back)"
    )

    ## Example 2: The Original Scenario
    # 4.2 light-years, boost 0.99c, instant warp
    distance_2 = 4.2
    boost_2 = 0.99
    time_travel_2 = calculate_time_travel(distance_2, boost_2)
    print(
        f"Scenario 2: {distance_2} ly, {boost_2}c, Instant Warp -> {time_travel_2:.3f} years (4.158 years back)"
    )

    ## Example 3: FTL is "Slow"
    # 10 light-years, boost 0.9c, but the warp trip takes 1 year in Earth time.
    # The Time Shift is 9.0 years back, but 1.0 year has passed on Earth, resulting in 8 years back.
    distance_3 = 10.0
    boost_3 = 0.9
    warp_time_3 = 1.0
    time_travel_3 = calculate_time_travel(distance_3, boost_3, warp_time_3)
    print(
        f"Scenario 3: {distance_3} ly, {boost_3}c, 1 Year Warp -> {time_travel_3:.3f} years (8 years back)"
    )

    ## Example 4: No Time Travel (FTL is too slow)
    # 10 light-years, boost 0.5c, but the warp trip takes 6 years (i.e., less than 5 years back).
    # Time Shift is 5 years back, but 6 years have passed, resulting in 1 year forward.
    distance_4 = 10.0
    boost_4 = 0.5
    warp_time_4 = 6.0
    time_travel_4 = calculate_time_travel(distance_4, boost_4, warp_time_4)
    print(
        f"Scenario 4: {distance_4} ly, {boost_4}c, 6 Year Warp -> {time_travel_4:.3f} years (1 year forward)"
    )
