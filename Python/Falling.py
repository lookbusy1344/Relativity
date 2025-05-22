import motion_lib as ml

horiz_dist = 70000
height = horiz_dist / 4.0
time, vel = ml.fall_time_and_velocity(ml.earth_mass, ml.earth_radius, height)

print(f"time = {time}")
print(f"vel = {vel}")
