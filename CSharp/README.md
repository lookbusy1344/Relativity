# C# Special Relativity coding tools

This project contains both a strongly typed units of measure library (equivalent to the `rust_uom` library) and a library for arbitrary precision calculations (equivalent to the Python `mpmath` library or `rust_astrofloat`).

However note there are no built-in `EFloat` hyperbolic trigonometry functions. These are implemented by hand and are not as accurate as the Python/Rust tools.

The units of measure library is here:

https://github.com/lookbusy1344/Relativity/blob/main/CSharp/Tools.cs

Written for C# 13 and .NET 9

## Example usage, 1 year at 1g

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
