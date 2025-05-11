import relativity_lib as rl
from prettytable import PrettyTable

rl.configure(100)
table = PrettyTable(["Days", "AU", "km/s", "c"])
table.align = "r"


def burn_days(a, days) -> None:
    sec = rl.ensure(days) * 60 * 60 * 24 / 2
    dist = rl.relativistic_distance(a, sec) * 2  # half there, half back so *2
    peak_velocity = rl.relativistic_velocity(a, sec)
    table.add_row(
        [
            days,
            rl.format_mpf(dist / rl.au),
            rl.format_mpf(peak_velocity / 1000),
            rl.format_mpf_significant(peak_velocity / rl.c, 3, "9"),
        ]
    )


accel = rl.g
for day in range(1, 101):
    burn_days(accel, day)

print("Days at 1g constant acceleration, flip-and-burn halfway")
print(table)


planets = PrettyTable(["Body", "Km", "Days", "Peak c"])
planets.align = "r"
planets.align["Body"] = "l"  # type: ignore


def time_for_dist(dest: str, km):
    m = rl.ensure(km) * 1000
    half_m = m / 2.0
    half_time = rl.relativistic_time_for_distance(rl.g, half_m)
    peak_vel = rl.relativistic_velocity(rl.g, half_time) / rl.c
    days = half_time * 2.0 / 60 / 60 / 24
    planets.add_row(
        [
            dest,
            rl.format_mpf(km, 0),
            rl.format_mpf(days),
            rl.format_mpf_significant(peak_vel, 3, "9"),
        ]
    )


time_for_dist("Mercury", "77000000")
time_for_dist("Venus", "40000000")
time_for_dist("Mars", "225000000")
time_for_dist("Jupiter", "778000000")
time_for_dist("Saturn", "1400000000")
time_for_dist("Uranus", "2860000000")
time_for_dist("Neptune", "4600000000")
time_for_dist(
    "Farfarout", rl.au * 133 / 1000
)  # 133 AU, furthest known object '2018 AG37'

print()
print("Days at 1g constant acceleration, flip-and-burn halfway")
print(planets)

# Furthest known object
# https://en.wikipedia.org/wiki/2018_AG37
