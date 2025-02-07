from mpmath import mp
import relativity_lib as rl

rl.configure(100)


def get_type(interval):
    if interval == 0:
        return "Light-like"
    if mp.im(interval) != 0:
        return "Space-like"
    else:
        return "Time-like"


# 1D space
interval1 = rl.spacetime_interval_1d((1.1, 1), (10, 5))
print(interval1)
print(get_type(interval1))
print()

# 3D space
interval1 = rl.spacetime_interval_3d((2, 1, 1, 1), (10, 5, 10, 100))
print(interval1)
print(get_type(interval1))
print()

interval1 = rl.spacetime_interval_1d((1.1, 1), (1.1, 5))
print(interval1)
print(get_type(interval1))
print()

# 2 metres and 2*c, so zero, light-like
interval1 = rl.spacetime_interval_1d((0, 0), (2, rl.c * 2))
print(interval1)
print(get_type(interval1))
