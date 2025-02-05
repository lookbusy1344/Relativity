﻿namespace Relativity;

using PeterO.Numbers;
using System.Runtime.CompilerServices;
using UnitsNet;

#pragma warning disable IDE0059 // Unnecessary assignment of a value

internal static class Program
{
	private static void Main()
	{
		Uom();
		BigFloats();
		TrigTests();
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

		var initial = EFloat.FromString("299792457.9999999");
		var rapidity = rl.RapidityFromVelocity(initial);
		var doubled = B(rapidity) * 2;
		var velocity = rl.VelocityFromRapidity(doubled);

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
		var full_burn_sec = B(rl.RelativisticTimeForDistance(accel, distance));
		var flip_burn_sec = B(rl.RelativisticTimeForDistance(accel, distance / 2));

		var full_burn_years = full_burn_sec / year;
		var flip_burn_years = flip_burn_sec * 2 / year;

		var peak_velocity_full_burn = B(rl.RelativisticVelocity(accel, full_burn_sec)) / rl.C;
		var peak_velocity_flip_burn = B(rl.RelativisticVelocity(accel, flip_burn_sec)) / rl.C;

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
	private static BigFloat B(EFloat f) => BigFloat.FromEFloat(f);
}