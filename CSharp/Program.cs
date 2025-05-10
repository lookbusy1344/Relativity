namespace Relativity;

using System.Runtime.CompilerServices;
using PeterO.Numbers;
using UnitsNet;

#pragma warning disable IDE0059 // Unnecessary assignment of a value

internal static class Program
{
	private static EContext? ctx;

	private static void Main()
	{
		var timetofall = TimeToFall(100, 9.81);
		var velocity = VelocityAfterFalling(100, 9.81);

		var oneg = Acceleration.FromMetersPerSecondSquared(9.81);
		var distance = Length.FromMeters(100);

		var timeTemp = Duration.FromSeconds(timetofall); // when RelativisticTimeForDistance is implemented, we dont need to use timetofall
		var xx = Tools.RelativisticAcceleration(oneg, timeTemp);

		// impplement UOM version of EFloatRelativity.RelativisticTimeForDistance
		// (c / a) * acosh((dist * a) / csquared + one)

		var metre = new Quantity.Quantity<Quantity.Length>(1);
		var second = new Quantity.Quantity<Quantity.Time>("0.5");
		var mass = new Quantity.Quantity<Quantity.Mass>(1.0);

		// implicit conversions
		EFloat conversion1 = metre;
		Quantity.Quantity<Quantity.Length> conversion2 = conversion1;
		//metre = second;

		Uom();
		BigFloats();
		//TrigTests();
	}

	private static void Uom()
	{
		var oneG = Acceleration.FromStandardGravity(1.0); // 9.80665 m/s^2
		var oneYear = Duration.FromDays(365.25);
		var finalVelocity = Tools.RelativisticAcceleration(oneG, oneYear);
		var check = Tools.RelativisticAccelerationAsFraction(oneG, oneYear);
		var naively = oneG * oneYear;
		var asFraction = new FractionOfC(finalVelocity);
		var naiveAsFraction = new FractionOfC(naively, false);

		Console.WriteLine("UOM, one year at 1g:");
		Console.WriteLine($"Velocity after 1 year at 1G is {asFraction}");
		Console.WriteLine($"Check {check}");
		Console.WriteLine($"Non-relativistic naive calc would be {naiveAsFraction}");
	}

	private static void BigFloats()
	{
		var rl = new EFloatRelativity();
		var ctx = rl.Context;
		BigFloat.DefaultContext = ctx; // using the same context for BigFloats
		Program.ctx = ctx;

		var initial = EFloat.FromString("299792457.9999999");
		var rapidity = rl.RapidityFromVelocity(initial);
		var doubled = B(rapidity) * 2;
		var velocity = rl.VelocityFromRapidity(doubled.Value);

		Console.WriteLine();
		Console.WriteLine("BigFloats:");
		Console.WriteLine($"Initial velocity {initial}");
		Console.WriteLine($"Rapidity {rapidity}");
		Console.WriteLine($"Doubled rapidity {doubled.Value}");
		Console.WriteLine($"Final velocity {velocity}");

		// Lets go to Andromeda Galaxy, 2.5 million light years away at 1g
		var year = B(rl.Days(365.25));
		var distance = B(rl.LightYears(2_500_000.0));
		var accel = rl.G;
		var full_burn_sec = B(rl.RelativisticTimeForDistance(accel, distance.Value));
		var flip_burn_sec = B(rl.RelativisticTimeForDistance(accel, (distance / 2).Value));

		var full_burn_years = full_burn_sec / year;
		var flip_burn_years = flip_burn_sec * 2 / year;

		var peak_velocity_full_burn = B(rl.RelativisticVelocity(accel, full_burn_sec.Value)) / rl.C;
		var peak_velocity_flip_burn = B(rl.RelativisticVelocity(accel, flip_burn_sec.Value)) / rl.C;

		Console.WriteLine($"Years at 1g, burning all the way {full_burn_years.Value}");
		Console.WriteLine($"Peak velocity full burn {peak_velocity_full_burn.Value} c");
		Console.WriteLine();
		Console.WriteLine($"Years at 1g, flip and burn half way {flip_burn_years.Value}");
		Console.WriteLine($"Peak velocity flip {peak_velocity_flip_burn.Value} c");

		// Time dilation and length contraction
		var veryfast = rl.FractionOfC(0.9999);
		var lotentz = rl.LorentzFactor(veryfast);
		var length = B(1) / lotentz;
		var time = B(1) * lotentz;

		Console.WriteLine();
		Console.WriteLine("Time dilation and length contraction at 0.9999c:");
		Console.WriteLine($"Lorentz factor {lotentz}");
		Console.WriteLine($"Length contraction 1m becomes {length}m");
		Console.WriteLine($"Time dilation 1 second becomes {time}s");

		// spacetime intervals
		var interval1 = rl.SpacetimeInterval1D((1.1, 1), (10, 5));
		var interval2 = rl.SpacetimeInterval3D((2, 1, 1, 1), (10, 5, 10, 100));
		var interval3 = rl.SpacetimeInterval1D((1.1, 1), (1.1, 5));
		var interval4 = rl.SpacetimeInterval1D((0, 0), (2, rl.C * 2));

		Console.WriteLine();
		Console.WriteLine($"Spacetime interval: {interval1}");
		Console.WriteLine($"Spacetime interval: {interval2}");
		Console.WriteLine($"Spacetime interval: {interval3}");
		Console.WriteLine($"Spacetime interval: {interval4}");
	}

