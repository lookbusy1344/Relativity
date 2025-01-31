namespace Relativity;

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
		EmbeddedContext();
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

		var initial = EFloat.FromString("299792457.9999999");
		var rapidity = rl.RapidityFromVelocity(initial);
		var doubled = rapidity.Multiply(2, ctx);
		var velocity = rl.VelocityFromRapidity(doubled);

		Console.WriteLine();
		Console.WriteLine("BigFloats:");
		Console.WriteLine($"Initial velocity {initial}");
		Console.WriteLine($"Rapidity {rapidity}");
		Console.WriteLine($"Doubled rapidity {doubled}");
		Console.WriteLine($"Final velocity {velocity}");

		// Lets go to Andromeda Galaxy, 2.5 million light years away at 1g
		var year = rl.Days(365.25);
		var distance = rl.LightYears(2_500_000.0);
		var accel = EFloatRelativity.G;
		var full_burn_sec = rl.RelativisticTimeForDistance(accel, distance);
		var flip_burn_sec = rl.RelativisticTimeForDistance(accel, distance.Divide(2));

		var full_burn_years = full_burn_sec.Divide(year, ctx);
		var flip_burn_years = flip_burn_sec.Multiply(2).Divide(year, ctx);

		var peak_velocity_full_burn = rl.RelativisticVelocity(accel, full_burn_sec).Divide(EFloatRelativity.C, ctx);
		var peak_velocity_flip_burn = rl.RelativisticVelocity(accel, flip_burn_sec).Divide(EFloatRelativity.C, ctx);

		Console.WriteLine($"Years at 1g, burning all the way {full_burn_years}");
		Console.WriteLine($"Peak velocity full burn {peak_velocity_full_burn} c");
		Console.WriteLine();
		Console.WriteLine($"Years at 1g, flip and burn half way {flip_burn_years}");
		Console.WriteLine($"Peak velocity flip {peak_velocity_flip_burn} c");
	}

	private static void EmbeddedContext()
	{
		var ctx = EFloatRelativity.BuildContext();
		EFloatWithContext.DefaultContext = ctx;

		var ten = EFloat.FromInt32(10);
		var twenty = EFloat.FromInt32(20);
		var thirty = EFloat.FromInt32(30);
		var pi = EFloat.FromString("3.14159");

		// is it a good idea to implicitly convert EFloat to EFloatWithContext?
		// also consider making the wrapper a readonly struct
		var sum = B(ten) + B(twenty) * thirty / pi;

		Console.WriteLine();
		Console.WriteLine($"Results of EFloatWithContext = {sum.Value}");
	}

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private static EFloatWithContext B(EFloat f) => EFloatWithContext.FromEFloat(f);
}