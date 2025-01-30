namespace Relativity;

using PeterO.Numbers;
using UnitsNet;

#pragma warning disable IDE0059 // Unnecessary assignment of a value

internal static class Program
{
	private static void Main()
	{
		Uom();
		BigFloats();
	}

	private static void Uom()
	{
		var oneG = Acceleration.FromStandardGravity(1.0); // 9.80665 m/s^2
		var oneYear = Duration.FromDays(365);
		var finalVelocity = Tools.RelativisticAcceleration(oneG, oneYear);
		var check = Tools.RelativisticAccelerationAsFraction(oneG, oneYear);
		var naively = oneG * oneYear;
		var asFraction = new FractionOfC(finalVelocity);
		var naiveAsFraction = new FractionOfC(naively, false);
		Console.WriteLine($"Velocity after 1 year at 1G is {asFraction}");
		Console.WriteLine($"Check {check}");
		Console.WriteLine($"Non-relativistic naive calc would be {naiveAsFraction}");
	}

	private static void BigFloats()
	{
		// default exponent range is from -2147483648 to 2147483647
		//var exponentMax = EInteger.FromString("9000000000"); // -9000000000 to 9000000000
		//var ctx = EContext.ForPrecision(300)
		//	.WithRounding(ERounding.HalfEven)
		//	.WithBigExponentRange(EInteger.Zero.Subtract(exponentMax), exponentMax);

		var rl = new EFloatRelativity();

		var initial = EFloat.FromString("299792457.9999999");
		var rapidity = rl.RapidityFromVelocity(initial);
		var doubled = rapidity.Multiply(2, rl.Context);
		var velocity = rl.VelocityFromRapidity(doubled);

		Console.WriteLine($"Initial velocity {initial}");
		Console.WriteLine($"Rapidity {rapidity}");
		Console.WriteLine($"Doubled rapidity {doubled}");
		Console.WriteLine($"Final velocity {velocity}");
	}
}