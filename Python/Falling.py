from mpmath import mp
import relativity_lib as rl

rl.configure(15)
a = rl.g  # mp.mpf(9.81)
dist = mp.mpf(1200 * 1000)

# VELOCITY AND TIME AFTER FALLING UNDER 1g FOR GIVEN DISTANCE

# 1. get the proper time for the fall of given distance (time for the object)
# 2. use the proper time to calculate the velocity at impact
# 3. use the proper time to calculate coordinate time, for an observer.

# basic relativistic calculation
tau, coord, velocity = rl.fall(a, dist)

# extras, different units
diff = coord - tau
velc = velocity / rl.c
velkmh = velocity * mp.mpf(3.6)
mins = coord / mp.mpf(60)

print(f"Falling {dist} m:")
print()
print(f"Tau (s)   = {tau}")
print(f"Vel (m/s) = {velocity}")
print(f"Coord (s) = {coord}")
print()
print(f"Relativistic discrepancy is {diff}")
print(f"km/hour = {velkmh}")
print(f"Fraction of c = {velc}")
print(f"Minutes = {mins}")
