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
// Lets go to Andromeda Galaxy, 2.5 million light years away at 1g

var year = B(rl.Days(365.25));
var distance = B(rl.LightYears(2_500_000.0));
var accel = EFloatRelativity.G;

// full and half-way burn, in seconds
var full_burn_sec = B(rl.RelativisticTimeForDistance(accel, distance));
var flip_burn_sec = B(rl.RelativisticTimeForDistance(accel, distance / 2));

// convert to total years
var full_burn_years = full_burn_sec / year;
var flip_burn_years = flip_burn_sec * 2 / year;

// peak velocity as fraction of c
var peak_velocity_full_burn = B(rl.RelativisticVelocity(accel, full_burn_sec)) / EFloatRelativity.C;
var peak_velocity_flip_burn = B(rl.RelativisticVelocity(accel, flip_burn_sec)) / EFloatRelativity.C;

// output
Console.WriteLine($"Years at 1g, burning all the way {full_burn_years.Value}");
Console.WriteLine($"Peak velocity full burn {peak_velocity_full_burn.Value} c");
Console.WriteLine();
Console.WriteLine($"Years at 1g, flip and burn half way {flip_burn_years.Value}");
Console.WriteLine($"Peak velocity flip {peak_velocity_flip_burn.Value} c");

// Now some time dilation and length contraction
var veryfast = rl.FractionOfC(0.9999);
var lotentz = rl.LorentzFactor(veryfast);
var length = B(1) / lotentz;
var time = B(1) * lotentz;

Console.WriteLine();
Console.WriteLine("Time dilation and length contraction at 0.9999c:");
Console.WriteLine($"Lorentz factor {lotentz}");
Console.WriteLine($"Length contraction 1m becomes {length}m");
Console.WriteLine($"Time dilation 1 second becomes {time}s");
```

To simplify casting `EFloat` into `BigFloat`, use this helper function:

```csharp
private static BigFloat B(EFloat f) => BigFloat.FromEFloat(f);
```

## BigFloat helper (EFloat + EContext)

`BigFloat` is a wrapper around `EFloat` that simplifies context handling and lets us write more attractive code. Normally you need to supply a context to every operation, but BigFloat does this for you.

```csharp
// Setup
EContext context = BuildContext();
EFloat a = EFloat.FromString("1");
EFloat b = EFloat.FromString("2");
EFloat c = EFloat.FromString("3");

// Normal EFloat and context usage, ugly
var result =  a.Add(b, context).Multiply(c, context).Divide(a, context);

// With BigFloats
var result = (B(a) + b) * c / a;
```

Each BigFloat is a immutable struct containing `(EFloat, EContext)`. The left hand context is used for any operation.

See `BigFloat.cs` for details.
