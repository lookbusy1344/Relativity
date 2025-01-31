# C# Special Relativity coding tools

This project contains both a strongly typed units of measure library (equivalent to the `rust_uom` library) and a library for arbitrary precision calculations (equivalent to the Python library or `rust_astrofloat`).

However note there are no built-in `EFloat` hyperbolic trigonometry functions. These are implemented by hand and are not as accurate as the Python/Rust tools.

The units of measure library is here:

https://github.com/lookbusy1344/Relativity/blob/main/CSharp/UomTools.cs

Written for C# 13 and .NET 9

## Example usage, 1 year at 1g (units of measure)

See the project for more examples.

```csharp
// initial parameters
var oneG = Acceleration.FromStandardGravity(1.0); // 9.80665 m/s^2
var oneYear = Duration.FromDays(365);

// velocity after 1 year at 1G (constant burn)
var finalVelocity = Tools.RelativisticAcceleration(oneG, oneYear);
var check = Tools.RelativisticAccelerationAsFraction(oneG, oneYear);
var naively = oneG * oneYear;

// convert to fraction of c
var asFraction = new FractionOfC(finalVelocity);
var naiveAsFraction = new FractionOfC(naively, false);

// output
Console.WriteLine($"Velocity after 1 year at 1G is {asFraction}");
Console.WriteLine($"Check {check}");
Console.WriteLine($"Non-relativistic naive calc would be {naiveAsFraction}");
```

## Example, Andromeda Galaxy at 1g (arbitrary precision)

Note: prefer Python or rust-astrofloat for arbitrary precision calculations. However the library is here

https://github.com/lookbusy1344/Relativity/blob/main/CSharp/EFloatRelativity.cs

```csharp
var rl = new EFloatRelativity();
var ctx = rl.Context;

// Lets go to Andromeda Galaxy, 2.5 million light years away at 1g
var distance = rl.LightYears(2_500_000.0);
var accel = EFloatRelativity.G;
var year = rl.Days(365.25);

// time for full burn and flip-and-burn
var full_burn_sec = rl.RelativisticTimeForDistance(accel, distance);
var flip_burn_sec = rl.RelativisticTimeForDistance(accel, distance.Divide(2));

// convert to years
var full_burn_years = full_burn_sec.Divide(year, ctx);
var flip_burn_years = flip_burn_sec.Multiply(2).Divide(year, ctx);

// peak velocity
var peak_velocity_full_burn = rl.RelativisticVelocity(accel, full_burn_sec).Divide(EFloatRelativity.C, ctx);
var peak_velocity_flip_burn = rl.RelativisticVelocity(accel, flip_burn_sec).Divide(EFloatRelativity.C, ctx);

// output
Console.WriteLine($"Years at 1g, burning all the way {full_burn_years}");
Console.WriteLine($"Peak velocity full burn {peak_velocity_full_burn} c");
Console.WriteLine();
Console.WriteLine($"Years at 1g, flip and burn half way {flip_burn_years}");
Console.WriteLine($"Peak velocity flip {peak_velocity_flip_burn} c");
```