	private static void TrigTests()
	{
		var rl = new EFloatRelativity();
		var ctx = rl.Context;
		BigFloat.DefaultContext = ctx; // using the same context for BigFloats

		var value = EFloat.FromString("0.5", ctx);
		var value2 = EFloat.FromString("1.123", ctx);
		var value3 = EFloat.FromString("23.123", ctx);

		var cosh = value.Cosh(ctx);
		var sinh = value.Sinh(ctx);
		var tanh = value.Tanh(ctx);
		var acosh = value2.Acosh(ctx);
		var asinh = value.Asinh(ctx);
		var atanh = value.Atanh(ctx);

		var cosh2 = value3.Cosh(ctx);
		var sinh2 = value3.Sinh(ctx);
		var tanh2 = value3.Tanh(ctx);
		var acosh2 = value3.Acosh(ctx);
		var asinh2 = value3.Asinh(ctx);

		Console.WriteLine();
		Console.WriteLine("Trig tests:");
		Console.WriteLine($"Cosh(0.5) = {cosh}");
		Console.WriteLine($"Sinh(0.5) = {sinh}");
		Console.WriteLine($"Tanh(0.5) = {tanh}");
		Console.WriteLine($"Acosh(1.123) = {acosh}");
		Console.WriteLine($"Asinh(0.5) = {asinh}");
		Console.WriteLine($"Atanh(0.5) = {atanh}");

		Console.WriteLine($"Cosh(23.123) = {cosh2}");
		Console.WriteLine($"Sinh(23.123) = {sinh2}");
		Console.WriteLine($"Tanh(23.123) = {tanh2}");
		Console.WriteLine($"Acosh(23.123) = {acosh2}");
		Console.WriteLine($"Asinh(23.123) = {asinh2}");
	}

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private static BigFloat B(EFloat f) => BigFloat.Build(f, Program.ctx ?? throw new InvalidOperationException());

	/// <summary>
	/// Calculate the time to fall a given height under gravity, using the formula t = sqrt(2h/g).
	/// Non-relativistic
	/// </summary>
	/// <param name="height">Height to fall (metres)</param>
	/// <param name="g">Acceleration due to gravity (m/s^2)</param>
	/// <returns>Seconds to fall</returns>
	private static double TimeToFall(double height, double g = 9.80665)
	{
		// this is just proper time for an object moving at `g` acceletation for `height` coordinate distance
		// but not relativistic

#pragma warning disable IDE0046 // Convert to conditional expression
		if (height < 0) {
			throw new ArgumentOutOfRangeException(nameof(height), "Height must be positive");
		}
		if (g <= 0) {
			throw new ArgumentOutOfRangeException(nameof(g), "Gravity must be positive");
		}
#pragma warning restore IDE0046 // Convert to conditional expression

		return Math.Sqrt(2 * height / g);
	}

	/// <summary>
	/// Calculate the velocity after falling a given height under gravity, using the formula v = sqrt(2gh).
	/// </summary>
	/// <param name="height">Height to fall (metres)</param>
	/// <param name="g">Acceleration due to gravity (m/s^2)</param>
	/// <returns>Velocity (m/s)</returns>
	private static double VelocityAfterFalling(double height, double g = 9.80665)
	{
		// this is just velocity for an object moving at `g` acceletation for `height` coordinate distance
		// but not relativistic

#pragma warning disable IDE0046 // Convert to conditional expression
		if (height < 0) {
			throw new ArgumentOutOfRangeException(nameof(height), "Height must be positive");
		}
		if (g <= 0) {
			throw new ArgumentOutOfRangeException(nameof(g), "Gravity must be positive");
		}
#pragma warning restore IDE0046 // Convert to conditional expression

		return Math.Sqrt(2 * g * height);
	}
}
