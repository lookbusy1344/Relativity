using PeterO.Numbers;
using System;
using System.Runtime.CompilerServices;

namespace Relativity;

// These utilities are based on the EFloat class from PeterO.Numbers, which is a high-precision arbitrary-precision decimal class
// NOTE Because of the manually implemented hyperbolic trig functions, this class is not as precise as the others in this project!

internal sealed class EFloatRelativity
{
	public static readonly EFloat C = EFloat.FromString("299792458"); // m/s
	public static readonly EFloat C_SQUARED = C.Pow(2); // c^2
	public static readonly EFloat G = EFloat.FromString("9.80665"); // m/s^2
	public static readonly EFloat LIGHT_YR = EFloat.FromString("9460730472580800"); // metres
	public static readonly EFloat AU = EFloat.FromString("149597870700"); // metres

	private static readonly BigFloat Half = B(EFloat.FromString("0.5"));
	private static readonly BigFloat One = B(EFloat.One);
	private static readonly BigFloat C_B = B(C);
	private static readonly BigFloat CSQUARED_B = B(C_SQUARED);

	/// <summary>
	/// The context for all calculations
	/// </summary>
	public EContext Context { get; }

	/// <summary>
	/// Create a new EFloatRelativity instance with default context
	/// </summary>
	public EFloatRelativity()
	{
		this.Context = BuildContext();
		BigFloat.DefaultContext = this.Context;
	}

	/// <summary>
	/// Create a new EFloatRelativity instance with custom precision
	/// </summary>
	public EFloatRelativity(int precision)
	{
		this.Context = BuildContext(precision);
		BigFloat.DefaultContext = this.Context;
	}

	public static EContext BuildContext(int precision = 300)
	{
		// Default exponent range is from -2147483648 to 2147483647, here set them to -9000000000 to 9000000000
		var exponentMax = EInteger.FromString("9000000000");
		return EContext.ForPrecisionAndRounding(precision, ERounding.HalfEven)
			.WithBigExponentRange(EInteger.Zero.Subtract(exponentMax), exponentMax);
	}

	/// <summary>
	/// Check this velocity is less than C in m/s
	/// </summary>
	private static EFloat CheckVelocity(EFloat velocity, string msg = "Velocity must be less than C")
	{
		if (velocity.Abs().CompareTo(C) >= 0) {
			throw new ArgumentException(msg);
		}

		return velocity;
	}

	/// <summary>
	/// Turn given number of days into seconds
	/// </summary>
	public EFloat Days(double days) => EFloat.FromDouble(days).Multiply(60 * 60 * 24, this.Context);

	/// <summary>
	/// Turn given number of light years into metres
	/// </summary>
	public EFloat LightYears(double lightYears) => EFloat.FromDouble(lightYears).Multiply(LIGHT_YR, this.Context);

	/// <summary>
	/// Calculate relativistic velocity for a given acceleration and proper time
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="tau">Proper time in s</param>
	/// <returns>Velocity in m/s</returns>
	public EFloat RelativisticVelocity(EFloat accel, EFloat tau) =>
		// c * tanh(a * tau / c)
		//C.Multiply(accel.Multiply(tau, this.Context).Divide(C, this.Context).Tanh(this.Context), this.Context);
		(C_B * (B(accel) * B(tau) / C_B).Tanh()).Value;

	/// <summary>
	/// Calculate distance travelled for a given acceleration and proper time
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="tau">Proper time in s</param>
	/// <returns>Distance in m</returns>
	public EFloat RelativisticDistance(EFloat accel, EFloat tau)
	{
		// (csquared / a) * (cosh(a * tau / c) - one)
		//var inner = accel.Multiply(tau, this.Context).Divide(C, this.Context);
		//return C_SQUARED.Divide(accel, this.Context).Multiply(inner.Cosh(this.Context).Subtract(EFloat.One, this.Context), this.Context);
		return ((CSQUARED_B / B(accel)) * (B(accel) * B(tau) / C_B).Cosh() - 1).Value;
	}

	/// <summary>
	/// Calculate proper time for a given acceleration and distance, how long it takes to travel that distance
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="dist">Distance in m</param>
	/// <returns>Proper time in s</returns>
	public EFloat RelativisticTimeForDistance(EFloat accel, EFloat dist)
	{
		// (c / a) * acosh((dist * a) / csquared + one)
		//var inner = dist.Multiply(accel, this.Context).Divide(C_SQUARED, this.Context).Add(1);
		//return C.Divide(accel, this.Context).Multiply(inner.Acosh(this.Context), this.Context);
		return (C_B / B(accel) * ((B(dist) * B(accel) / CSQUARED_B + 1).Acosh())).Value;
	}

	/// <summary>
	/// Calculate distance travelled for a given acceleration and velocity. Newtonian physics not relativistic
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="time">Time in s</param>
	/// <returns>Distance in m</returns>
	public EFloat SimpleDistance(EFloat accel, EFloat time) =>
		// 0.5 * a * t**2
		//Half.Multiply(accel, this.Context).Multiply(time.Pow(2), this.Context);
		(Half * B(accel) * B(time).Pow(2)).Value;

	/// <summary>
	/// Calculate the rapidity for a given velocity
	/// </summary>
	/// <param name="velocity">Velocify in m/s</param>
	/// <returns>Rapidity</returns>
	public EFloat RapidityFromVelocity(EFloat velocity) =>
		// atanh(velocity / c)
		//CheckVelocity(velocity).Divide(C, this.Context).Atanh(this.Context);
		(B(CheckVelocity(velocity)) / C_B).Atanh().Value;

	/// <summary>
	/// Calculate velocity for a given rapidity
	/// </summary>
	/// <param name="rapidity">Rapidity</param>
	/// <returns>Velocity in m/s</returns>
	public EFloat VelocityFromRapidity(EFloat rapidity) =>
		// c * tanh(rapidity)
		//CheckVelocity(C.Multiply(rapidity.Tanh(this.Context), this.Context), "Calculated velocity at or above C, increase EContext precision");
		CheckVelocity((C_B * B(rapidity).Tanh()).Value, "Calculated velocity at or above C, increase EContext precision");

	/// <summary>
	/// Calculate coordinate time for a given acceleration and proper time
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="tau">Proper time in s</param>
	/// <returns>Coordinate time in s</returns>
	public EFloat CoordinateTime(EFloat accel, EFloat tau) =>
		// (c / a) * sinh(a * tau / c)
		//C.Divide(accel, this.Context).Multiply(accel.Multiply(tau, this.Context).Divide(C, this.Context).Sinh(this.Context), this.Context);
		((C_B / B(accel)) * (B(accel) * B(tau) / C_B).Sinh()).Value;

	/// <summary>
	/// Calculate Lorentz factor for a given velocity
	/// </summary>
	/// <param name="velocity">Velocity in m/s</param>
	/// <returns>Lorentz factor</returns>
	public EFloat LorentzFactor(EFloat velocity)
	{
		// 1 / sqrt(1 - (velocity / c) ** 2)
		//var inner = EFloat.One.Subtract(CheckVelocity(velocity).Divide(C, this.Context).Pow(2, this.Context), this.Context);
		//return EFloat.One.Divide(inner.Sqrt(this.Context), this.Context);
		return (One / (One - (B(CheckVelocity(velocity)) / C_B).Pow(2)).Sqrt()).Value;
	}

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private static BigFloat B(EFloat f) => BigFloat.FromEFloat(f);
}
